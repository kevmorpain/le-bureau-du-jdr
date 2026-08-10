import { and, eq, inArray, lte } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import { classNameFromSlug } from '~~/shared/rules/classSlugs'
import { SKILL_KEYS } from '~~/shared/rules/skills'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { OptionSource } from '~~/shared/rules/choices'
import type { Formula } from '~~/shared/utils/formula'
import type { Catalog, CatalogProgression, ResolvedOption } from '~~/shared/rules/resolve'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'

/**
 * Loader du CATALOGUE (lot 5b) — construit la tranche cachable que `resolveChoices`
 * (`shared/rules/resolve.ts`) consomme : les `progression` rattachées à leur classe/sous-classe
 * propriétaire, avec pour chaque `optionSource` cachable son ensemble d'options PRÉ-RÉSOLU —
 * feature_group avec les prérequis + `levelRequired` de chaque option (que le filtre
 * d'éligibilité de `resolve()` exploitera), subclasses, spells (slug → classe → `spell_classes`),
 * feats, enum, skills. `proficient_skills` n'a PAS d'options ici : elles se résolvent live contre
 * l'état du perso dans `resolveChoices` (cf. rules-engine.md §5).
 *
 * ⚠️ Tables NEUVES sans `relations()` (progression) → lecture via `srcSchema` + `.select().from()`
 * explicites, jamais `db.query.X.with:{…}` (cf. CLAUDE.md « hub:db schema cache »). Le `db` est
 * INJECTÉ — le `db` de `hub:db` en prod (⚠️ PAS `useDrizzle()`, cassé, cf. server/utils/drizzle.ts),
 * libsql en mémoire en test — pour la testabilité.
 */

// Instance drizzle SQLite, quel que soit le driver (D1 en prod, libsql en test). Les génériques
// sont volontairement `any` : D1 et libsql ont des TRunResult/TFullSchema différents, et seul le
// query-builder (`.select().from()`) est utilisé ici — indépendant de ces génériques.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export interface BuildCatalogOptions {
  /** Restreindre aux points de choix possédés par ces classes (id). Défaut : toutes. */
  classIds?: number[]
  /** Restreindre aux points de choix possédés par ces espèces (id) — choix de lignée (D17). */
  speciesIds?: number[]
}

export async function buildCatalog(db: Db, opts: BuildCatalogOptions = {}): Promise<Catalog> {
  // 1. Progressions jointes à leur feature propriétaire (classe / sous-classe / niveau requis).
  const rows = await db
    .select({
      progressionId: srcSchema.progression.id,
      featureId: srcSchema.progression.featureId,
      kind: srcSchema.progression.kind,
      count: srcSchema.progression.count,
      optionSource: srcSchema.progression.optionSource,
      replaceable: srcSchema.progression.replaceable,
      ownerClassId: srcSchema.features.classId,
      ownerSubclassId: srcSchema.features.subclassId,
      ownerLevelRequired: srcSchema.features.levelRequired,
      // Édition du propriétaire de la progression : filtre les options cachables (feats /
      // feature_group / spells) sur la même édition → aucune fuite 5.5 dans un parcours 2014.
      ownerRuleset: srcSchema.features.ruleset,
    })
    .from(srcSchema.progression)
    .innerJoin(srcSchema.features, eq(srcSchema.progression.featureId, srcSchema.features.id))

  // Résoudre la classe propriétaire des progressions possédées par une SOUS-CLASSE (aucune
  // aujourd'hui — l'Occultiste ne pose que des choix au niveau classe — mais on gère le cas).
  const subclassIds = [...new Set(
    rows.filter(r => r.ownerClassId == null && r.ownerSubclassId != null).map(r => r.ownerSubclassId!),
  )]
  const classIdBySubclass = new Map<number, number>()
  if (subclassIds.length) {
    const subs = await db
      .select({ id: srcSchema.subclasses.id, classId: srcSchema.subclasses.classId })
      .from(srcSchema.subclasses)
      .where(inArray(srcSchema.subclasses.id, subclassIds))
    for (const s of subs) classIdBySubclass.set(s.id, s.classId)
  }

  // Résoudre l'ESPÈCE propriétaire des progressions possédées par une feature d'espèce
  // (species_trait liée via species_features) — celles sans classe NI sous-classe (choix de
  // lignée, D17). L'owner d'une progression est une classe/sous-classe OU une espèce.
  const orphanFeatureIds = [...new Set(
    rows.filter(r => r.ownerClassId == null && r.ownerSubclassId == null).map(r => r.featureId),
  )]
  const speciesIdByFeature = new Map<number, number>()
  if (orphanFeatureIds.length) {
    const links = await db
      .select({ featureId: srcSchema.speciesFeatures.featureId, speciesId: srcSchema.speciesFeatures.speciesId })
      .from(srcSchema.speciesFeatures)
      .where(inArray(srcSchema.speciesFeatures.featureId, orphanFeatureIds))
    for (const l of links) speciesIdByFeature.set(l.featureId, l.speciesId)
  }

  const progressions: CatalogProgression[] = []
  for (const r of rows) {
    const ownerClassId = r.ownerClassId
      ?? (r.ownerSubclassId != null ? classIdBySubclass.get(r.ownerSubclassId) : undefined)
    const ownerSpeciesId = ownerClassId == null ? speciesIdByFeature.get(r.featureId) : undefined
    if (ownerClassId == null && ownerSpeciesId == null) continue // owner non résoluble → on ignore
    if (ownerClassId != null && opts.classIds && !opts.classIds.includes(ownerClassId)) continue
    if (ownerSpeciesId != null && opts.speciesIds && !opts.speciesIds.includes(ownerSpeciesId)) continue

    const optionSource = r.optionSource as OptionSource
    const options = await resolveOptions(db, optionSource, { ownerClassId, ownerSpeciesId, ruleset: r.ownerRuleset })

    progressions.push({
      progressionId: r.progressionId,
      ownerFeatureId: r.featureId,
      ...(ownerClassId != null ? { ownerClassId } : {}),
      ...(ownerSpeciesId != null ? { ownerSpeciesId } : {}),
      ownerSubclassId: r.ownerSubclassId ?? undefined,
      ownerLevelRequired: r.ownerLevelRequired ?? 1,
      kind: r.kind,
      count: r.count as Formula,
      optionSource,
      replaceable: r.replaceable,
      ...(options !== undefined ? { options } : {}),
    })
  }

  return { progressions }
}

/**
 * Pré-résout l'ensemble d'options d'un `optionSource` cachable. Renvoie `undefined` pour les
 * sources résolues live contre l'état du perso (`proficient_skills`) ou pas encore cataloguées
 * (languages/tools/abilities), auquel cas `resolveChoices` s'en charge ou n'a rien à proposer.
 * `owner` porte l'id de la classe propriétaire (`subclasses`) ou de l'espèce propriétaire
 * (`lineages`, D17) — l'un ou l'autre selon l'owner de la progression — ET son `ruleset` :
 * les sources cachables globales (feats / feature_group / spells) sont filtrées dessus pour
 * qu'un point de choix 2014 ne propose jamais une entité 5.5 (et réciproquement). Les sources
 * parent-gated (subclasses / lineages) sont déjà édition-spécifiques via leur owner.
 */
async function resolveOptions(db: Db, source: OptionSource, owner: { ownerClassId?: number, ownerSpeciesId?: number, ruleset: Ruleset }): Promise<ResolvedOption[] | undefined> {
  switch (source.type) {
    case 'feature_group': {
      const feats = await db
        .select({
          id: srcSchema.features.id,
          levelRequired: srcSchema.features.levelRequired,
          prerequisites: srcSchema.features.prerequisites,
        })
        .from(srcSchema.features)
        .where(and(eq(srcSchema.features.tag, source.group), eq(srcSchema.features.ruleset, owner.ruleset)))
      return feats.map(f => ({
        featureId: f.id,
        ...(f.levelRequired != null ? { levelRequired: f.levelRequired } : {}),
        ...(f.prerequisites ? { prerequisites: f.prerequisites as FeaturePrerequisite } : {}),
      }))
    }

    case 'subclasses': {
      if (owner.ownerClassId == null) return []
      const subs = await db
        .select({ id: srcSchema.subclasses.id })
        .from(srcSchema.subclasses)
        .where(eq(srcSchema.subclasses.classId, owner.ownerClassId))
      return subs.map(s => ({ subclassId: s.id }))
    }

    case 'lineages': {
      // Sous-races 2014 / lignées 2024 de l'espèce propriétaire (D17).
      if (owner.ownerSpeciesId == null) return []
      const lineages = await db
        .select({ id: srcSchema.speciesLineages.id })
        .from(srcSchema.speciesLineages)
        .where(eq(srcSchema.speciesLineages.speciesId, owner.ownerSpeciesId))
      return lineages.map(l => ({ lineageId: l.id }))
    }

    case 'spells': {
      const className = classNameFromSlug(source.spellClass)
      if (!className) return []
      // Classe de la liste résolue par (nom, ruleset) — déterministe entre éditions ; puis
      // liens de liste ET sort filtrés sur la même édition (spell_classes.ruleset + spells.ruleset).
      const [cls] = await db
        .select({ id: srcSchema.classes.id })
        .from(srcSchema.classes)
        .where(and(eq(srcSchema.classes.name, className), eq(srcSchema.classes.ruleset, owner.ruleset)))
        .limit(1)
      if (!cls) return []
      const conds = [
        eq(srcSchema.spellClasses.classId, cls.id),
        eq(srcSchema.spellClasses.ruleset, owner.ruleset),
        eq(srcSchema.spells.ruleset, owner.ruleset),
      ]
      if (source.cantripsOnly) conds.push(eq(srcSchema.spells.level, 0))
      else if (source.maxLevel != null) conds.push(lte(srcSchema.spells.level, source.maxLevel))
      const spellRows = await db
        .select({ id: srcSchema.spells.id })
        .from(srcSchema.spellClasses)
        .innerJoin(srcSchema.spells, eq(srcSchema.spellClasses.spellId, srcSchema.spells.id))
        .where(and(...conds))
      return spellRows.map(s => ({ spellId: s.id }))
    }

    case 'feats': {
      const feats = await db
        .select({ id: srcSchema.features.id, prerequisites: srcSchema.features.prerequisites })
        .from(srcSchema.features)
        .where(and(eq(srcSchema.features.featureType, 'feat'), eq(srcSchema.features.ruleset, owner.ruleset)))
      return feats.map(f => ({
        featureId: f.id,
        ...(f.prerequisites ? { prerequisites: f.prerequisites as FeaturePrerequisite } : {}),
      }))
    }

    case 'enum':
      return source.values.map(value => ({ value }))

    case 'skills': {
      const keys = source.from === 'all' ? SKILL_KEYS : source.from
      return keys.map(value => ({ value }))
    }

    case 'proficient_skills': // résolu live dans resolveChoices contre projection.proficientSkills
    case 'languages':
    case 'tools':
    case 'abilities':
    default:
      return undefined
  }
}

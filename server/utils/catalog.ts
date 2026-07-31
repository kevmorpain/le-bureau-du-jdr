import { and, eq, inArray, lte } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import { classNameFromSlug } from '~~/shared/rules/classSlugs'
import { SKILL_KEYS } from '~~/shared/rules/skills'
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
 * INJECTÉ (D1 en prod via `useDrizzle()`, libsql en mémoire en test) pour la testabilité.
 */

// Instance drizzle SQLite, quel que soit le driver (D1 en prod, libsql en test). Les génériques
// sont volontairement `any` : D1 et libsql ont des TRunResult/TFullSchema différents, et seul le
// query-builder (`.select().from()`) est utilisé ici — indépendant de ces génériques.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export interface BuildCatalogOptions {
  /** Restreindre aux points de choix possédés par ces classes (id). Défaut : toutes. */
  classIds?: number[]
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

  const progressions: CatalogProgression[] = []
  for (const r of rows) {
    const ownerClassId = r.ownerClassId
      ?? (r.ownerSubclassId != null ? classIdBySubclass.get(r.ownerSubclassId) : undefined)
    if (ownerClassId == null) continue // owner sans classe résoluble → donnée incohérente, on ignore
    if (opts.classIds && !opts.classIds.includes(ownerClassId)) continue

    const optionSource = r.optionSource as OptionSource
    const options = await resolveOptions(db, optionSource, ownerClassId)

    progressions.push({
      progressionId: r.progressionId,
      ownerFeatureId: r.featureId,
      ownerClassId,
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
 * `ownerClassId` sert à `subclasses` (les sous-classes de la classe propriétaire).
 */
async function resolveOptions(db: Db, source: OptionSource, ownerClassId: number): Promise<ResolvedOption[] | undefined> {
  switch (source.type) {
    case 'feature_group': {
      const feats = await db
        .select({
          id: srcSchema.features.id,
          levelRequired: srcSchema.features.levelRequired,
          prerequisites: srcSchema.features.prerequisites,
        })
        .from(srcSchema.features)
        .where(eq(srcSchema.features.tag, source.group))
      return feats.map(f => ({
        featureId: f.id,
        ...(f.levelRequired != null ? { levelRequired: f.levelRequired } : {}),
        ...(f.prerequisites ? { prerequisites: f.prerequisites as FeaturePrerequisite } : {}),
      }))
    }

    case 'subclasses': {
      const subs = await db
        .select({ id: srcSchema.subclasses.id })
        .from(srcSchema.subclasses)
        .where(eq(srcSchema.subclasses.classId, ownerClassId))
      return subs.map(s => ({ subclassId: s.id }))
    }

    case 'spells': {
      const className = classNameFromSlug(source.spellClass)
      if (!className) return []
      const [cls] = await db
        .select({ id: srcSchema.classes.id })
        .from(srcSchema.classes)
        .where(eq(srcSchema.classes.name, className))
        .limit(1)
      if (!cls) return []
      const conds = [eq(srcSchema.spellClasses.classId, cls.id)]
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
        .where(eq(srcSchema.features.featureType, 'feat'))
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

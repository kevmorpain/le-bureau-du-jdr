import { and, eq, inArray, isNull, lte, or } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import { classNameFromSlug } from '~~/shared/rules/classSlugs'
import { SKILL_KEYS } from '~~/shared/rules/skills'
import { LANGUAGE_KEYS } from '~~/shared/rules/languages'
import { ALL_TOOLS } from '~~/shared/rules/tools'
import type { Ruleset } from '~~/shared/rules/ruleset'
import { CORE_SOURCE } from '~~/shared/rules/source'
import type { OptionSource } from '~~/shared/rules/choices'
import type { Formula } from '~~/shared/utils/formula'
import type { Catalog, CatalogProgression, ClassGrant, ResolvedOption } from '~~/shared/rules/resolve'
import type { FeaturePrerequisite, FeatureType } from '~~/server/db/schema/features'
import type { Db } from '~~/server/utils/db'

// Génériques `any` : D1 et libsql ont des TRunResult/TFullSchema différents.

// Filtres par propriétaire ; une règle générale (`global`) est toujours incluse.
export interface BuildCatalogOptions {
  classIds?: number[]
  speciesIds?: number[]
  lineageIds?: number[]
  backgroundIds?: number[]
  extended?: boolean
}

const CLASS_GRANT_BY_FEATURE_TYPE: Partial<Record<FeatureType, ClassGrant>> = {
  proficiency_grant: 'start',
  multiclass_proficiency_grant: 'multiclass',
}

export async function buildCatalog(db: Db, opts: BuildCatalogOptions = {}): Promise<Catalog> {
  const rows = await db
    .select({
      progressionId: schema.progression.id,
      featureId: schema.progression.featureId,
      kind: schema.progression.kind,
      count: schema.progression.count,
      optionSource: schema.progression.optionSource,
      replaceable: schema.progression.replaceable,
      ownerClassId: schema.features.classId,
      ownerSubclassId: schema.features.subclassId,
      ownerLineageId: schema.features.lineageId,
      ownerFeatureType: schema.features.featureType,
      ownerLevelRequired: schema.features.levelRequired,
      // Édition du propriétaire de la progression : filtre les options cachables (feats /
      // feature_group / spells) sur la même édition → aucune fuite 5.5 dans un parcours 2014.
      ownerRuleset: schema.features.ruleset,
    })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.progression.featureId, schema.features.id))

  const subclassIds = [...new Set(
    rows.filter(r => r.ownerClassId == null && r.ownerSubclassId != null).map(r => r.ownerSubclassId!),
  )]
  const classIdBySubclass = new Map<number, number>()
  if (subclassIds.length) {
    const subs = await db
      .select({ id: schema.subclasses.id, classId: schema.subclasses.classId })
      .from(schema.subclasses)
      .where(inArray(schema.subclasses.id, subclassIds))
    for (const s of subs) classIdBySubclass.set(s.id, s.classId)
  }

  const orphanFeatureIds = [...new Set(
    rows.filter(r => r.ownerClassId == null && r.ownerSubclassId == null && r.ownerLineageId == null).map(r => r.featureId),
  )]
  const speciesIdByFeature = new Map<number, number>()
  const backgroundIdByFeature = new Map<number, number>()
  if (orphanFeatureIds.length) {
    const speciesLinks = await db
      .select({ featureId: schema.speciesFeatures.featureId, speciesId: schema.speciesFeatures.speciesId })
      .from(schema.speciesFeatures)
      .where(inArray(schema.speciesFeatures.featureId, orphanFeatureIds))
    for (const l of speciesLinks) speciesIdByFeature.set(l.featureId, l.speciesId)
    const backgroundLinks = await db
      .select({ featureId: schema.backgroundFeatures.featureId, backgroundId: schema.backgroundFeatures.backgroundId })
      .from(schema.backgroundFeatures)
      .where(inArray(schema.backgroundFeatures.featureId, orphanFeatureIds))
    for (const l of backgroundLinks) backgroundIdByFeature.set(l.featureId, l.backgroundId)
  }

  const progressions: CatalogProgression[] = []
  for (const r of rows) {
    const ownerClassId = r.ownerClassId
      ?? (r.ownerSubclassId != null ? classIdBySubclass.get(r.ownerSubclassId) : undefined)
    const ownerLineageId = ownerClassId == null ? r.ownerLineageId ?? undefined : undefined
    const isOrphan = ownerClassId == null && ownerLineageId == null
    const ownerSpeciesId = isOrphan ? speciesIdByFeature.get(r.featureId) : undefined
    const ownerBackgroundId = isOrphan && ownerSpeciesId == null ? backgroundIdByFeature.get(r.featureId) : undefined
    // Porteur sans propriétaire : règle générale, due à tout personnage (remplacement d'une maîtrise en double).
    const global = isOrphan && ownerSpeciesId == null && ownerBackgroundId == null && r.ownerFeatureType === 'choice_carrier'
    if (ownerClassId == null && ownerLineageId == null && ownerSpeciesId == null && ownerBackgroundId == null && !global) continue
    if (ownerClassId != null && opts.classIds && !opts.classIds.includes(ownerClassId)) continue
    if (ownerSpeciesId != null && opts.speciesIds && !opts.speciesIds.includes(ownerSpeciesId)) continue
    if (ownerLineageId != null && opts.lineageIds && !opts.lineageIds.includes(ownerLineageId)) continue
    if (ownerBackgroundId != null && opts.backgroundIds && !opts.backgroundIds.includes(ownerBackgroundId)) continue

    const optionSource = r.optionSource as OptionSource
    const options = await resolveOptions(db, optionSource, { ownerClassId, ownerSpeciesId, ruleset: r.ownerRuleset, extended: opts.extended ?? false })
    const classGrant = ownerClassId != null ? CLASS_GRANT_BY_FEATURE_TYPE[r.ownerFeatureType] : undefined

    progressions.push({
      progressionId: r.progressionId,
      ownerFeatureId: r.featureId,
      ...(ownerClassId != null ? { ownerClassId } : {}),
      ...(ownerSpeciesId != null ? { ownerSpeciesId } : {}),
      ...(ownerLineageId != null ? { ownerLineageId } : {}),
      ...(ownerBackgroundId != null ? { ownerBackgroundId } : {}),
      ...(classGrant ? { classGrant } : {}),
      ...(global ? { global } : {}),
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

// Les sources globales (feats / feature_group / spells) sont filtrées sur le `ruleset` de l'owner :
// un choix 2014 ne propose jamais une entité 5.5.
async function resolveOptions(db: Db, source: OptionSource, owner: { ownerClassId?: number, ownerSpeciesId?: number, ruleset: Ruleset, extended: boolean }): Promise<ResolvedOption[] | undefined> {
  switch (source.type) {
    case 'feature_group': {
      // Restreint aussi à la classe propriétaire : les styles de combat sont dupliqués par classe (sous-ensembles différents).
      const conds = [eq(schema.features.tag, source.group), eq(schema.features.ruleset, owner.ruleset)]
      if (!owner.extended) conds.push(eq(schema.features.source, CORE_SOURCE))
      if (owner.ownerClassId != null) {
        conds.push(or(eq(schema.features.classId, owner.ownerClassId), isNull(schema.features.classId))!)
      }
      const feats = await db
        .select({
          id: schema.features.id,
          levelRequired: schema.features.levelRequired,
          prerequisites: schema.features.prerequisites,
        })
        .from(schema.features)
        .where(and(...conds))
      return feats.map(f => ({
        featureId: f.id,
        ...(f.levelRequired != null ? { levelRequired: f.levelRequired } : {}),
        ...(f.prerequisites ? { prerequisites: f.prerequisites as FeaturePrerequisite } : {}),
      }))
    }

    case 'subclasses': {
      if (owner.ownerClassId == null) return []
      const subs = await db
        .select({ id: schema.subclasses.id })
        .from(schema.subclasses)
        .where(and(
          eq(schema.subclasses.classId, owner.ownerClassId),
          ...(owner.extended ? [] : [eq(schema.subclasses.source, CORE_SOURCE)]),
        ))
      return subs.map(s => ({ subclassId: s.id }))
    }

    case 'lineages': {
      if (owner.ownerSpeciesId == null) return []
      const lineages = await db
        .select({ id: schema.speciesLineages.id })
        .from(schema.speciesLineages)
        .where(and(
          eq(schema.speciesLineages.speciesId, owner.ownerSpeciesId),
          ...(owner.extended ? [] : [eq(schema.speciesLineages.source, CORE_SOURCE)]),
        ))
      return lineages.map(l => ({ lineageId: l.id }))
    }

    case 'spells': {
      const className = classNameFromSlug(source.spellClass)
      if (!className) return []
      const [cls] = await db
        .select({ id: schema.classes.id })
        .from(schema.classes)
        .where(and(eq(schema.classes.name, className), eq(schema.classes.ruleset, owner.ruleset)))
        .limit(1)
      if (!cls) return []
      const conds = [
        eq(schema.spellClasses.classId, cls.id),
        eq(schema.spellClasses.ruleset, owner.ruleset),
        eq(schema.spells.ruleset, owner.ruleset),
      ]
      if (!owner.extended) conds.push(eq(schema.spells.source, CORE_SOURCE))
      if (source.cantripsOnly) conds.push(eq(schema.spells.level, 0))
      else if (source.maxLevel != null) conds.push(lte(schema.spells.level, source.maxLevel))
      const spellRows = await db
        .select({ id: schema.spells.id })
        .from(schema.spellClasses)
        .innerJoin(schema.spells, eq(schema.spellClasses.spellId, schema.spells.id))
        .where(and(...conds))
      return spellRows.map(s => ({ spellId: s.id }))
    }

    case 'feats': {
      const conds = [eq(schema.features.featureType, 'feat'), eq(schema.features.ruleset, owner.ruleset)]
      if (!owner.extended) conds.push(eq(schema.features.source, CORE_SOURCE))
      if (source.category) conds.push(eq(schema.features.featCategory, source.category))
      const feats = await db
        .select({ id: schema.features.id, prerequisites: schema.features.prerequisites })
        .from(schema.features)
        .where(and(...conds))
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

    case 'languages':
      return (source.from ?? LANGUAGE_KEYS).map(value => ({ value }))

    case 'tools':
      return [...(source.from ?? ALL_TOOLS), ...(source.orLanguages ? LANGUAGE_KEYS : [])].map(value => ({ value }))

    case 'proficient_skills': // résolu live dans resolveChoices contre projection.proficientSkills
    case 'abilities':
    default:
      return undefined
  }
}

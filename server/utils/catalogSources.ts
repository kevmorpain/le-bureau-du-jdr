import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'
import type { Ruleset } from '~~/shared/rules/ruleset'
import { CORE_SOURCE } from '~~/shared/rules/source'
import type { AbilityKey } from '~~/shared/rules/abilities'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

type ClassRow = typeof srcSchema.classes.$inferSelect
type SubclassRow = typeof srcSchema.subclasses.$inferSelect

export type CatalogClass = ClassRow & { subclasses: SubclassRow[] }

export async function loadClasses(db: Db, ruleset: Ruleset = '5', extended = false): Promise<CatalogClass[]> {
  const rows = await db
    .select()
    .from(srcSchema.classes)
    // Le filtre `source` des sous-classes va dans le ON (pas le WHERE) : une classe socle
    // n'ayant que des sous-classes gatées doit remonter quand même (leftJoin), sa liste vide.
    .leftJoin(srcSchema.subclasses, and(
      eq(srcSchema.subclasses.classId, srcSchema.classes.id),
      ...(extended ? [] : [eq(srcSchema.subclasses.source, CORE_SOURCE)]),
    ))
    .where(and(
      eq(srcSchema.classes.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.classes.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(srcSchema.classes.id), asc(srcSchema.subclasses.name))

  const byId = new Map<number, CatalogClass>()
  for (const r of rows) {
    const cls = r.classes
    if (!byId.has(cls.id)) byId.set(cls.id, { ...cls, subclasses: [] })
    if (r.subclasses) byId.get(cls.id)!.subclasses.push(r.subclasses)
  }
  return [...byId.values()]
}

export async function loadSpecies(db: Db, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string }[]> {
  return await db
    .select({ id: srcSchema.characterSpecies.id, name: srcSchema.characterSpecies.name })
    .from(srcSchema.characterSpecies)
    .where(and(
      eq(srcSchema.characterSpecies.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.characterSpecies.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(srcSchema.characterSpecies.name))
}

// Classe résolue par `(name, ruleset)` : `subclasses` n'a pas de `ruleset` et les noms de classe seront partagés en 5.5.
export async function loadSubclasses(db: Db, className: string, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string, description: string | null }[]> {
  const [cls] = await db
    .select({ id: srcSchema.classes.id })
    .from(srcSchema.classes)
    .where(and(eq(srcSchema.classes.name, className), eq(srcSchema.classes.ruleset, ruleset)))
    .limit(1)
  if (!cls) return []

  return await db
    .select({
      id: srcSchema.subclasses.id,
      name: srcSchema.subclasses.name,
      description: srcSchema.subclasses.description,
    })
    .from(srcSchema.subclasses)
    .where(and(
      eq(srcSchema.subclasses.classId, cls.id),
      ...(extended ? [] : [eq(srcSchema.subclasses.source, CORE_SOURCE)]),
    ))
}

/**
 * Styles de combat (features-options taguées `fighting_style`) d'une classe désignée par son NOM.
 * Classe résolue par `(name, ruleset)` comme `loadSubclasses` ; classe non martiale ou inconnue → `[]`.
 */
export async function loadFightingStyles(db: Db, className: string, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string, description: string | null }[]> {
  const [cls] = await db
    .select({ id: srcSchema.classes.id })
    .from(srcSchema.classes)
    .where(and(eq(srcSchema.classes.name, className), eq(srcSchema.classes.ruleset, ruleset)))
    .limit(1)
  if (!cls) return []

  return await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
    })
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.classId, cls.id),
      eq(srcSchema.features.tag, 'fighting_style'),
      eq(srcSchema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.features.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(srcSchema.features.id))
}

export async function loadFeats(db: Db, ruleset: Ruleset = '5', extended = false) {
  const feats = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      prerequisites: srcSchema.features.prerequisites,
      featCategory: srcSchema.features.featCategory, // catégorie 2024 (null pour les dons 2014)
    })
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.featureType, 'feat'),
      eq(srcSchema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.features.source, CORE_SOURCE)]),
    ))

  if (feats.length === 0) return []

  const featIds = feats.map(f => f.id)
  const links = await db
    .select({ featureId: srcSchema.featureEffects.featureId, effect: srcSchema.effects })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(inArray(srcSchema.featureEffects.featureId, featIds))

  const effectsByFeat = new Map<number, (typeof srcSchema.effects.$inferSelect)[]>()
  for (const link of links) {
    if (!effectsByFeat.has(link.featureId)) effectsByFeat.set(link.featureId, [])
    effectsByFeat.get(link.featureId)!.push(link.effect)
  }

  return feats
    .map(f => ({ ...f, effects: effectsByFeat.get(f.id) ?? [] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export async function loadInvocations(db: Db, ruleset: Ruleset = '5', extended = false) {
  const features = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      levelRequired: srcSchema.features.levelRequired,
      prerequisites: srcSchema.features.prerequisites,
    })
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.featureType, 'eldritch_invocation'),
      eq(srcSchema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.features.source, CORE_SOURCE)]),
    ))

  if (features.length === 0) return []

  const featureIds = features.map(f => f.id)
  const effectRows = await db
    .select({
      featureId: srcSchema.featureEffects.featureId,
      type: srcSchema.effects.type,
      value: srcSchema.effects.value,
    })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(inArray(srcSchema.featureEffects.featureId, featureIds))

  const effectsByFeature = new Map<number, Effect[]>()
  for (const row of effectRows) {
    const list = effectsByFeature.get(row.featureId) ?? []
    list.push({ type: row.type, value: row.value } as Effect)
    effectsByFeature.set(row.featureId, list)
  }

  return features.map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    levelRequired: f.levelRequired ?? 1,
    prerequisites: f.prerequisites as FeaturePrerequisite | null,
    effects: effectsByFeature.get(f.id) ?? [],
  }))
}

// Descriptives : pas d'effets bakés, le joueur applique en jeu.
export async function loadMetamagic(db: Db, ruleset: Ruleset = '5', extended = false) {
  return await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
    })
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.tag, 'metamagic'),
      eq(srcSchema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(srcSchema.features.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(srcSchema.features.name))
}

// Avec `characterSheetId`, ajoute les historiques homebrew de la fiche (non cachable).
export async function loadBackgrounds(db: Db, characterSheetId?: number, ruleset: Ruleset = '5', extended = false) {
  return await db
    .select()
    .from(srcSchema.backgrounds)
    .where(
      and(
        eq(srcSchema.backgrounds.ruleset, ruleset),
        characterSheetId
          ? or(isNull(srcSchema.backgrounds.characterSheetId), eq(srcSchema.backgrounds.characterSheetId, characterSheetId))
          : isNull(srcSchema.backgrounds.characterSheetId),
        ...(extended ? [] : [eq(srcSchema.backgrounds.source, CORE_SOURCE)]),
      ),
    )
    .orderBy(srcSchema.backgrounds.name)
}

// Un sort porte son propre `ruleset` (description/effets divergent entre 2014 et 2024).
export async function loadSpells(db: Db, opts: { className?: string, ruleset?: Ruleset, extended?: boolean } = {}) {
  const ruleset = opts.ruleset ?? '5'
  const sourceFilter = opts.extended ? [] : [eq(srcSchema.spells.source, CORE_SOURCE)]

  if (opts.className) {
    const rows = await db
      .select({ spell: srcSchema.spells, school: srcSchema.magicSchools })
      .from(srcSchema.spells)
      .leftJoin(srcSchema.magicSchools, eq(srcSchema.spells.schoolId, srcSchema.magicSchools.id))
      .leftJoin(srcSchema.spellClasses, eq(srcSchema.spellClasses.spellId, srcSchema.spells.id))
      .leftJoin(srcSchema.classes, eq(srcSchema.spellClasses.classId, srcSchema.classes.id))
      .where(and(
        eq(srcSchema.classes.name, opts.className),
        eq(srcSchema.classes.ruleset, ruleset),
        eq(srcSchema.spellClasses.ruleset, ruleset),
        eq(srcSchema.spells.ruleset, ruleset),
        ...sourceFilter,
      ))
      .orderBy(asc(srcSchema.spells.level), asc(srcSchema.spells.name))
    return rows.map(r => ({ ...r.spell, school: r.school }))
  }

  const rows = await db
    .select({ spell: srcSchema.spells, school: srcSchema.magicSchools })
    .from(srcSchema.spells)
    .leftJoin(srcSchema.magicSchools, eq(srcSchema.spells.schoolId, srcSchema.magicSchools.id))
    .where(and(
      eq(srcSchema.spells.ruleset, ruleset),
      ...sourceFilter,
    ))
    .orderBy(asc(srcSchema.spells.level), asc(srcSchema.spells.name))
  return rows.map(r => ({ ...r.spell, school: r.school }))
}

export interface CatalogLineage {
  id: number
  name: string
  description: string | null
  /** Bonus de carac. COMBINÉS base ⊕ lignée (le builder n'applique que ceux de la sous-race). */
  abilityBonuses: Partial<Record<AbilityKey, number>>
  speed: number
  darkvision: number | null
  traits: string[]
  /** Effets PROPRES à la lignée (non combinés, contrairement aux bonus) : ceux de la base sont sur l'espèce. */
  effects: Effect[]
}

export interface CatalogSpeciesRich {
  id: number
  name: string
  speed: number
  size: string
  effects: Effect[]
  lineages: CatalogLineage[]
}

function abilityBonusesFrom(effects: { type: string, value: unknown }[]): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const e of effects) {
    if (e.type !== 'ability_increase') continue
    const v = e.value as { ability?: AbilityKey, amount?: number } | null
    if (v?.ability && typeof v.amount === 'number') bonuses[v.ability] = (bonuses[v.ability] ?? 0) + v.amount
  }
  return bonuses
}

// `lineages: []` pour une espèce sans lignée (le builder retombe alors sur son blob `RaceData`).
export async function loadSpeciesLineages(db: Db, speciesId: number, extended = false): Promise<CatalogSpeciesRich | null> {
  const [base] = await db
    .select({ id: srcSchema.characterSpecies.id, name: srcSchema.characterSpecies.name, speed: srcSchema.characterSpecies.speed, size: srcSchema.characterSpecies.size })
    .from(srcSchema.characterSpecies)
    .where(eq(srcSchema.characterSpecies.id, speciesId))
    .limit(1)
  if (!base) return null

  const baseEffects = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.speciesFeatures)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.speciesFeatures.featureId))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(eq(srcSchema.speciesFeatures.speciesId, speciesId))
  const baseAbilityBonuses = abilityBonusesFrom(baseEffects)

  const lineages = await db
    .select({ id: srcSchema.speciesLineages.id, name: srcSchema.speciesLineages.name, description: srcSchema.speciesLineages.description })
    .from(srcSchema.speciesLineages)
    .where(and(
      eq(srcSchema.speciesLineages.speciesId, speciesId),
      ...(extended ? [] : [eq(srcSchema.speciesLineages.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(srcSchema.speciesLineages.id))
  const meta = { id: base.id, name: base.name, speed: base.speed, size: base.size, effects: baseEffects as Effect[] }
  if (!lineages.length) return { ...meta, lineages: [] }

  const lineageIds = lineages.map(l => l.id)
  const featRows = await db
    .select({ id: srcSchema.features.id, name: srcSchema.features.name, lineageId: srcSchema.features.lineageId })
    .from(srcSchema.features)
    .where(inArray(srcSchema.features.lineageId, lineageIds))
  const featIds = featRows.map(f => f.id)
  const effRows = featIds.length
    ? await db
        .select({ featureId: srcSchema.featureEffects.featureId, type: srcSchema.effects.type, value: srcSchema.effects.value })
        .from(srcSchema.featureEffects)
        .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
        .where(inArray(srcSchema.featureEffects.featureId, featIds))
    : []

  const effectsByFeat = new Map<number, { type: string, value: unknown }[]>()
  for (const r of effRows) {
    const list = effectsByFeat.get(r.featureId) ?? []
    list.push({ type: r.type, value: r.value })
    effectsByFeat.set(r.featureId, list)
  }
  const featsByLineage = new Map<number, typeof featRows>()
  for (const f of featRows) {
    if (f.lineageId == null) continue
    const list = featsByLineage.get(f.lineageId) ?? []
    list.push(f)
    featsByLineage.set(f.lineageId, list)
  }

  // Une feature n'est PAS un trait à afficher si tous ses effets sont carac./vitesse (déjà en badges).
  const BADGE_ONLY = new Set(['ability_increase', 'walking_speed'])

  const derived: CatalogLineage[] = lineages.map((lin) => {
    const feats = featsByLineage.get(lin.id) ?? []
    const allEffects = feats.flatMap(f => effectsByFeat.get(f.id) ?? [])
    const abilityBonuses = { ...baseAbilityBonuses }
    for (const [k, v] of Object.entries(abilityBonusesFrom(allEffects)) as [AbilityKey, number][]) {
      abilityBonuses[k] = (abilityBonuses[k] ?? 0) + v
    }
    const speedEffect = allEffects.find(e => e.type === 'walking_speed')
    const speed = typeof speedEffect?.value === 'number' ? speedEffect.value : base.speed
    const dv = allEffects.find(e => e.type === 'darkvision')?.value as { range?: number } | undefined
    const darkvision = typeof dv?.range === 'number' ? dv.range : null
    const traits = feats
      .filter((f) => {
        const es = effectsByFeat.get(f.id) ?? []
        return !(es.length > 0 && es.every(e => BADGE_ONLY.has(e.type)))
      })
      .map(f => f.name)
    return { id: lin.id, name: lin.name, description: lin.description, abilityBonuses, speed, darkvision, traits, effects: allEffects as Effect[] }
  })

  return { ...meta, lineages: derived }
}

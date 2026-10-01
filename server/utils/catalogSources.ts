import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'
import type { Ruleset } from '~~/shared/rules/ruleset'
import { CORE_SOURCE } from '~~/shared/rules/source'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { RollTable } from '~~/shared/rules/rollTables'
import { loadClassProficiencyGrants, type ClassProficiencyGrants } from '~~/server/utils/classProficiencyDerivation'
import type { Db } from '~~/server/utils/db'

type ClassRow = typeof schema.classes.$inferSelect
type SubclassRow = typeof schema.subclasses.$inferSelect

export type CatalogClass = ClassRow & { subclasses: SubclassRow[], proficiencies: ClassProficiencyGrants }

export async function loadClasses(db: Db, ruleset: Ruleset = '5', extended = false): Promise<CatalogClass[]> {
  const rows = await db
    .select()
    .from(schema.classes)
    // Le filtre `source` des sous-classes va dans le ON (pas le WHERE) : une classe socle
    // n'ayant que des sous-classes gatées doit remonter quand même (leftJoin), sa liste vide.
    .leftJoin(schema.subclasses, and(
      eq(schema.subclasses.classId, schema.classes.id),
      ...(extended ? [] : [eq(schema.subclasses.source, CORE_SOURCE)]),
    ))
    .where(and(
      eq(schema.classes.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.classes.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(schema.classes.id), asc(schema.subclasses.name))

  const proficiencies = await loadClassProficiencyGrants(db, [...new Set(rows.map(r => r.classes.id))])
  const byId = new Map<number, CatalogClass>()
  for (const r of rows) {
    const cls = r.classes
    if (!byId.has(cls.id)) byId.set(cls.id, { ...cls, subclasses: [], proficiencies: proficiencies.get(cls.id)! })
    if (r.subclasses) byId.get(cls.id)!.subclasses.push(r.subclasses)
  }
  return [...byId.values()]
}

export async function loadSpecies(db: Db, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string }[]> {
  return await db
    .select({ id: schema.characterSpecies.id, name: schema.characterSpecies.name })
    .from(schema.characterSpecies)
    .where(and(
      eq(schema.characterSpecies.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.characterSpecies.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(schema.characterSpecies.name))
}

// Classe résolue par `(name, ruleset)` : `subclasses` n'a pas de `ruleset` et les noms de classe seront partagés en 5.5.
export async function loadSubclasses(db: Db, className: string, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string, description: string | null }[]> {
  const [cls] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.name, className), eq(schema.classes.ruleset, ruleset)))
    .limit(1)
  if (!cls) return []

  return await db
    .select({
      id: schema.subclasses.id,
      name: schema.subclasses.name,
      description: schema.subclasses.description,
    })
    .from(schema.subclasses)
    .where(and(
      eq(schema.subclasses.classId, cls.id),
      ...(extended ? [] : [eq(schema.subclasses.source, CORE_SOURCE)]),
    ))
}

/**
 * Styles de combat (features-options taguées `fighting_style`) d'une classe désignée par son NOM.
 * Classe résolue par `(name, ruleset)` comme `loadSubclasses` ; classe non martiale ou inconnue → `[]`.
 */
export async function loadFightingStyles(db: Db, className: string, ruleset: Ruleset = '5', extended = false): Promise<{ id: number, name: string, description: string | null }[]> {
  const [cls] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.name, className), eq(schema.classes.ruleset, ruleset)))
    .limit(1)
  if (!cls) return []

  return await db
    .select({
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
    })
    .from(schema.features)
    .where(and(
      eq(schema.features.classId, cls.id),
      eq(schema.features.tag, 'fighting_style'),
      eq(schema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.features.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(schema.features.id))
}

export async function loadFeats(db: Db, ruleset: Ruleset = '5', extended = false) {
  const feats = await db
    .select({
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
      prerequisites: schema.features.prerequisites,
      featCategory: schema.features.featCategory, // catégorie 2024 (null pour les dons 2014)
    })
    .from(schema.features)
    .where(and(
      eq(schema.features.featureType, 'feat'),
      eq(schema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.features.source, CORE_SOURCE)]),
    ))

  if (feats.length === 0) return []

  const featIds = feats.map(f => f.id)
  const links = await db
    .select({ featureId: schema.featureEffects.featureId, effect: schema.effects })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
    .where(inArray(schema.featureEffects.featureId, featIds))

  const effectsByFeat = new Map<number, (typeof schema.effects.$inferSelect)[]>()
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
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
      levelRequired: schema.features.levelRequired,
      prerequisites: schema.features.prerequisites,
    })
    .from(schema.features)
    .where(and(
      eq(schema.features.featureType, 'eldritch_invocation'),
      eq(schema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.features.source, CORE_SOURCE)]),
    ))

  if (features.length === 0) return []

  const featureIds = features.map(f => f.id)
  const effectRows = await db
    .select({
      featureId: schema.featureEffects.featureId,
      type: schema.effects.type,
      value: schema.effects.value,
    })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
    .where(inArray(schema.featureEffects.featureId, featureIds))

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
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
    })
    .from(schema.features)
    .where(and(
      eq(schema.features.tag, 'metamagic'),
      eq(schema.features.ruleset, ruleset),
      ...(extended ? [] : [eq(schema.features.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(schema.features.name))
}

// Avec `characterSheetId`, ajoute les historiques homebrew de la fiche (non cachable).
export async function loadBackgrounds(db: Db, characterSheetId?: number, ruleset: Ruleset = '5', extended = false) {
  return await db
    .select()
    .from(schema.backgrounds)
    .where(
      and(
        eq(schema.backgrounds.ruleset, ruleset),
        characterSheetId
          ? or(isNull(schema.backgrounds.characterSheetId), eq(schema.backgrounds.characterSheetId, characterSheetId))
          : isNull(schema.backgrounds.characterSheetId),
        ...(extended ? [] : [eq(schema.backgrounds.source, CORE_SOURCE)]),
      ),
    )
    .orderBy(schema.backgrounds.name)
}

// Un sort porte son propre `ruleset` (description/effets divergent entre 2014 et 2024).
export async function loadSpells(db: Db, opts: { className?: string, ruleset?: Ruleset, extended?: boolean } = {}) {
  const ruleset = opts.ruleset ?? '5'
  const sourceFilter = opts.extended ? [] : [eq(schema.spells.source, CORE_SOURCE)]

  if (opts.className) {
    const rows = await db
      .select({ spell: schema.spells, school: schema.magicSchools })
      .from(schema.spells)
      .leftJoin(schema.magicSchools, eq(schema.spells.schoolId, schema.magicSchools.id))
      .leftJoin(schema.spellClasses, eq(schema.spellClasses.spellId, schema.spells.id))
      .leftJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
      .where(and(
        eq(schema.classes.name, opts.className),
        eq(schema.classes.ruleset, ruleset),
        eq(schema.spellClasses.ruleset, ruleset),
        eq(schema.spells.ruleset, ruleset),
        ...sourceFilter,
      ))
      .orderBy(asc(schema.spells.level), asc(schema.spells.name))
    return rows.map(r => ({ ...r.spell, school: r.school }))
  }

  const rows = await db
    .select({ spell: schema.spells, school: schema.magicSchools })
    .from(schema.spells)
    .leftJoin(schema.magicSchools, eq(schema.spells.schoolId, schema.magicSchools.id))
    .where(and(
      eq(schema.spells.ruleset, ruleset),
      ...sourceFilter,
    ))
    .orderBy(asc(schema.spells.level), asc(schema.spells.name))
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
    .select({ id: schema.characterSpecies.id, name: schema.characterSpecies.name, speed: schema.characterSpecies.speed, size: schema.characterSpecies.size })
    .from(schema.characterSpecies)
    .where(eq(schema.characterSpecies.id, speciesId))
    .limit(1)
  if (!base) return null

  const baseEffects = await db
    .select({ type: schema.effects.type, value: schema.effects.value })
    .from(schema.speciesFeatures)
    .innerJoin(schema.featureEffects, eq(schema.featureEffects.featureId, schema.speciesFeatures.featureId))
    .innerJoin(schema.effects, eq(schema.effects.id, schema.featureEffects.effectId))
    .where(eq(schema.speciesFeatures.speciesId, speciesId))
  const baseAbilityBonuses = abilityBonusesFrom(baseEffects)

  const lineages = await db
    .select({ id: schema.speciesLineages.id, name: schema.speciesLineages.name, description: schema.speciesLineages.description })
    .from(schema.speciesLineages)
    .where(and(
      eq(schema.speciesLineages.speciesId, speciesId),
      ...(extended ? [] : [eq(schema.speciesLineages.source, CORE_SOURCE)]),
    ))
    .orderBy(asc(schema.speciesLineages.id))
  const meta = { id: base.id, name: base.name, speed: base.speed, size: base.size, effects: baseEffects as Effect[] }
  if (!lineages.length) return { ...meta, lineages: [] }

  const lineageIds = lineages.map(l => l.id)
  const featRows = await db
    .select({ id: schema.features.id, name: schema.features.name, lineageId: schema.features.lineageId })
    .from(schema.features)
    .where(inArray(schema.features.lineageId, lineageIds))
  const featIds = featRows.map(f => f.id)
  const effRows = featIds.length
    ? await db
        .select({ featureId: schema.featureEffects.featureId, type: schema.effects.type, value: schema.effects.value })
        .from(schema.featureEffects)
        .innerJoin(schema.effects, eq(schema.effects.id, schema.featureEffects.effectId))
        .where(inArray(schema.featureEffects.featureId, featIds))
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

export async function loadRollTable(db: Db, id: number): Promise<RollTable | null> {
  const [row] = await db
    .select({ name: schema.rollTables.name, die: schema.rollTables.die, entries: schema.rollTables.entries })
    .from(schema.rollTables)
    .where(eq(schema.rollTables.id, id))
    .limit(1)
  return row ?? null
}

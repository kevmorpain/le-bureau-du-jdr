import { and, asc, eq, inArray, isNull, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { AbilityKey } from '~~/shared/rules/abilities'

/**
 * Loaders des LISTES de référence du catalogue (lot 6a) — la tranche plate, statique et
 * cachable que consomment le builder et la fiche : classes (+ sous-classes), espèces, dons,
 * invocations, historiques. Ils encapsulent en un seul endroit les requêtes aujourd'hui
 * éparpillées dans les endpoints `server/api/{classes,character_species,feats,invocations,
 * backgrounds}` (rules-engine.md §7 #3 : « encapsuler l'accès données hub:db dans un module »).
 *
 * Le `db` est INJECTÉ : en prod le `db` de `hub:db` (⚠️ PAS `useDrizzle()`, qui casse à l'appel —
 * cf. server/utils/drizzle.ts), en test une instance drizzle-sur-libsql — exactement comme
 * {@link buildCatalog} (`server/utils/catalog.ts`). Cela les rend testables sans HTTP ni auth
 * (patron du point 5) ; les endpoints `/api/catalog/*` ET legacy délèguent ici : source unique,
 * shape garantie identique.
 *
 * Lecture via `srcSchema` (schéma source, frais) plutôt que le cache `hub:db` — voir CLAUDE.md.
 *
 * Chaque loader d'entité globale filtre par `ruleset` (défaut `'5'`, cf. shared/rules/ruleset.ts) :
 * le builder 2014 (qui appelle sans argument) ne voit QUE le contenu 2014, même une fois du 5.5 seedé
 * (Phase 2). No-op tant que tout est `'5'` en base. Un futur appelant 5.5 passera `'5.5'`.
 */

// Instance drizzle SQLite, quel que soit le driver (D1 en prod, libsql en test) — mêmes
// génériques `any` que dans catalog.ts : seul le query-builder `.select().from()` est utilisé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

type ClassRow = typeof srcSchema.classes.$inferSelect
type SubclassRow = typeof srcSchema.subclasses.$inferSelect

/** Classe du catalogue = ligne `classes` + ses sous-classes imbriquées. */
export type CatalogClass = ClassRow & { subclasses: SubclassRow[] }

/**
 * Toutes les classes, chacune avec ses sous-classes imbriquées, triées par id de classe puis
 * nom de sous-classe (≡ endpoint legacy `/api/classes`).
 */
export async function loadClasses(db: Db, ruleset: Ruleset = '5'): Promise<CatalogClass[]> {
  const rows = await db
    .select()
    .from(srcSchema.classes)
    .leftJoin(srcSchema.subclasses, eq(srcSchema.subclasses.classId, srcSchema.classes.id))
    .where(eq(srcSchema.classes.ruleset, ruleset))
    .orderBy(asc(srcSchema.classes.id), asc(srcSchema.subclasses.name))

  const byId = new Map<number, CatalogClass>()
  for (const r of rows) {
    const cls = r.classes
    if (!byId.has(cls.id)) byId.set(cls.id, { ...cls, subclasses: [] })
    if (r.subclasses) byId.get(cls.id)!.subclasses.push(r.subclasses)
  }
  return [...byId.values()]
}

/**
 * Liste plate des espèces `{id, name}`, triées par nom (≡ endpoint legacy
 * `/api/character_species`). Le builder n'a besoin que de la résolution name → id.
 */
export async function loadSpecies(db: Db, ruleset: Ruleset = '5'): Promise<{ id: number, name: string }[]> {
  return await db
    .select({ id: srcSchema.characterSpecies.id, name: srcSchema.characterSpecies.name })
    .from(srcSchema.characterSpecies)
    .where(eq(srcSchema.characterSpecies.ruleset, ruleset))
    .orderBy(asc(srcSchema.characterSpecies.name))
}

/**
 * Sous-classes d'une classe désignée par son NOM en base (≡ endpoint legacy
 * `/api/classes/[name]/subclasses`). Classe inconnue → `[]`.
 *
 * La classe est résolue par `(name, ruleset)` (défaut '5') : `subclasses` n'a pas de colonne
 * `ruleset` (parent-gated par sa classe) → filtrer la classe parente garde la résolution
 * DÉTERMINISTE quand le 5.5 partagera les noms de classe (« Guerrier »). No-op tant que
 * tout est '5' ; l'appelant 2014 n'a pas d'argument à passer.
 */
export async function loadSubclasses(db: Db, className: string, ruleset: Ruleset = '5'): Promise<{ id: number, name: string, description: string | null }[]> {
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
    .where(eq(srcSchema.subclasses.classId, cls.id))
}

/**
 * Tous les dons (`features` de `feature_type='feat'`) avec leurs effets bakés, triés par nom
 * (locale fr) (≡ endpoint legacy `/api/feats`).
 */
export async function loadFeats(db: Db, ruleset: Ruleset = '5') {
  const feats = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      prerequisites: srcSchema.features.prerequisites,
      featCategory: srcSchema.features.featCategory, // catégorie 2024 (null pour les dons 2014)
    })
    .from(srcSchema.features)
    .where(and(eq(srcSchema.features.featureType, 'feat'), eq(srcSchema.features.ruleset, ruleset)))

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

/**
 * Toutes les invocations occultes (`features` de `feature_type='eldritch_invocation'`) avec
 * `levelRequired` (défaut 1), `prerequisites` et effets `{type, value}` (≡ endpoint legacy
 * `/api/invocations`).
 */
export async function loadInvocations(db: Db) {
  const features = await db
    .select({
      id: srcSchema.features.id,
      name: srcSchema.features.name,
      description: srcSchema.features.description,
      levelRequired: srcSchema.features.levelRequired,
      prerequisites: srcSchema.features.prerequisites,
    })
    .from(srcSchema.features)
    .where(eq(srcSchema.features.featureType, 'eldritch_invocation'))

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

/**
 * Historiques, triés par nom. Sans `characterSheetId` → uniquement les historiques GLOBAUX
 * (`character_sheet_id IS NULL`), la tranche statique cachable du catalogue. Avec un
 * `characterSheetId`, ajoute les historiques homebrew de cette fiche (≡ endpoint legacy
 * `/api/backgrounds`, dont la variante per-fiche n'est PAS cachable).
 */
export async function loadBackgrounds(db: Db, characterSheetId?: number, ruleset: Ruleset = '5') {
  return await db
    .select()
    .from(srcSchema.backgrounds)
    .where(
      and(
        eq(srcSchema.backgrounds.ruleset, ruleset),
        characterSheetId
          ? or(isNull(srcSchema.backgrounds.characterSheetId), eq(srcSchema.backgrounds.characterSheetId, characterSheetId))
          : isNull(srcSchema.backgrounds.characterSheetId),
      ),
    )
    .orderBy(srcSchema.backgrounds.name)
}

/**
 * Base de sorts filtrée par ÉDITION (≡ endpoint `/api/spells`). Sans `className` : tous les
 * sorts de l'édition (navigateur global — un sort porte son propre `ruleset` depuis 0089, car
 * description/effets divergent entre 2014 et 2024). Avec `className` : la liste de cette classe
 * pour l'édition — classe résolue par `(nom, ruleset)` (déterministe entre éditions), liens
 * `spell_classes` ET sort filtrés sur la même édition. Défaut '5' → no-op tant que tout est '5'.
 * Chaque ligne = le sort + son école (jointure), forme identique à l'endpoint historique.
 */
export async function loadSpells(db: Db, opts: { className?: string, ruleset?: Ruleset } = {}) {
  const ruleset = opts.ruleset ?? '5'

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
      ))
      .orderBy(asc(srcSchema.spells.level), asc(srcSchema.spells.name))
    return rows.map(r => ({ ...r.spell, school: r.school }))
  }

  const rows = await db
    .select({ spell: srcSchema.spells, school: srcSchema.magicSchools })
    .from(srcSchema.spells)
    .leftJoin(srcSchema.magicSchools, eq(srcSchema.spells.schoolId, srcSchema.magicSchools.id))
    .where(eq(srcSchema.spells.ruleset, ruleset))
    .orderBy(asc(srcSchema.spells.level), asc(srcSchema.spells.name))
  return rows.map(r => ({ ...r.spell, school: r.school }))
}

/** Lignée du catalogue, champs d'affichage DÉRIVÉS pour le picker du builder (D17, lot 5b). */
export interface CatalogLineage {
  id: number
  name: string
  description: string | null
  /** Bonus de carac. COMBINÉS base ⊕ lignée (le builder n'applique que ceux de la sous-race). */
  abilityBonuses: Partial<Record<AbilityKey, number>>
  /** Vitesse effective (walking_speed de la lignée sinon celle de la base). */
  speed: number
  darkvision: number | null
  /** Traits propres à la lignée (noms de features), hors carac./vitesse déjà en badges. */
  traits: string[]
}

/** Espèce de base + ses lignées avec champs d'affichage dérivés (D17). */
export interface CatalogSpeciesRich {
  id: number
  name: string
  speed: number
  size: string
  lineages: CatalogLineage[]
}

/** Agrège les bonus de carac. {dex:2,…} depuis des effets `ability_increase`. */
function abilityBonusesFrom(effects: { type: string, value: unknown }[]): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const e of effects) {
    if (e.type !== 'ability_increase') continue
    const v = e.value as { ability?: AbilityKey, amount?: number } | null
    if (v?.ability && typeof v.amount === 'number') bonuses[v.ability] = (bonuses[v.ability] ?? 0) + v.amount
  }
  return bonuses
}

/**
 * Espèce de base (par id) + ses lignées avec les champs d'affichage DÉRIVÉS pour le picker du
 * builder (chantier lignée, D17 — lot 5b). Expose ce que le seed a mis en base (species_features
 * + lineage_features + effets) sous une forme prête pour les cartes de sous-race : bonus de carac.
 * **combinés base ⊕ lignée** (le builder n'applique que ceux de la sous-race quand une est choisie),
 * vitesse effective, vision, et la liste des traits propres à la lignée.
 *
 * Rend `null` si l'espèce n'existe pas ; `lineages: []` pour une espèce sans lignée (le builder
 * retombe alors sur son blob `RaceData`). Lecture via `srcSchema` (frais). Cachable (statique).
 */
export async function loadSpeciesLineages(db: Db, speciesId: number): Promise<CatalogSpeciesRich | null> {
  const [base] = await db
    .select({ id: srcSchema.characterSpecies.id, name: srcSchema.characterSpecies.name, speed: srcSchema.characterSpecies.speed, size: srcSchema.characterSpecies.size })
    .from(srcSchema.characterSpecies)
    .where(eq(srcSchema.characterSpecies.id, speciesId))
    .limit(1)
  if (!base) return null

  // Bonus de carac. de la BASE (species_features → effets ability_increase), communs à toute lignée.
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
    .where(eq(srcSchema.speciesLineages.speciesId, speciesId))
    .orderBy(asc(srcSchema.speciesLineages.id))
  const meta = { id: base.id, name: base.name, speed: base.speed, size: base.size }
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
    return { id: lin.id, name: lin.name, description: lin.description, abilityBonuses, speed, darkvision, traits }
  })

  return { ...meta, lineages: derived }
}

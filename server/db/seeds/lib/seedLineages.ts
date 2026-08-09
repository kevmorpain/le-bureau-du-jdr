import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../schema'
import type { CreatureSize } from '../../schema/character_species'
import type { Effect } from '../../schema/effects'

/**
 * Moteur GÉNÉRIQUE du modèle « espèce = base + lignées » (chantier lignée, D17). Extrait du
 * pilote elfe (ex-`seedElfLineages`) et paramétré par les DONNÉES d'une espèce → ajouter une
 * espèce = 1 fichier de données (`data/<espèce>.ts`) + 1 ligne de registre (`data/lineageSpecies.ts`),
 * sans toucher au moteur. Insère, pour l'espèce décrite :
 *   - l'espèce de BASE (par `name`+`ruleset`) + ses traits communs en `species_features` ;
 *   - la feature de choix (« Lignage … ») portant une `progression kind:'lineage'` /
 *     `optionSource:{type:'lineages'}` (le point de choix, résolu par le lot 2) ;
 *   - chaque lignée en `species_lineages` + ses traits propres en `lineage_feature`
 *     (`features.lineage_id`, `level_required=1`).
 *
 * `db` est INJECTÉ (patron des utils 5/6) : le `db` de `hub:db` en prod via un wrapper, une
 * instance libsql en test — d'où la testabilité sans HTTP. Lecture/écriture via le schéma FRAIS
 * (`../../schema`), jamais le cache `hub:db` (colonnes/tables neuves garanties, cf. CLAUDE.md).
 *
 * **Idempotent** (re-run sûr) : base par (name, ruleset), features par (owner, name), lignées
 * par (species, name), progression par featureId. **Additif** : n'efface RIEN.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Un trait (feature) : nom + description + effets (typés `unknown[]`, castés `Effect[]` au seed). */
export interface LineageTraitData {
  name: string
  description: string
  effects?: unknown[]
}

/** Une lignée = un nom, une description, et ses traits PROPRES (ceux qui diffèrent des autres). */
export interface LineageData {
  name: string
  description: string
  traits: LineageTraitData[]
}

/** Description complète d'une espèce « base + lignées » — la matière que consomme le moteur. */
export interface LineageSpeciesData {
  name: string
  ruleset: '5' | '5.5'
  size: CreatureSize
  speed: number
  /** Traits COMMUNS à toutes les lignées → portés par la base. */
  baseTraits: LineageTraitData[]
  /** Le point de choix (feature qui porte la progression `kind:'lineage'`). */
  lineageChoice: { name: string, description: string }
  /** Les lignées (sous-races 2014 / origines 2024). */
  lineages: LineageData[]
}

async function linkEffects(db: Db, featureId: number, effects: Effect[]) {
  for (const effect of effects) {
    const existing = await db
      .select()
      .from(schema.effects)
      .where(and(eq(schema.effects.type, effect.type), eq(schema.effects.value, effect.value)))
      .limit(1)
      .get()
    const effectId = existing?.id ?? (await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning().get()).id
    await db.insert(schema.featureEffects).values({ featureId, effectId }).onConflictDoNothing()
  }
}

export interface LineageSeedReport {
  speciesInserted: number
  lineagesInserted: number
  featuresInserted: number
}

export async function seedLineages(db: Db, data: LineageSpeciesData): Promise<LineageSeedReport> {
  let speciesInserted = 0
  let lineagesInserted = 0
  let featuresInserted = 0

  const { name, ruleset, size, speed, baseTraits, lineageChoice, lineages } = data

  // 1. Espèce de BASE (idempotent par name+ruleset).
  const existingBase = await db
    .select()
    .from(schema.characterSpecies)
    .where(and(eq(schema.characterSpecies.name, name), eq(schema.characterSpecies.ruleset, ruleset)))
    .limit(1)
    .get()
  const base = existingBase ?? await db.insert(schema.characterSpecies).values({ name, ruleset, size, speed }).returning().get()
  if (!existingBase) speciesInserted++

  // 2. Traits communs → `species_features` (idempotent par (espèce, nom de feature)).
  for (const trait of baseTraits) {
    const { effects, ...traitData } = trait
    const exists = await db
      .select({ id: schema.features.id })
      .from(schema.features)
      .innerJoin(schema.speciesFeatures, eq(schema.speciesFeatures.featureId, schema.features.id))
      .where(and(eq(schema.speciesFeatures.speciesId, base.id), eq(schema.features.name, traitData.name)))
      .limit(1)
      .get()
    if (exists) continue
    const feature = await db.insert(schema.features).values({ ...traitData, featureType: 'species_trait', ruleset }).returning().get()
    featuresInserted++
    await linkEffects(db, feature.id, (effects ?? []) as Effect[])
    await db.insert(schema.speciesFeatures).values({ speciesId: base.id, featureId: feature.id }).onConflictDoNothing()
  }

  // 3. Feature de choix « Lignage … » + sa `progression` (kind:'lineage').
  const existingChoice = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .innerJoin(schema.speciesFeatures, eq(schema.speciesFeatures.featureId, schema.features.id))
    .where(and(eq(schema.speciesFeatures.speciesId, base.id), eq(schema.features.name, lineageChoice.name)))
    .limit(1)
    .get()
  let choiceFeatureId: number
  if (existingChoice) {
    choiceFeatureId = existingChoice.id
  }
  else {
    const cf = await db.insert(schema.features).values({ name: lineageChoice.name, description: lineageChoice.description, featureType: 'species_trait', ruleset, levelRequired: 1 }).returning().get()
    featuresInserted++
    await db.insert(schema.speciesFeatures).values({ speciesId: base.id, featureId: cf.id }).onConflictDoNothing()
    choiceFeatureId = cf.id
  }
  const existingProg = await db.select({ id: schema.progression.id }).from(schema.progression).where(eq(schema.progression.featureId, choiceFeatureId)).limit(1).get()
  if (!existingProg) {
    await db.insert(schema.progression).values({ featureId: choiceFeatureId, kind: 'lineage', count: { op: 'fixed', value: 1 }, optionSource: { type: 'lineages' }, replaceable: false })
  }

  // 4. Lignées + leurs features propres (idempotent par (espèce, nom de lignée) / (lignée, nom)).
  for (const lineage of lineages) {
    const existingLineage = await db
      .select()
      .from(schema.speciesLineages)
      .where(and(eq(schema.speciesLineages.speciesId, base.id), eq(schema.speciesLineages.name, lineage.name)))
      .limit(1)
      .get()
    const lineageRow = existingLineage ?? await db.insert(schema.speciesLineages).values({ speciesId: base.id, name: lineage.name, description: lineage.description }).returning().get()
    if (!existingLineage) lineagesInserted++

    for (const trait of lineage.traits) {
      const { effects, ...traitData } = trait
      const exists = await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .where(and(eq(schema.features.lineageId, lineageRow.id), eq(schema.features.name, traitData.name)))
        .limit(1)
        .get()
      if (exists) continue
      const feature = await db.insert(schema.features).values({ ...traitData, featureType: 'lineage_feature', ruleset, lineageId: lineageRow.id, levelRequired: 1 }).returning().get()
      featuresInserted++
      await linkEffects(db, feature.id, (effects ?? []) as Effect[])
    }
  }

  return { speciesInserted, lineagesInserted, featuresInserted }
}

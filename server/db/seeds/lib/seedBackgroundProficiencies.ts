import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../schema'
import type { Effect } from '../../schema/effects'
import { fixedProficiencies } from '~~/shared/rules/backgroundProficiencies'

/**
 * Volet B, étape 2 — porte les maîtrises d'outils/langues FIXES d'un historique en EFFETS sur
 * `background_features` (table posée dormante au lot 4d, cf. son docstring), afin que la fiche les
 * DÉRIVE de l'origine (comme l'espèce) au lieu de les matérialiser en grants. Symétrique de
 * `seedLineages` : DI (`db` injecté → testable libsql), lecture/écriture via le schéma FRAIS
 * (`../../schema`, jamais le cache `hub:db`), **idempotent** (par (background, nom de feature)) et
 * **additif**.
 *
 * Chaque historique ayant ≥1 maîtrise fixe reçoit UNE feature porteuse (`feature_type =
 * 'proficiency_grant'`, jamais matérialisée ni affichée — même type inerte que les maîtrises de
 * classe, volet B étape 1), liée par `background_features`, portant un effet `tool_proficiency` /
 * `language_proficiency` par entrée fixe. Les entrées « au choix » restent des deltas du joueur
 * (grants), non dérivées — cf. [[shared/rules/backgroundProficiencies]].
 *
 * NB 2014 : les langues d'historique sont toutes « au choix » → aucun effet `language_proficiency`
 * émis en pratique ; le code reste général (5.5 / homebrew).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Nom (interne) de la feature porteuse des maîtrises fixes d'un historique. */
export const BACKGROUND_PROFICIENCY_CARRIER_NAME = 'Maîtrises d\'historique'

export interface BackgroundProficiencyData {
  name: string
  toolProficiencies: string[]
  languageProficiencies: string[]
}

export interface BackgroundProficiencySeedReport {
  carriersInserted: number
  effectsLinked: number
}

/** Lie un effet à une feature (dédup de l'effet par (type, value)). `true` si un NOUVEAU lien est créé. */
async function linkEffect(db: Db, featureId: number, effect: Effect): Promise<boolean> {
  const existingEffect = await db
    .select({ id: schema.effects.id })
    .from(schema.effects)
    .where(and(eq(schema.effects.type, effect.type), eq(schema.effects.value, effect.value)))
    .limit(1)
    .get()
  const effectId = existingEffect?.id
    ?? (await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning().get()).id
  // Check-before-insert (idempotent, D1-safe : pas de `returning` après `onConflictDoNothing`).
  const existingLink = await db
    .select({ featureId: schema.featureEffects.featureId })
    .from(schema.featureEffects)
    .where(and(eq(schema.featureEffects.featureId, featureId), eq(schema.featureEffects.effectId, effectId)))
    .limit(1)
    .get()
  if (existingLink) return false
  await db.insert(schema.featureEffects).values({ featureId, effectId })
  return true
}

export async function seedBackgroundProficiencies(
  db: Db,
  data: BackgroundProficiencyData[],
): Promise<BackgroundProficiencySeedReport> {
  let carriersInserted = 0
  let effectsLinked = 0

  for (const bg of data) {
    const fixedTools = fixedProficiencies(bg.toolProficiencies ?? [])
    const fixedLangs = fixedProficiencies(bg.languageProficiencies ?? [])
    if (fixedTools.length === 0 && fixedLangs.length === 0) continue // rien de fixe → pas de porteur

    const background = await db
      .select({ id: schema.backgrounds.id })
      .from(schema.backgrounds)
      .where(eq(schema.backgrounds.name, bg.name))
      .limit(1)
      .get()
    if (!background) continue // historique pas encore seedé → skip (le seed backgrounds tourne avant)

    // Feature porteuse (idempotent par (background, nom)).
    const existingCarrier = await db
      .select({ id: schema.features.id })
      .from(schema.features)
      .innerJoin(schema.backgroundFeatures, eq(schema.backgroundFeatures.featureId, schema.features.id))
      .where(and(
        eq(schema.backgroundFeatures.backgroundId, background.id),
        eq(schema.features.name, BACKGROUND_PROFICIENCY_CARRIER_NAME),
      ))
      .limit(1)
      .get()

    let carrierId: number
    if (existingCarrier) {
      carrierId = existingCarrier.id
    }
    else {
      const carrier = await db
        .insert(schema.features)
        .values({ name: BACKGROUND_PROFICIENCY_CARRIER_NAME, featureType: 'proficiency_grant', ruleset: '5', levelRequired: 1 })
        .returning()
        .get()
      carrierId = carrier.id
      carriersInserted++
      await db.insert(schema.backgroundFeatures).values({ backgroundId: background.id, featureId: carrierId }).onConflictDoNothing()
    }

    const effects: Effect[] = [
      ...fixedTools.map((value): Effect => ({ type: 'tool_proficiency', value })),
      ...fixedLangs.map((value): Effect => ({ type: 'language_proficiency', value })),
    ]
    for (const effect of effects) {
      if (await linkEffect(db, carrierId, effect)) effectsLinked++
    }
  }

  return { carriersInserted, effectsLinked }
}

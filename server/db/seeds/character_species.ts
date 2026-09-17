import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '../schema/effects'
import { characterSpecies } from './data/character_species'
import { rulesetOf } from './lib/rulesetOf'

export default async function seed() {
  let speciesInserted = 0
  let speciesSkipped = 0
  let featuresInserted = 0

  for (const species of characterSpecies) {
    const { traits, ...speciesData } = species

    // Keyé par (name, ruleset) : un homonyme 5.5 est une ligne DISTINCTE, pas une mise à jour (D2).
    const existingSpecies = await db.query.characterSpecies.findFirst({
      where: and(
        eq(schema.characterSpecies.name, speciesData.name),
        eq(schema.characterSpecies.ruleset, rulesetOf(speciesData)),
      ),
    })

    // srcSchema (schéma frais) : le cache hub:db peut dropper la colonne `source` en silence.
    const insertedSpecies = existingSpecies ?? await db
      .insert(srcSchema.characterSpecies)
      .values(speciesData)
      .returning()
      .get()

    if (existingSpecies) speciesSkipped++
    else speciesInserted++

    if (!traits?.length) continue

    for (const trait of traits) {
      const { effects, ...traitData } = trait

      const existingFeature = await db
        .select({ id: schema.features.id })
        .from(schema.features)
        .innerJoin(schema.speciesFeatures, eq(schema.speciesFeatures.featureId, schema.features.id))
        .where(
          and(
            eq(schema.speciesFeatures.speciesId, insertedSpecies.id),
            eq(schema.features.name, traitData.name),
          ),
        )
        .limit(1)
        .get()

      if (existingFeature) continue

      featuresInserted++

      const insertedFeature = await db
        .insert(schema.features)
        .values({ ...traitData, featureType: 'species_trait' })
        .returning()
        .get()

      for (const effect of (effects ?? []) as Effect[]) {
        const existingEffect = await db
          .select()
          .from(schema.effects)
          .where(
            and(
              eq(schema.effects.type, effect.type),
              eq(schema.effects.value, effect.value),
            ),
          )
          .limit(1)
          .get()

        const effectId = existingEffect?.id ?? await db
          .insert(schema.effects)
          .values({ type: effect.type, value: effect.value })
          .returning()
          .get()
          .then(r => r.id)

        await db
          .insert(schema.featureEffects)
          .values({ featureId: insertedFeature.id, effectId })
          .onConflictDoNothing()
      }

      await db
        .insert(schema.speciesFeatures)
        .values({ speciesId: insertedSpecies.id, featureId: insertedFeature.id })
        .onConflictDoNothing()
    }
  }

  return { species: { inserted: speciesInserted, skipped: speciesSkipped }, featuresInserted }
}

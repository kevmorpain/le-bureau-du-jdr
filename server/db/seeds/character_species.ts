import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { characterSpecies } from './data/character_species'

export default async function seed() {
  for (const species of characterSpecies) {
    const { traits, ...speciesData } = species

    // Insert species
    // const insertedSpecies = await db
    //   .insert(schema.characterSpecies)
    //   .values(speciesData)
    //   .returning()
    //   .get()
    const insertedSpecies = await db
      .query.characterSpecies
      .findFirst({
        where: eq(schema.characterSpecies.name, speciesData.name),
      })

    // Process traits if they exist
    if (insertedSpecies && traits && traits.length > 0) {
      for (const trait of traits) {
        const { effects, ...traitData } = trait

        // Insert trait
        const insertedTrait = await db
          .insert(schema.traits)
          .values(traitData)
          .returning()
          .get()

        // Process effects if they exist
        if (effects && effects.length > 0) {
          for (const effect of effects) {
            // Check if effect already exists
            const existingEffect = await db
              .select()
              .from(schema.effects)
              .where(
                eq(schema.effects.type, effect.type),
              )
              .limit(1)
              .get()

            let effectId: number
            if (existingEffect) {
              effectId = existingEffect.id
            } else {
              // Insert new effect
              const insertedEffect = await db
                .insert(schema.effects)
                .values({
                  type: effect.type,
                  value: effect.value,
                })
                .returning()
                .get()
              effectId = insertedEffect.id
            }

            // Link trait to effect
            await db
              .insert(schema.traitEffects)
              .values({
                traitId: insertedTrait.id,
                effectId,
              })
              .onConflictDoNothing()
          }
        }

        // Link species to trait
        await db
          .insert(schema.speciesTraits)
          .values({
            speciesId: insertedSpecies.id,
            traitId: insertedTrait.id,
          })
          .onConflictDoNothing()
      }
    }
  }
}

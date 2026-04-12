import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { Effect } from '../schema/effects'
import { characterSpecies } from './data/character_species'

export default async function seed() {
  for (const species of characterSpecies) {
    const { traits, ...speciesData } = species

    const insertedSpecies = await db.query.characterSpecies.findFirst({
      where: eq(schema.characterSpecies.name, speciesData.name),
    }) ?? await db
      .insert(schema.characterSpecies)
      .values(speciesData)
      .returning()
      .get()

    if (!traits?.length) continue

    for (const trait of traits) {
      const { effects, ...traitData } = trait

      // Skip if this trait is already linked to this species (idempotency on re-run)
      const existingTrait = await db
        .select({ id: schema.traits.id })
        .from(schema.traits)
        .innerJoin(schema.speciesTraits, eq(schema.speciesTraits.traitId, schema.traits.id))
        .where(
          and(
            eq(schema.speciesTraits.speciesId, insertedSpecies.id),
            eq(schema.traits.name, traitData.name),
          ),
        )
        .limit(1)
        .get()

      if (existingTrait) continue

      const insertedTrait = await db
        .insert(schema.traits)
        .values(traitData)
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
          .insert(schema.traitEffects)
          .values({ traitId: insertedTrait.id, effectId })
          .onConflictDoNothing()
      }

      await db
        .insert(schema.speciesTraits)
        .values({ speciesId: insertedSpecies.id, traitId: insertedTrait.id })
        .onConflictDoNothing()
    }
  }
}

import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import type { Effect } from '../schema/effects'
import { warlockFeatures, grandAncienFeatures, warlockSubclassName, warlockClassName } from './data/warlock'

export default async function seed() {
  // Find the Occultiste class
  const warlockClass = await db.query.classes.findFirst({
    where: eq(schema.classes.name, warlockClassName),
  })

  if (!warlockClass) {
    console.warn(`[warlock seed] Classe "${warlockClassName}" introuvable — skip`)
    return
  }

  // Upsert the Grand Ancien subclass
  const existingSubclass = await db.query.subclasses.findFirst({
    where: and(
      eq(schema.subclasses.classId, warlockClass.id),
      eq(schema.subclasses.name, warlockSubclassName),
    ),
  })

  const grandAncien = existingSubclass ?? await db
    .insert(schema.subclasses)
    .values({ classId: warlockClass.id, name: warlockSubclassName })
    .returning()
    .get()

  // Seed base class features
  for (const featureData of warlockFeatures) {
    const { effects, meta: _meta, ...data } = featureData as typeof featureData & { meta?: unknown }

    const existing = await db.query.features.findFirst({
      where: and(
        eq(schema.features.classId, warlockClass.id),
        eq(schema.features.name, data.name),
      ),
    })

    const feature = existing ?? await db
      .insert(schema.features)
      .values({
        ...data,
        classId: warlockClass.id,
        maxUsesFormula: data.maxUsesFormula ?? null,
      })
      .returning()
      .get()

    await seedEffects(feature.id, (effects ?? []) as Effect[])
  }

  // Seed Grand Ancien subclass features
  for (const featureData of grandAncienFeatures) {
    const { effects, ...data } = featureData

    const existing = await db.query.features.findFirst({
      where: and(
        eq(schema.features.subclassId, grandAncien.id),
        eq(schema.features.name, data.name),
      ),
    })

    const feature = existing ?? await db
      .insert(schema.features)
      .values({
        ...data,
        subclassId: grandAncien.id,
        maxUsesFormula: data.maxUsesFormula ?? null,
      })
      .returning()
      .get()

    await seedEffects(feature.id, (effects ?? []) as Effect[])
  }
}

async function seedEffects(featureId: number, effects: Effect[]) {
  for (const effect of effects) {
    const existing = await db
      .select()
      .from(schema.effects)
      .where(and(eq(schema.effects.type, effect.type), eq(schema.effects.value, effect.value)))
      .limit(1)
      .get()

    const effectId = existing?.id ?? await db
      .insert(schema.effects)
      .values({ type: effect.type, value: effect.value })
      .returning()
      .get()
      .then(r => r.id)

    await db
      .insert(schema.featureEffects)
      .values({ featureId, effectId })
      .onConflictDoNothing()
  }
}

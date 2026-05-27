import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'
import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'

export default defineEventHandler(async () => {
  const features = await db
    .select({
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
      levelRequired: schema.features.levelRequired,
      prerequisites: schema.features.prerequisites,
    })
    .from(schema.features)
    .where(eq(schema.features.featureType, 'eldritch_invocation'))

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
})

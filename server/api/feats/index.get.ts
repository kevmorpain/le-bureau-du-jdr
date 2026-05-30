import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, inArray } from 'drizzle-orm'

// Renvoie la liste de tous les dons (features feature_type='feat'),
// chacun avec ses effets bakés (via feature_effects).
export default defineEventHandler(async () => {
  const feats = await db
    .select({
      id: schema.features.id,
      name: schema.features.name,
      description: schema.features.description,
    })
    .from(schema.features)
    .where(eq(schema.features.featureType, 'feat'))

  if (feats.length === 0) return []

  const featIds = feats.map(f => f.id)
  const links = await db
    .select({
      featureId: schema.featureEffects.featureId,
      effect: schema.effects,
    })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
    .where(inArray(schema.featureEffects.featureId, featIds))

  const effectsByFeat = new Map<number, typeof schema.effects.$inferSelect[]>()
  for (const link of links) {
    if (!effectsByFeat.has(link.featureId)) effectsByFeat.set(link.featureId, [])
    effectsByFeat.get(link.featureId)!.push(link.effect)
  }

  return feats
    .map(f => ({ ...f, effects: effectsByFeat.get(f.id) ?? [] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
})

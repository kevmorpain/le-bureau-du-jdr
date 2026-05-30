import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

// Détache un don du personnage (suppression dans character_features, qui est
// la table partagée par toutes les features actives — la suppression cascade
// est gérée naturellement par la PK composite).
export default defineEventHandler(async (event) => {
  const { id, featureId } = getRouterParams(event)
  const characterSheetId = Number(id)
  const featId = Number(featureId)

  if (!characterSheetId || !featId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  // Garde-fou : on ne supprime via cet endpoint que les features de type 'feat'.
  // Les features de classe/sous-classe/espèce ont leur propre cycle de vie
  // (attribués automatiquement au level-up).
  const [feat] = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(eq(schema.features.id, featId), eq(schema.features.featureType, 'feat')))
    .limit(1)

  if (!feat) throw createError({ statusCode: 404, statusMessage: 'Don introuvable' })

  await db
    .delete(schema.characterFeatures)
    .where(and(
      eq(schema.characterFeatures.characterSheetId, characterSheetId),
      eq(schema.characterFeatures.featureId, featId),
    ))

  return { ok: true }
})

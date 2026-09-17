import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id, featureId } = getRouterParams(event)
  const characterSheetId = Number(id)
  const featId = Number(featureId)

  if (!characterSheetId || !featId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  // Les features de classe/sous-classe/espèce ont leur propre cycle de vie : on ne retire que les dons.
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

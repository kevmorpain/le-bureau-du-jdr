import { db, schema } from '~~/server/utils/db'
import { z } from 'zod'

const featureUsageSchema = z.array(z.object({
  featureId: z.number().int().positive(),
  currentUses: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
}).refine(f => f.currentUses !== undefined || f.active !== undefined, 'currentUses ou active attendu'))

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const body = await readValidatedBody(event, featureUsageSchema.parse)

  await Promise.all(body.map(({ featureId, currentUses, active }) =>
    db
      .insert(schema.characterFeatures)
      .values({ characterSheetId, featureId, currentUses: currentUses ?? 0, active: active ?? false })
      .onConflictDoUpdate({
        target: [schema.characterFeatures.characterSheetId, schema.characterFeatures.featureId],
        set: {
          ...(currentUses !== undefined && { currentUses }),
          ...(active !== undefined && { active }),
        },
      }),
  ))

  await touchCharacterSheet(event, characterSheetId)
  return { success: true }
})

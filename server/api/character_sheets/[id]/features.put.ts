import { db, schema } from 'hub:db'
import { z } from 'zod'

const featureUsageSchema = z.array(z.object({
  featureId: z.number().int().positive(),
  currentUses: z.number().int().min(0),
}))

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const body = await readValidatedBody(event, featureUsageSchema.parse)

  await Promise.all(body.map(({ featureId, currentUses }) =>
    db
      .insert(schema.characterFeatures)
      .values({ characterSheetId, featureId, currentUses })
      .onConflictDoUpdate({
        target: [schema.characterFeatures.characterSheetId, schema.characterFeatures.featureId],
        set: { currentUses: sql`excluded.current_uses` },
      }),
  ))

  return { success: true }
})

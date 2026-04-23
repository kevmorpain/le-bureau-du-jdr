import { db, schema } from 'hub:db'
import { z } from 'zod'

const createBackgroundSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).default(''),
  skillProficiencies: z.array(z.string()).max(10).default([]),
  toolProficiencies: z.array(z.string()).max(10).default([]),
  languageProficiencies: z.array(z.string()).max(10).default([]),
  featureName: z.string().max(100).default(''),
  featureDescription: z.string().max(2000).default(''),
  characterSheetId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, createBackgroundSchema.safeParse)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const bg = await db
    .insert(schema.backgrounds)
    .values(result.data)
    .returning()
    .get()

  return bg
})

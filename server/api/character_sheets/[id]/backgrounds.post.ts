import { db, schema } from '~~/server/utils/db'
import { z } from 'zod'
import { skillEnum } from '~~/shared/rules/skills'

const createBackgroundSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).default(''),
  skillProficiencies: z.array(skillEnum).max(10).default([]),
  toolProficiencies: z.array(z.string()).max(10).default([]),
  languageProficiencies: z.array(z.string()).max(10).default([]),
  featureName: z.string().max(100).default(''),
  featureDescription: z.string().max(2000).default(''),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const result = await readValidatedBody(event, createBackgroundSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const background = await db
    .insert(schema.backgrounds)
    .values({ ...result.data, characterSheetId: Number(id) })
    .returning()
    .get()

  await touchCharacterSheet(event, Number(id))
  return background
})

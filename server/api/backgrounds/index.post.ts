import { db, schema } from 'hub:db'
import * as srcSchema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
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
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, createBackgroundSchema.safeParse)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  // Le background personnalisé est rattaché à une fiche : elle doit appartenir
  // à l'utilisateur connecté (cette route n'est pas couverte par le middleware
  // /api/character_sheets/<id>).
  const [sheet] = await db
    .select({ ownerId: srcSchema.characterSheets.ownerId })
    .from(srcSchema.characterSheets)
    .where(eq(srcSchema.characterSheets.id, result.data.characterSheetId))
    .limit(1)
  if (!sheet) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  if (sheet.ownerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const bg = await db
    .insert(schema.backgrounds)
    .values(result.data)
    .returning()
    .get()

  return bg
})

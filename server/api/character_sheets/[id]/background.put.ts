import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { deleteBackgroundChoicePicks } from '~~/server/utils/choicePicks'
import { z } from 'zod'

const bodySchema = z.object({
  backgroundId: z.number().int().positive().nullable(),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  const result = await readValidatedBody(event, bodySchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const { backgroundId } = result.data

  await db
    .update(schema.characterSheets)
    .set({ backgroundId, updatedAt: stampSheetVersion(event) })
    .where(eq(schema.characterSheets.id, characterSheetId))

  await deleteBackgroundChoicePicks(db, characterSheetId)

  return { success: true }
})

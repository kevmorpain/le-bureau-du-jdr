import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { setASISchema } from '~~/shared/utils/character_sheet'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  if (!characterSheetId) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const result = await readValidatedBody(event, setASISchema.safeParse)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const { improvements } = result.data

  try {
    await db
      .delete(schema.characterAbilityScoreImprovements)
      .where(eq(schema.characterAbilityScoreImprovements.characterSheetId, characterSheetId))

    if (improvements.length) {
      await db
        .insert(schema.characterAbilityScoreImprovements)
        .values(improvements.map(asi => ({
          characterSheetId,
          classId: asi.classId,
          classLevel: asi.classLevel,
          ability: asi.ability,
          amount: asi.amount,
        })))
    }

    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : ''
    console.error('[PUT asi] DB error:', message)
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
})

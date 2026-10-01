import { db } from '~~/server/utils/db'
import { characterLevelUp, levelUpSchema } from '~~/server/utils/characterLevelUp'
import { CharacterValidationError } from '~~/server/utils/characterCreate'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  if (!characterSheetId) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const result = await readValidatedBody(event, levelUpSchema.safeParse)
  if (!result.success) throw createError({ statusCode: 422, data: result.error })

  try {
    return await characterLevelUp(db, characterSheetId, result.data)
  }
  catch (e) {
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})

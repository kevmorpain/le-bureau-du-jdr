import { db } from '~~/server/utils/db'
import { characterRest, restSchema } from '~~/server/utils/characterRest'
import { CharacterValidationError } from '~~/server/utils/characterCreate'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const input = await readValidatedBody(event, restSchema.parse)

  try {
    const summary = await characterRest(db, characterSheetId, input)
    await touchCharacterSheet(event, characterSheetId)
    return summary
  }
  catch (e) {
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})

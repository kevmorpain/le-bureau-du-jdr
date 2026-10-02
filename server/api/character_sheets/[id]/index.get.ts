import { db } from '~~/server/utils/db'
import { loadCharacterSheet } from '~~/server/utils/characterSheetLoader'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const characterSheet = await loadCharacterSheet(db, Number(id))

  if (!characterSheet) {
    throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  }

  return characterSheet
})

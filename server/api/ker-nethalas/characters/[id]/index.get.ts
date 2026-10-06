import { db } from '~~/server/utils/db'
import { getKnCharacter } from '~~/server/utils/knCharacters'
import { requireKnCharacterId } from '~~/server/utils/knRoute'

export default defineEventHandler(async (event) => {
  const character = await getKnCharacter(db, requireKnCharacterId(event))

  if (!character) {
    throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  }

  return character
})

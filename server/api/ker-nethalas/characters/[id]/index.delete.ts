import { db } from '~~/server/utils/db'
import { deleteKnCharacter } from '~~/server/utils/knCharacters'
import { requireKnCharacterId } from '~~/server/utils/knRoute'

export default defineEventHandler(async (event) => {
  await deleteKnCharacter(db, requireKnCharacterId(event))

  return { success: true }
})

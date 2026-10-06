import { db } from '~~/server/utils/db'
import { listKnCharacters } from '~~/server/utils/knCharacters'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  return await listKnCharacters(db, user.id)
})

import { db } from '~~/server/utils/db'
import { readAccountPreferences } from '~~/server/utils/accountPreferences'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return { preferences: await readAccountPreferences(db, user.id) }
})

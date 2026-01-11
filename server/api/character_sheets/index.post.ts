import { db } from 'hub:db'

export default defineEventHandler(async (event) => {
  const result = await readBody(event)

  const characterSheet = await db.insert(tables.characterSheets).values(result).returning().get()

  return characterSheet
})

import { db, schema } from '~~/server/utils/db'

export default defineEventHandler(async () => {
  return await db.select().from(schema.magicSchools)
})

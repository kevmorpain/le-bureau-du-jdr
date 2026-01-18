import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  return await db
    .select()
    .from(schema.classes)
})

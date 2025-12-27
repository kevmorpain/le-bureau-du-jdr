import { db } from 'hub:db'
import magicSchools from '../db/schema/magic_schools'

export default defineEventHandler(async () => {
  return await db
    .select()
    .from(magicSchools)
})

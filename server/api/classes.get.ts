import { db } from '~~/server/utils/db'
import { loadClasses } from '~~/server/utils/catalogSources'

export default defineEventHandler(async () => {
  return await loadClasses(db)
})

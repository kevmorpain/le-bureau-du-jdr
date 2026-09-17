import { db } from 'hub:db'
import { loadClasses } from '~~/server/utils/catalogSources'

export default defineEventHandler(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadClasses(db as any)
})

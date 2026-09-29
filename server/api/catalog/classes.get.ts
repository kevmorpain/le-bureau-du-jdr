import { db } from '~~/server/utils/db'
import { loadClasses } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadClasses(db, '5', isExtendedRequested(event))
})

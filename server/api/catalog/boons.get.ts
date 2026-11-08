import { db } from '~~/server/utils/db'
import { loadBoons } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadBoons(db, '5', isExtendedRequested(event))
})

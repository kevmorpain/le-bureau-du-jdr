import { db } from '~~/server/utils/db'
import { loadInvocations } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadInvocations(db, '5', isExtendedRequested(event))
})

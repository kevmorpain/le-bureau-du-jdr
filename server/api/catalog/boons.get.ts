import { db } from '~~/server/utils/db'
import { loadBoons } from '~~/server/utils/catalogSources'
import { isExtendedRequested, requestedRuleset } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadBoons(db, requestedRuleset(event), isExtendedRequested(event))
})

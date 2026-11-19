import { db } from '~~/server/utils/db'
import { loadFeats } from '~~/server/utils/catalogSources'
import { isExtendedRequested, requestedRuleset } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadFeats(db, requestedRuleset(event), isExtendedRequested(event))
})

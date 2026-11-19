import { db } from '~~/server/utils/db'
import { loadInvocations } from '~~/server/utils/catalogSources'
import { isExtendedRequested, requestedRuleset } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadInvocations(db, requestedRuleset(event), isExtendedRequested(event))
})

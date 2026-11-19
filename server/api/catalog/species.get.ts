import { db } from '~~/server/utils/db'
import { loadSpecies } from '~~/server/utils/catalogSources'
import { isExtendedRequested, requestedRuleset } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadSpecies(db, requestedRuleset(event), isExtendedRequested(event))
})

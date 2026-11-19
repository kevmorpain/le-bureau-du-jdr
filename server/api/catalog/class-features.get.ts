import { requestedRuleset } from '~~/server/utils/catalogRequest'
import { db } from '~~/server/utils/db'
import { loadClassFeatures } from '~~/server/utils/catalogSources'

export default defineEventHandler(async (event) => {
  return await loadClassFeatures(db, requestedRuleset(event))
})

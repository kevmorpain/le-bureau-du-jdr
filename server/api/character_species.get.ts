import { db } from '~~/server/utils/db'
import { loadSpecies } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadSpecies(db, '5', isExtendedRequested(event))
})

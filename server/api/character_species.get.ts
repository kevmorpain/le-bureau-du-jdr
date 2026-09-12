import { db } from 'hub:db'
import { loadSpecies } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Legacy — conservé pour le front actuel (repoint = lot 6b). Délègue au loader partagé du
// catalogue : source unique, sortie identique à `/api/catalog/species`.
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadSpecies(db as any, '5', isExtendedRequested(event))
})

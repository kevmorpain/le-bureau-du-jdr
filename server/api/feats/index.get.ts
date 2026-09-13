import { db } from 'hub:db'
import { loadFeats } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Legacy — conservé pour le front actuel (repoint = lot 6b). Délègue au loader partagé du
// catalogue : source unique, sortie identique à `/api/catalog/feats`.
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadFeats(db as any, '5', isExtendedRequested(event))
})

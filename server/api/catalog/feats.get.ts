import { db } from 'hub:db'
import { loadFeats } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

/** Catalogue : tous les dons avec effets bakés, triés par nom (fr). Statique, cachable. Cf. lot 6a. */
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadFeats(db as any, '5', isExtendedRequested(event))
})

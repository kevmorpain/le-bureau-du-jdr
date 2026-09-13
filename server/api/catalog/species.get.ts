import { db } from 'hub:db'
import { loadSpecies } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

/** Catalogue : liste plate des espèces `{id, name}` (statique, cachable). Cf. lot 6a. */
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadSpecies(db as any, '5', isExtendedRequested(event))
})

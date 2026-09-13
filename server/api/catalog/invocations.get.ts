import { db } from 'hub:db'
import { loadInvocations } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

/** Catalogue : toutes les invocations occultes avec effets. Statique, cachable. Cf. lot 6a. */
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadInvocations(db as any, '5', isExtendedRequested(event))
})

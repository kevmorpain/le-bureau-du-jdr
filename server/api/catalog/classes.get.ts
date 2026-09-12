import { db } from 'hub:db'
import { loadClasses } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

/** Catalogue : classes + sous-classes imbriquées (statique, cachable). Cf. lot 6a. */
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadClasses(db as any, '5', isExtendedRequested(event))
})

import { db } from 'hub:db'
import { loadFeats } from '~~/server/utils/catalogSources'

/** Catalogue : tous les dons avec effets bakés, triés par nom (fr). Statique, cachable. Cf. lot 6a. */
export default defineEventHandler(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadFeats(db as any)
})

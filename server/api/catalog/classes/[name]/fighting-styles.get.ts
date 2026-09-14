import { db } from 'hub:db'
import { loadFightingStyles } from '~~/server/utils/catalogSources'

/** Catalogue : styles de combat d'une classe (par nom en base). Statique, cachable. Cf. F2 tranche 4. */
export default defineEventHandler(async (event) => {
  const { name } = getRouterParams(event)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Class name required' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadFightingStyles(db as any, decodeURIComponent(name))
})

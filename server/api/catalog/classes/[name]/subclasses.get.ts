import { db } from 'hub:db'
import { loadSubclasses } from '~~/server/utils/catalogSources'

/** Catalogue : sous-classes d'une classe (par nom en base). Statique, cachable. Cf. lot 6a. */
export default defineEventHandler(async (event) => {
  const { name } = getRouterParams(event)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Class name required' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadSubclasses(db as any, decodeURIComponent(name))
})

import { db } from 'hub:db'
import { loadFightingStyles } from '~~/server/utils/catalogSources'

export default defineEventHandler(async (event) => {
  const { name } = getRouterParams(event)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Class name required' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadFightingStyles(db as any, decodeURIComponent(name))
})

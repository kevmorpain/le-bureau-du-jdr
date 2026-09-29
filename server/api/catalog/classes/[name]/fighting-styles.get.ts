import { db } from '~~/server/utils/db'
import { loadFightingStyles } from '~~/server/utils/catalogSources'

export default defineEventHandler(async (event) => {
  const { name } = getRouterParams(event)
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Class name required' })

  return await loadFightingStyles(db, decodeURIComponent(name))
})

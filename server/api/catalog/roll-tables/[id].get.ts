import { db } from '~~/server/utils/db'
import { loadRollTable } from '~~/server/utils/catalogSources'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'id de table invalide' })
  }
  const table = await loadRollTable(db, id)
  if (!table) throw createError({ statusCode: 404, statusMessage: 'Table introuvable' })
  return table
})

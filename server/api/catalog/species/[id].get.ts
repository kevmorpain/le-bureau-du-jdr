import { db } from '~~/server/utils/db'
import { loadSpeciesLineages } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'id d\'espèce invalide' })
  }
  const data = await loadSpeciesLineages(db, id, isExtendedRequested(event))
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Espèce introuvable' })
  return data
})

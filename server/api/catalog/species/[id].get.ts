import { db } from 'hub:db'
import { loadSpeciesLineages } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'id d\'espèce invalide' })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await loadSpeciesLineages(db as any, id, isExtendedRequested(event))
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Espèce introuvable' })
  return data
})

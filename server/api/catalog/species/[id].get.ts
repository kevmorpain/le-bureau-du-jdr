import { db } from 'hub:db'
import { loadSpeciesLineages } from '~~/server/utils/catalogSources'

/**
 * Catalogue : une espèce de base + ses lignées avec champs d'affichage dérivés (D17, lot 5b).
 * Alimente le picker de sous-race du builder pour les espèces « base + lignée » (Elfe). Statique
 * et cachable. 404 si l'espèce n'existe pas ; `lineages: []` pour une espèce sans lignée.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'id d\'espèce invalide' })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await loadSpeciesLineages(db as any, id)
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Espèce introuvable' })
  return data
})

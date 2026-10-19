import { db } from '~~/server/utils/db'
import { loadFeatureOptions } from '~~/server/utils/catalogSources'

// Nom et description des options d'un point de choix : le catalogue des progressions ne porte que leurs identifiants.
export default defineEventHandler(async (event) => {
  const ids = String(getQuery(event).ids ?? '').split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n) && n > 0).slice(0, 100)
  return ids.length ? await loadFeatureOptions(db, ids) : []
})

import { db } from '~~/server/utils/db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Historiques globaux + homebrew de la fiche : non cachable, contrairement à `/api/catalog/backgrounds`.
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  return await loadBackgrounds(db, Number(id), '5', isExtendedRequested(event))
})

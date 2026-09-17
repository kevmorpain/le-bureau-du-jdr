import { db } from 'hub:db'
import { buildCatalog } from '~~/server/utils/catalog'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Tranche statique et cachable : le front exécute `resolveChoices` localement contre l'état du perso.
export default defineEventHandler(async (event) => {
  const raw = getQuery(event).classIds
  const classIds = raw
    ? String(raw).split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n))
    : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await buildCatalog(db as any, {
    ...(classIds && classIds.length ? { classIds } : {}),
    extended: isExtendedRequested(event),
  })
})

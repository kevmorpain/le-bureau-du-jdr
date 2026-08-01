import { db } from 'hub:db'
import { buildCatalog } from '~~/server/utils/catalog'

/**
 * Catalogue de CHOIX (lot 6a, le « 5e » reporté) : les `progression` par classe avec leurs
 * options pré-résolues (`buildCatalog`). C'est la tranche STATIQUE et cachable de la résolution
 * (rules-engine.md §5) : le front la lit puis exécute `resolveChoices(projection, catalog)`
 * localement contre l'état du perso (non cachable). Cache edge via `routeRules` (nuxt.config).
 *
 * `?classIds=1,2` restreint aux points de choix possédés par ces classes (défaut : toutes).
 * On passe le `db` de `hub:db` (patron des utils 5d) — `useDrizzle()` est contourné (rules-engine §7).
 */
export default defineEventHandler(async (event) => {
  const raw = getQuery(event).classIds
  const classIds = raw
    ? String(raw).split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n))
    : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await buildCatalog(db as any, classIds && classIds.length ? { classIds } : {})
})

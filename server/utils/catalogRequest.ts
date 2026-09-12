import type { H3Event } from 'h3'
import { getQuery } from 'h3'

/**
 * Le catalogue « étendu » (contenu d'extension gaté inclus, cf. shared/rules/source.ts) est
 * demandé via `?extended=1` (ou `=true`). Défaut = socle seul (`'core'`). Contrat UNIQUE lu par
 * tous les endpoints de catalogue, legacy et `/api/catalog/*` — et comme le cache edge
 * (`routeRules`, nuxt.config) est keyé par URL, `?extended=1` est une entrée de cache DISTINCTE :
 * le contenu gaté ne peut pas fuiter dans la réponse socle mise en cache.
 */
export function isExtendedRequested(event: H3Event): boolean {
  const value = getQuery(event).extended
  return value === '1' || value === 'true'
}

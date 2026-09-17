import type { H3Event } from 'h3'
import { getQuery } from 'h3'

// Le cache edge est keyé par URL : `?extended=1` est une entrée distincte, le contenu gaté ne fuit pas dans la réponse socle.
export function isExtendedRequested(event: H3Event): boolean {
  const value = getQuery(event).extended
  return value === '1' || value === 'true'
}

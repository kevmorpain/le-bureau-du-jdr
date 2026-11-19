import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { rulesetEnum, type Ruleset } from '~~/shared/rules/ruleset'

// Le cache edge est keyé par URL : `?extended=1` est une entrée distincte, le contenu gaté ne fuit pas dans la réponse socle.
export function isExtendedRequested(event: H3Event): boolean {
  const value = getQuery(event).extended
  return value === '1' || value === 'true'
}

// Absent ou inconnu → 2014, jamais une 500 ; le front n'envoie `ruleset` que hors 2014, pour garder l'URL (et le cache) inchangée.
export function requestedRuleset(event: H3Event): Ruleset {
  return rulesetEnum.catch('5').parse(getQuery(event).ruleset)
}

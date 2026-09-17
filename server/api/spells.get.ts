import { db } from 'hub:db'
import { loadSpells } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'
import { rulesetEnum } from '~~/shared/rules/ruleset'

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { className?: string, ruleset?: string }
  // Valeur inconnue/absente → '5' (défaut sûr), jamais une 500.
  const ruleset = rulesetEnum.catch('5').parse(query.ruleset)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadSpells(db as any, { className: query.className, ruleset, extended: isExtendedRequested(event) })
})

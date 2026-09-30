import { db } from '~~/server/utils/db'
import { loadSpells } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'
import { rulesetEnum } from '~~/shared/rules/ruleset'

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { className?: string, ruleset?: string }
  // Valeur inconnue/absente → '5' (défaut sûr), jamais une 500.
  const ruleset = rulesetEnum.catch('5').parse(query.ruleset)

  return await loadSpells(db, { className: query.className, ruleset, extended: isExtendedRequested(event) })
})

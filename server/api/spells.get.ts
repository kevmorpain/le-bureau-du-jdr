import { db } from 'hub:db'
import { loadSpells } from '~~/server/utils/catalogSources'
import { rulesetEnum } from '~~/shared/rules/ruleset'

/**
 * Base de sorts. Handler MINCE : filtre d'édition (`?ruleset=`, défaut '5' = 2014) + délégation
 * au loader partagé `loadSpells` (source unique, testable sans HTTP). Un sort porte son propre
 * `ruleset` (0089) et la LISTE d'une classe est datée par `spell_classes.ruleset` (0084). Les
 * appelants 2014 n'envoient pas le param → no-op tant que tout est en '5'.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { className?: string, ruleset?: string }
  // Valeur inconnue/absente → '5' (défaut sûr), jamais une 500.
  const ruleset = rulesetEnum.catch('5').parse(query.ruleset)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadSpells(db as any, { className: query.className, ruleset })
})

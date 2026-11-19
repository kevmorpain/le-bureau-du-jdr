import { db } from '~~/server/utils/db'
import { loadSpells } from '~~/server/utils/catalogSources'
import { isExtendedRequested, requestedRuleset } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  const { className } = getQuery(event) as { className?: string }
  return await loadSpells(db, { className, ruleset: requestedRuleset(event), extended: isExtendedRequested(event) })
})

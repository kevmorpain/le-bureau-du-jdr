import { runSeeds } from '../../db/seeds/run'
import { requireSeedSecret } from '../../utils/seedSecret'

export default defineEventHandler(async (event) => {
  requireSeedSecret(event)

  // `?only=feats` ou `?only=items,feats` : ne lance que ces seeds (séquentiel).
  // Indispensable en prod où le seed complet dépasse la limite de requêtes D1
  // par invocation Worker (les derniers seeds n'étaient jamais atteints).
  const onlyParam = getQuery(event).only
  const only = typeof onlyParam === 'string'
    ? onlyParam.split(',').map(s => s.trim()).filter(Boolean)
    : undefined

  return runSeeds(only)
})

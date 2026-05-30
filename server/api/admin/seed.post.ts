import { runSeeds } from '../../db/seeds/run'

export default defineEventHandler(async (event) => {
  const secret = process.env.SEED_SECRET
  if (!secret || getHeader(event, 'x-seed-secret') !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // `?only=feats` ou `?only=items,feats` : ne lance que ces seeds (séquentiel).
  // Indispensable en prod où le seed complet dépasse la limite de requêtes D1
  // par invocation Worker (les derniers seeds n'étaient jamais atteints).
  const onlyParam = getQuery(event).only
  const only = typeof onlyParam === 'string'
    ? onlyParam.split(',').map(s => s.trim()).filter(Boolean)
    : undefined

  return runSeeds(only)
})

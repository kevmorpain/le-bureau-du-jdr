import { runSeeds } from '../../db/seeds/run'

export default defineEventHandler(async (event) => {
  const secret = process.env.SEED_SECRET
  if (!secret || getHeader(event, 'x-seed-secret') !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return runSeeds()
})

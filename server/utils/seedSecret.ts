import type { H3Event } from 'h3'

export function requireSeedSecret(event: H3Event) {
  const secret = process.env.SEED_SECRET
  if (!secret || getHeader(event, 'x-seed-secret') !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
}

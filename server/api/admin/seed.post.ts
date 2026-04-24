import * as _seed from '../../db/seeds'

function settle<T>(promise: Promise<T>): Promise<T | { error: string }> {
  return promise.catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }))
}

export default defineEventHandler(async (event) => {
  const secret = process.env.SEED_SECRET
  if (!secret || getHeader(event, 'x-seed-secret') !== secret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const start = Date.now()

  const [abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds] = await Promise.all([
    settle(_seed.abilityScores()),
    settle(_seed.damageTypes()),
    settle(_seed.magicSchools()),
    settle(_seed.characterSpecies()),
    settle(_seed.classes()),
    settle(_seed.backgrounds()),
  ])

  const warlock = await settle(_seed.warlock())

  const [spells, items] = await Promise.all([
    settle(_seed.spells()),
    settle(_seed.items()),
  ])

  const summary = { abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds, warlock, spells, items }
  const errors = Object.entries(summary)
    .filter(([, v]) => v && typeof v === 'object' && 'error' in v)
    .map(([k, v]) => `${k}: ${(v as { error: string }).error}`)

  return {
    result: errors.length ? 'partial' : 'success',
    duration: `${((Date.now() - start) / 1000).toFixed(1)}s`,
    summary,
    ...(errors.length && { errors }),
  }
})

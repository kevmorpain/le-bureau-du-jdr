import * as _seed from '.'

function settle<T>(promise: Promise<T>): Promise<T | { error: string }> {
  return promise.catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }))
}

export async function runSeeds() {
  const start = Date.now()

  // Étape 1 : données de base (parallèle)
  const [abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds] = await Promise.all([
    settle(_seed.abilityScores()),
    settle(_seed.damageTypes()),
    settle(_seed.magicSchools()),
    settle(_seed.characterSpecies()),
    settle(_seed.classes()),
    settle(_seed.backgrounds()),
  ])

  // Étape 2 : features de classe (nécessite classes)
  const warlock = await settle(_seed.warlock())

  // Étape 3 : données de jeu (parallèle)
  const [spells, items] = await Promise.all([
    settle(_seed.spells()),
    settle(_seed.items()),
  ])

  // Données de test uniquement — ne pas lancer en prod
  // await _seed.characterSheets()

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
}

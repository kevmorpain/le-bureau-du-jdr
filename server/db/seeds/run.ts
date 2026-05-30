import * as _seed from '.'

function settle<T>(promise: Promise<T>): Promise<T | { error: string }> {
  return promise.catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }))
}

// Registre nom → fonction de seed. Sert au mode ciblé (`only`), qui permet de
// ne lancer qu'un seed précis. Utile car le seed complet dépasse la limite de
// requêtes D1 par invocation Worker : les derniers seeds (items, feats) ne sont
// jamais atteints. En ciblant un seul seed, on reste largement sous la limite.
const SEED_REGISTRY: Record<string, () => Promise<unknown>> = {
  abilityScores: _seed.abilityScores,
  damageTypes: _seed.damageTypes,
  magicSchools: _seed.magicSchools,
  characterSpecies: _seed.characterSpecies,
  classes: _seed.classes,
  backgrounds: _seed.backgrounds,
  barbare: _seed.barbare,
  barde: _seed.barde,
  clerc: _seed.clerc,
  druide: _seed.druide,
  guerrier: _seed.guerrier,
  magicien: _seed.magicien,
  moine: _seed.moine,
  paladin: _seed.paladin,
  rodeur: _seed.rodeur,
  roublard: _seed.roublard,
  ensorceleur: _seed.ensorceleur,
  warlock: _seed.warlock,
  spells: _seed.spells,
  items: _seed.items,
  feats: _seed.feats,
}

function buildResult(start: number, summary: Record<string, unknown>) {
  const errors = Object.entries(summary)
    .filter(([, v]) => v && typeof v === 'object' && 'error' in (v as object))
    .map(([k, v]) => `${k}: ${(v as { error: string }).error}`)

  return {
    result: errors.length ? 'partial' : 'success',
    duration: `${((Date.now() - start) / 1000).toFixed(1)}s`,
    summary,
    ...(errors.length && { errors }),
  }
}

/**
 * Lance les seeds.
 * @param only Liste de noms de seeds à lancer (cf. SEED_REGISTRY). Si fourni,
 *   seuls ces seeds tournent, séquentiellement — pratique pour rester sous la
 *   limite de requêtes D1 (ex : `only=['feats']`). Sinon, seed complet.
 */
export async function runSeeds(only?: string[]) {
  const start = Date.now()

  // ── Mode ciblé ──────────────────────────────────────────────────────────
  if (only && only.length) {
    const summary: Record<string, unknown> = {}
    for (const name of only) {
      const fn = SEED_REGISTRY[name]
      summary[name] = fn ? await settle(fn()) : { error: `seed inconnu : ${name}` }
    }
    return buildResult(start, summary)
  }

  // ── Seed complet ────────────────────────────────────────────────────────

  // Étape 1 : données de base (parallèle)
  const [abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds] = await Promise.all([
    settle(_seed.abilityScores()),
    settle(_seed.damageTypes()),
    settle(_seed.magicSchools()),
    settle(_seed.characterSpecies()),
    settle(_seed.classes()),
    settle(_seed.backgrounds()),
  ])

  // Étape 2 : features de classe (nécessite classes, parallèle)
  const [barbare, barde, clerc, druide, guerrier, magicien, moine, paladin, rodeur, roublard, ensorceleur, warlock] = await Promise.all([
    settle(_seed.barbare()),
    settle(_seed.barde()),
    settle(_seed.clerc()),
    settle(_seed.druide()),
    settle(_seed.guerrier()),
    settle(_seed.magicien()),
    settle(_seed.moine()),
    settle(_seed.paladin()),
    settle(_seed.rodeur()),
    settle(_seed.roublard()),
    settle(_seed.ensorceleur()),
    settle(_seed.warlock()),
  ])

  // Étape 3 : données de jeu (séquentiel — spells fait ~165 requêtes D1, parallélisme cause des locks)
  const spells = await settle(_seed.spells())
  const items = await settle(_seed.items())
  const feats = await settle(_seed.feats())

  // Données de test uniquement — ne pas lancer en prod
  // await _seed.characterSheets()

  const summary = {
    abilityScores, damageTypes, magicSchools, characterSpecies, classes, backgrounds,
    barbare, barde, clerc, druide, guerrier, magicien, moine, paladin, rodeur, roublard, ensorceleur, warlock,
    spells, items, feats,
  }

  return buildResult(start, summary)
}

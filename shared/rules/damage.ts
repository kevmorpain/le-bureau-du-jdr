// AideDD, Combat : à 0 PV on tombe inconscient et on fait des jets de sauvegarde contre la mort. Trois échecs, c'est la mort ;
// trois succès, on est stable. Une mort instantanée frappe quand les dégâts qui restent une fois à 0 PV atteignent le maximum
// de PV. Des dégâts à 0 PV comptent un échec (deux sur un coup critique) ; les soins ne rendent pas de PV temporaires et ne
// se cumulent pas.

export const DEATH_SAVE_LIMIT = 3

export interface HitPointState {
  currentHp: number
  temporaryHp: number
  deathSaveSuccesses: number
  deathSaveFailures: number
}

export const isDead = (state: Pick<HitPointState, 'deathSaveFailures'>): boolean =>
  state.deathSaveFailures >= DEATH_SAVE_LIMIT

export const isStable = (state: HitPointState): boolean =>
  state.currentHp === 0 && !isDead(state) && state.deathSaveSuccesses >= DEATH_SAVE_LIMIT

export const isDying = (state: HitPointState): boolean => state.currentHp === 0

const withFailures = (state: HitPointState, added: number): HitPointState => ({
  ...state,
  deathSaveFailures: Math.min(DEATH_SAVE_LIMIT, state.deathSaveFailures + added),
  // Des dégâts font perdre la stabilité : les jets reprennent.
  deathSaveSuccesses: isStable(state) ? 0 : state.deathSaveSuccesses,
})

export interface DamageResult {
  state: HitPointState
  absorbedByTemporary: number
  droppedToZero: boolean
  instantDeath: boolean
  // Échecs aux jets contre la mort infligés par ces dégâts (à 0 PV).
  deathSaveFailuresAdded: number
}

// `maxHp` : le maximum effectif de PV.
export function applyDamage(
  state: HitPointState,
  damage: number,
  { maxHp, critical = false }: { maxHp: number, critical?: boolean },
): DamageResult {
  const unchanged: DamageResult = { state, absorbedByTemporary: 0, droppedToZero: false, instantDeath: false, deathSaveFailuresAdded: 0 }
  if (damage <= 0) return unchanged

  const absorbedByTemporary = Math.min(state.temporaryHp, damage)
  const afterTemporary = damage - absorbedByTemporary
  const base: HitPointState = { ...state, temporaryHp: state.temporaryHp - absorbedByTemporary }
  if (afterTemporary === 0) return { ...unchanged, state: base, absorbedByTemporary }

  const killed = (): DamageResult => ({
    state: { ...base, currentHp: 0, deathSaveFailures: DEATH_SAVE_LIMIT, deathSaveSuccesses: 0 },
    absorbedByTemporary,
    droppedToZero: state.currentHp > 0,
    instantDeath: true,
    deathSaveFailuresAdded: 0,
  })

  if (state.currentHp > 0) {
    if (afterTemporary < state.currentHp) return { ...unchanged, state: { ...base, currentHp: state.currentHp - afterTemporary }, absorbedByTemporary }
    if (afterTemporary - state.currentHp >= maxHp) return killed()
    return { ...unchanged, state: { ...base, currentHp: 0, deathSaveSuccesses: 0, deathSaveFailures: 0 }, absorbedByTemporary, droppedToZero: true }
  }

  if (afterTemporary >= maxHp) return killed()
  const added = Math.min(DEATH_SAVE_LIMIT - state.deathSaveFailures, critical ? 2 : 1)
  return { ...unchanged, state: withFailures(base, added), absorbedByTemporary, deathSaveFailuresAdded: added }
}

// Les soins remettent les jets contre la mort à zéro ; ils ne se cumulent pas avec les PV temporaires.
export function applyHealing(state: HitPointState, amount: number, { maxHp }: { maxHp: number }): HitPointState {
  if (amount <= 0) return state
  return { ...state, currentHp: Math.min(maxHp, state.currentHp + amount), deathSaveSuccesses: 0, deathSaveFailures: 0 }
}

// Gagner des PV temporaires ne vaut pas guérir : on garde le plus grand des deux lots, sans réveiller.
export const gainTemporaryHp = (state: HitPointState, amount: number): HitPointState =>
  ({ ...state, temporaryHp: Math.max(state.temporaryHp, amount) })

export type DeathSaveOutcome = 'recovered' | 'two-failures' | 'success' | 'failure'

// 20 naturel : 1 PV et les jets repartent de zéro ; 1 naturel : deux échecs ; 10 ou plus : un succès, sinon un échec.
export function rollDeathSave(state: HitPointState, natural: number): { state: HitPointState, outcome: DeathSaveOutcome } {
  if (natural === 20) return { state: { ...state, currentHp: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 }, outcome: 'recovered' }
  if (natural === 1) return { state: { ...state, deathSaveFailures: Math.min(DEATH_SAVE_LIMIT, state.deathSaveFailures + 2) }, outcome: 'two-failures' }
  if (natural >= 10) return { state: { ...state, deathSaveSuccesses: Math.min(DEATH_SAVE_LIMIT, state.deathSaveSuccesses + 1) }, outcome: 'success' }
  return { state: { ...state, deathSaveFailures: Math.min(DEATH_SAVE_LIMIT, state.deathSaveFailures + 1) }, outcome: 'failure' }
}

// AideDD, Concentration : « Le DD est égal à 10 ou à la moitié des dégâts que vous subissez, si ce chiffre est supérieur. »
export const concentrationSaveDc = (damage: number): number => Math.max(10, Math.floor(damage / 2))

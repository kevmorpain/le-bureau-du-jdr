import { applyRollOverride, criticalDamageDiceCount, rollD20, DEFAULT_CRITICAL_FROM, type D20Kind, type RollMode } from '~~/shared/rules/rolls'
import { idlePending, rollEngineKey, type RollEngine } from './character/useCharacterRolls'
import { useCombatTracker } from './character/useCombatTracker'
import { useRollHistory } from './character/useRollHistory'

export interface RollOptions {
  // Jet de d20 de la fiche : seul ce type de jet profite des avantages, relances et critiques.
  d20?: D20Kind
  // Dégâts d'une attaque : les dés doublent sur un critique (`weaponDie` : dé de l'arme, que Critique brutal complète).
  damage?: { weaponDie?: { melee: boolean } }
}

export type RollFn = (label: string, modifier: number, sides?: number, count?: number, options?: RollOptions) => number

export interface DiceRoll {
  id: number
  at: number
  label: string
  rolls: number[]
  // Index du d20 retenu parmi `rolls` ; absent pour une somme de dés.
  keptIndex?: number
  natural: number
  modifier: number
  result: number
  isCrit: boolean
  isFumble: boolean
  mode?: RollMode
  advantage?: string[]
  disadvantage?: string[]
  rerolled?: { from: number, to: number }
  // Dé retenu avant le plancher de Savoir-faire.
  floored?: number
  autoFail?: string[]
  critDamage?: boolean
  replay: { label: string, modifier: number, sides: number, count: number, options: RollOptions }
}

// Départage deux jets de la même milliseconde.
let rollCounter = 0

const standalone: RollEngine = {
  characterId: undefined,
  policy: () => ({ sources: [], rerollOn: null, minimum: null, critFrom: DEFAULT_CRITICAL_FROM, autoFail: [] }),
  situations: computed(() => []),
  criticalExtraDice: computed(() => 0),
  pending: ref(idlePending()),
}

export const useDiceRoller = (provided?: RollEngine) => {
  const engine = provided ?? inject(rollEngineKey, null) ?? standalone
  const toasts = useState<DiceRoll[]>('dice-toasts', () => [])
  const history = useRollHistory(engine.characterId)
  const tracker = useCombatTracker(engine.characterId)

  const rollD20Check = (base: Pick<DiceRoll, 'id' | 'at' | 'label' | 'modifier' | 'replay'>, kind: D20Kind): DiceRoll => {
    const pending = engine.pending.value
    const policy = engine.policy(kind, pending.situations)
    const r = rollD20({ ...policy, sources: applyRollOverride(policy.sources, pending.override) }, Math.random)
    const result = r.used + base.modifier

    engine.pending.value = { override: 'auto', situations: [], crit: kind.type === 'attack' ? r.isCrit : pending.crit }
    if (kind.type === 'initiative') tracker.initiative.value = { total: result, natural: r.used }

    return {
      ...base,
      rolls: r.dice,
      keptIndex: r.keptIndex,
      natural: r.used,
      result,
      isCrit: r.isCrit,
      isFumble: r.isFumble,
      mode: r.mode,
      advantage: r.advantage,
      disadvantage: r.disadvantage,
      rerolled: r.rerolled ?? undefined,
      floored: r.used !== r.kept ? r.kept : undefined,
      autoFail: policy.autoFail.length ? policy.autoFail : undefined,
    }
  }

  const rollDiceSum = (base: Pick<DiceRoll, 'id' | 'at' | 'label' | 'modifier' | 'replay'>, sides: number, count: number, damage: RollOptions['damage']): DiceRoll => {
    const critDamage = !!damage && engine.pending.value.crit
    const total = critDamage
      ? criticalDamageDiceCount(count, {
          weaponDie: !!damage?.weaponDie,
          extraWeaponDice: damage?.weaponDie?.melee ? engine.criticalExtraDice.value : 0,
        })
      : count
    const rolls = Array.from({ length: total }, () => Math.floor(Math.random() * sides) + 1)
    const natural = rolls.reduce((a, b) => a + b, 0)
    const single20 = sides === 20 && count === 1

    return {
      ...base,
      rolls,
      natural,
      result: natural + base.modifier,
      isCrit: single20 && natural === 20,
      isFumble: single20 && natural === 1,
      critDamage: critDamage || undefined,
    }
  }

  const roll: RollFn = (label, modifier, sides = 20, count = 1, options = {}) => {
    const at = Date.now()
    const base = { id: at + (rollCounter++ % 1000) / 1000, at, label, modifier, replay: { label, modifier, sides, count, options } }
    const entry = options.d20 && sides === 20 && count === 1
      ? rollD20Check(base, options.d20)
      : rollDiceSum(base, sides, count, options.damage)

    history.push(entry)
    toasts.value = [...toasts.value.slice(-4), entry]
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== entry.id)
    }, 4500)

    return entry.result
  }

  return { toasts, roll, engine, history }
}

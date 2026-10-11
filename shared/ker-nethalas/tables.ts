import { z } from 'zod'
import { KN_PROVISION_BOUNDS, KN_PROVISION_KEYS, knLowerDie, type KnProvisions } from './camp'
import { KN_CONDITION_KEYS } from './catalog/conditions'
import { KN_BOUNDS } from './character'
import { knDiceSchema, knRollDice, type KnDiceRoll } from './dice'
import { KN_VITAL_KEYS, type KnVitalKey } from './effects'
import {
  KN_TENSION_START_DIE,
  knAddGrowingDarkness,
  knCurrentDomain,
  knDrawGrowingDarkness,
  knRollDie,
  type KnGrowingDarknessDraw,
  type KnRng,
  type KnRun,
} from './run'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from './skills'
import { KN_STATUS_BOUNDS, type KnStatus } from './status'
import { knGainTemporary, knSetTemporary, knTakeDamage, knTemporaryOf } from './vitals'
import { boundedInt } from './zodHelpers'

const knSign = z.enum(['gain', 'loss'])

// Ce qu'un résultat de table donne sans autre choix que celui de le prendre : le reste reste dans son texte.
export const knTableEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('coins'), dice: knDiceSchema, sign: knSign.optional() }),
  z.object({ kind: z.literal('provision'), key: z.enum(KN_PROVISION_KEYS), dice: knDiceSchema, sign: knSign.optional() }),
  z.object({ kind: z.literal('xp'), amount: boundedInt({ min: 1, max: 9999 }) }),
  z.object({ kind: z.literal('vital'), vital: z.enum(KN_VITAL_KEYS), dice: knDiceSchema, sign: knSign }),
  z.object({
    kind: z.literal('damage'),
    dice: knDiceSchema,
    // Directement à la Santé, sans passer par la Robustesse.
    direct: z.boolean().optional(),
    // La moitié du jet, arrondie au supérieur (« la moitié des dégâts en cas de réussite »).
    half: z.boolean().optional(),
  }),
  z.object({ kind: z.literal('exhaustion'), dice: knDiceSchema, sign: knSign }),
  z.object({ kind: z.literal('condition'), key: z.enum(KN_CONDITION_KEYS), value: boundedInt(KN_STATUS_BOUNDS.conditionValue).optional() }),
  z.object({ kind: z.literal('temporary'), vital: z.enum(KN_VITAL_KEYS), dice: knDiceSchema }),
  z.object({ kind: z.literal('tensionReset') }),
  z.object({ kind: z.literal('lairDown') }),
  z.object({ kind: z.literal('darkness') }),
])

export type KnTableEffect = z.infer<typeof knTableEffectSchema>

export const KN_CHECK_KEYS = [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS] as const

export type KnCheckKey = (typeof KN_CHECK_KEYS)[number]

export const knCheckId = (key: KnCheckKey) => `${(KN_RESISTANCE_KEYS as readonly string[]).includes(key) ? 'resistance' : 'skill'}:${key}`

// Un résultat du tableau : selon le test (réussi, raté), un choix du joueur, ou sans condition. Hors « always », une seule
// branche par groupe ; deux tests indépendants dans une même entrée se séparent en deux groupes.
export const KN_OUTCOME_KINDS = ['success', 'failure', 'choice', 'always'] as const

export const knOutcomeSchema = z.object({
  when: z.enum(KN_OUTCOME_KINDS),
  label: z.string().trim().min(1).max(100).optional(),
  group: boundedInt({ min: 0, max: 3 }).optional(),
  effects: z.array(knTableEffectSchema).min(1).max(6),
})

export type KnOutcome = z.infer<typeof knOutcomeSchema>

export const knRollTableEntrySchema = z.object({
  min: boundedInt({ min: 1, max: 100 }),
  max: boundedInt({ min: 1, max: 100 }),
  title: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(2000),
  effects: z.array(knTableEffectSchema).max(4).optional(),
  checks: z.array(z.object({ skill: z.enum(KN_CHECK_KEYS), group: boundedInt({ min: 0, max: 3 }).optional() })).max(3).optional(),
  outcomes: z.array(knOutcomeSchema).max(8).optional(),
  // Clé de la fiche du bestiaire que ce résultat désigne (rencontres, Overseers).
  ref: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/).optional(),
  // Un événement qui installe un piège dans la pièce : à vérifier comme une porte ou un contenant.
  roomTrap: z.boolean().optional(),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

export type KnRollTableEntry = z.infer<typeof knRollTableEntrySchema>

export const knOutcomeGroup = (outcome: Pick<KnOutcome, 'group'>) => outcome.group ?? 0

export function knOutcomeAvailable(outcomes: readonly KnOutcome[], taken: readonly number[], index: number): boolean {
  const outcome = outcomes[index]
  if (!outcome || taken.includes(index)) return false
  if (outcome.when === 'always') return true
  return !outcomes.some((other, i) => taken.includes(i) && other.when !== 'always' && knOutcomeGroup(other) === knOutcomeGroup(outcome))
}

// Les plages se suivent sans trou ni recouvrement, de 1 jusqu'au dé : chaque jet tombe sur une seule entrée.
export const knRollTableSchema = (die: number) => z.object({
  die: z.literal(die),
  entries: z.array(knRollTableEntrySchema).min(1).max(die),
}).superRefine((table, ctx) => {
  let expected = 1
  table.entries.forEach((entry, index) => {
    if (entry.min !== expected) ctx.addIssue({ code: 'custom', path: ['entries', index, 'min'], message: `la plage doit commencer à ${expected}` })
    if (entry.max > die) ctx.addIssue({ code: 'custom', path: ['entries', index, 'max'], message: `la plage dépasse le dé (${die})` })
    expected = entry.max + 1
  })
  if (expected !== die + 1) ctx.addIssue({ code: 'custom', path: ['entries'], message: `les plages doivent couvrir de 1 à ${die}` })
})

export interface KnRollTable {
  die: number
  entries: KnRollTableEntry[]
}

export const knTableEntry = (table: KnRollTable | null, roll: number): KnRollTableEntry | undefined =>
  table?.entries.find(entry => roll >= entry.min && roll <= entry.max)

export const knRollOnTable = (die: number, rng: KnRng = Math.random): number => knRollDie(die, rng)

export const knRangeLabel = (entry: Pick<KnRollTableEntry, 'min' | 'max'>) => entry.min === entry.max ? String(entry.min) : `${entry.min}-${entry.max}`

export interface KnTableEffectState {
  coins: number
  xp: number
  provisions: KnProvisions
  health: number
  toughness: number
  sanity: number
  aether: number
  exhaustion: number
  status: KnStatus
  run: KnRun
}

export interface KnTableEffectOutcome {
  effect: KnTableEffect
  roll: KnDiceRoll
  draw?: KnGrowingDarknessDraw
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

const NO_ROLL: KnDiceRoll = { rolls: [], total: 0 }

// Un état déjà présent garde sa plus forte valeur : le livre ne dit pas comment cumuler deux fois le même.
function withCondition(status: KnStatus, key: (typeof KN_CONDITION_KEYS)[number], value: number | undefined): KnStatus {
  const existing = status.conditions.find(entry => entry.key === key)
  if (!existing) return { ...status, conditions: [...status.conditions, { key, ...(value === undefined ? {} : { value }) }] }
  const merged = Math.max(existing.value ?? 0, value ?? 0)
  return {
    ...status,
    conditions: status.conditions.map(entry => entry.key === key ? { ...entry, ...(merged ? { value: merged } : {}) } : entry),
  }
}

// Les dégâts reçus par le survivant retirent la Robustesse temporaire, puis la Robustesse, puis la Santé.
export function knApplyDamage<T extends { toughness: number, health: number, status: KnStatus }>(
  state: T,
  maxima: { toughness: number, health: number },
  amount: number,
  direct = false,
): T {
  if (direct) return { ...state, health: Math.max(0, state.health - Math.max(0, amount)) }
  const temporary = knTemporaryOf(state.status, 'toughness')
  const hit = knTakeDamage({
    toughness: state.toughness,
    toughnessMax: maxima.toughness,
    health: state.health,
    healthMax: maxima.health,
    temporaryToughness: temporary,
  }, amount)
  return {
    ...state,
    toughness: hit.toughness,
    health: hit.health,
    status: hit.temporaryToughness === temporary ? state.status : knSetTemporary(state.status, 'toughness', hit.temporaryToughness),
  }
}

// Applique les gains et pertes d'un résultat. Une jauge ne dépasse pas son maximum en gagnant, et ne descend pas sous 0 en
// perdant ; `maxima` : les maxima effectifs. Les dégâts retirent la Robustesse temporaire, puis la Robustesse, puis la Santé.
export function knApplyTableEffects(
  effects: readonly KnTableEffect[],
  state: KnTableEffectState,
  maxima: Pick<Record<KnVitalKey, number>, 'health' | 'toughness' | 'sanity' | 'aether'>,
  rng: KnRng = Math.random,
  // `creature` : les dégâts viennent d'un adversaire, qui retient toujours le dé le plus haut.
  options: { creature?: boolean } = {},
): { state: KnTableEffectState, outcomes: KnTableEffectOutcome[] } {
  let next: KnTableEffectState = { ...state, provisions: { ...state.provisions } }
  const outcomes: KnTableEffectOutcome[] = []

  for (const effect of effects) {
    let roll = 'dice' in effect ? knRollDice(effect.dice, rng) : effect.kind === 'xp' ? { rolls: [], total: effect.amount } : NO_ROLL
    if (effect.kind === 'damage') {
      const picked = options.creature && roll.rolls.length ? Math.max(...roll.rolls) + effect.dice.bonus : roll.total
      roll = { rolls: roll.rolls, total: effect.half ? Math.ceil(picked / 2) : picked }
    }
    const outcome: KnTableEffectOutcome = { effect, roll }
    outcomes.push(outcome)
    const signed = (sign: 'gain' | 'loss' | undefined) => sign === 'loss' ? -roll.total : roll.total

    if (effect.kind === 'coins') next = { ...next, coins: clamp(next.coins + signed(effect.sign), KN_BOUNDS.coins.max) }
    else if (effect.kind === 'xp') next = { ...next, xp: clamp(next.xp + roll.total, KN_BOUNDS.xp.max) }
    else if (effect.kind === 'provision') {
      next = { ...next, provisions: { ...next.provisions, [effect.key]: clamp(next.provisions[effect.key] + signed(effect.sign), KN_PROVISION_BOUNDS.max) } }
    } else if (effect.kind === 'vital') {
      const current = next[effect.vital]
      const value = effect.sign === 'gain' ? Math.max(current, Math.min(maxima[effect.vital], current + roll.total)) : Math.max(0, current - roll.total)
      next = { ...next, [effect.vital]: value }
    } else if (effect.kind === 'damage') {
      next = knApplyDamage(next, maxima, roll.total, effect.direct)
    } else if (effect.kind === 'exhaustion') next = { ...next, exhaustion: clamp(next.exhaustion + signed(effect.sign), KN_BOUNDS.exhaustion.max) }
    else if (effect.kind === 'condition') next = { ...next, status: withCondition(next.status, effect.key, effect.value) }
    else if (effect.kind === 'temporary') next = { ...next, status: knGainTemporary(next.status, effect.vital, roll.total) }
    else if (effect.kind === 'tensionReset') next = { ...next, run: { ...next.run, tensionDie: KN_TENSION_START_DIE } }
    else if (effect.kind === 'lairDown') {
      const domain = knCurrentDomain(next.run)
      if (!domain.lairFound) {
        next = { ...next, run: { ...next.run, domains: next.run.domains.map((d, i) => i === next.run.current ? { ...d, lairDie: knLowerDie(d.lairDie) } : d) } }
      }
    } else {
      const draw = knDrawGrowingDarkness(rng)
      outcome.draw = draw
      next = { ...next, run: knAddGrowingDarkness(next.run, draw) }
    }
  }

  return { state: next, outcomes }
}

// Les tables d'exploration du livre : nom du jeu de données et dé.
export const KN_EXPLORATION_TABLES = {
  corridorDescriptions: { die: 20 },
  roomDescriptions: { die: 100 },
  events: { die: 100 },
  scavenging: { die: 20 },
  traps: { die: 10 },
  encountersA: { die: 20 },
  encountersB: { die: 20 },
  overseers: { die: 10 },
} as const

export type KnExplorationTableName = keyof typeof KN_EXPLORATION_TABLES

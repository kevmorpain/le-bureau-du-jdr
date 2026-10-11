import { z } from 'zod'
import { KN_PROVISION_BOUNDS, KN_PROVISION_KEYS, type KnProvisions } from './camp'
import { KN_BOUNDS } from './character'
import { knDiceSchema, knRollDice, type KnDiceRoll } from './dice'
import { KN_VITAL_KEYS, type KnVitalKey } from './effects'
import { knRollDie, type KnRng } from './run'
import { KN_SKILL_KEYS } from './skills'
import { boundedInt } from './zodHelpers'

// Ce qu'un résultat de table donne sans test ni choix : le reste (jets de compétence, alternatives) reste dans son texte.
export const knTableEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('coins'), dice: knDiceSchema }),
  z.object({ kind: z.literal('provision'), key: z.enum(KN_PROVISION_KEYS), dice: knDiceSchema }),
  z.object({ kind: z.literal('xp'), amount: boundedInt({ min: 1, max: 9999 }) }),
  z.object({ kind: z.literal('vital'), vital: z.enum(KN_VITAL_KEYS), dice: knDiceSchema, sign: z.enum(['gain', 'loss']) }),
])

export type KnTableEffect = z.infer<typeof knTableEffectSchema>

export const knRollTableEntrySchema = z.object({
  min: boundedInt({ min: 1, max: 100 }),
  max: boundedInt({ min: 1, max: 100 }),
  title: z.string().trim().min(1).max(100).optional(),
  skill: z.enum(KN_SKILL_KEYS).optional(),
  text: z.string().trim().min(1).max(2000),
  effects: z.array(knTableEffectSchema).max(4).optional(),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

export type KnRollTableEntry = z.infer<typeof knRollTableEntrySchema>

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
}

export interface KnTableEffectOutcome {
  effect: KnTableEffect
  roll: KnDiceRoll
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

// Applique les gains et pertes d'un résultat : pièces, provisions, expérience, jauges. Une jauge ne dépasse pas son
// maximum en gagnant, et ne descend pas sous 0 en perdant ; `maxima` : les maxima effectifs.
export function knApplyTableEffects(
  effects: readonly KnTableEffect[],
  state: KnTableEffectState,
  maxima: Pick<Record<KnVitalKey, number>, 'health' | 'toughness' | 'sanity' | 'aether'>,
  rng: KnRng = Math.random,
): { state: KnTableEffectState, outcomes: KnTableEffectOutcome[] } {
  let next: KnTableEffectState = { ...state, provisions: { ...state.provisions } }
  const outcomes: KnTableEffectOutcome[] = []

  for (const effect of effects) {
    const roll = effect.kind === 'xp' ? { rolls: [], total: effect.amount } : knRollDice(effect.dice, rng)
    outcomes.push({ effect, roll })

    if (effect.kind === 'coins') next = { ...next, coins: clamp(next.coins + roll.total, KN_BOUNDS.coins.max) }
    else if (effect.kind === 'xp') next = { ...next, xp: clamp(next.xp + roll.total, KN_BOUNDS.xp.max) }
    else if (effect.kind === 'provision') {
      next = { ...next, provisions: { ...next.provisions, [effect.key]: clamp(next.provisions[effect.key] + roll.total, KN_PROVISION_BOUNDS.max) } }
    } else {
      const current = next[effect.vital]
      const value = effect.sign === 'gain' ? Math.max(current, Math.min(maxima[effect.vital], current + roll.total)) : Math.max(0, current - roll.total)
      next = { ...next, [effect.vital]: value }
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
} as const

export type KnExplorationTableName = keyof typeof KN_EXPLORATION_TABLES

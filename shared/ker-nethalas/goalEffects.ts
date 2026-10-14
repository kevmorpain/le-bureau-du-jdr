import { z } from 'zod'
import { KN_CREATURE_TYPES, type KnCreatureType } from './catalog/creatureTypes'
import { KN_DAMAGE_TYPES, type KnDamageType } from './catalog/damageTypes'
import type { KnDice } from './diceSchema'
import { knDiceSchema } from './diceSchema'
import { KN_VITAL_KEYS, type KnActiveSource } from './effects'
import { KN_PERK_KEYS, knHasPerk, type KnPerkKey } from './perks'
import { KN_WEAPON_SKILL_KEYS } from './skills'
import { boundedInt } from './zodHelpers'

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

// Ce que la récompense d'un objectif change : les effets durables se copient sur la fiche à la récupération, les gains
// ponctuels (XP, amulette, dé de jauge) se donnent une seule fois ; `note` n'est qu'un rappel, sans mécanique.
export const knGoalEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('perk'), perk: z.enum(KN_PERK_KEYS) }),
  z.object({ kind: z.literal('reduction'), damage: z.enum(KN_DAMAGE_TYPES), amount: boundedInt({ min: 1, max: 9 }) }),
  z.object({ kind: z.literal('weaponBonus'), skill: z.enum(KN_WEAPON_SKILL_KEYS), amount: boundedInt({ min: 1, max: 9 }) }),
  z.object({ kind: z.literal('attackDice'), dice: knDiceSchema, damage: z.enum(KN_DAMAGE_TYPES) }),
  z.object({ kind: z.literal('criticalTriple'), creature: z.enum(KN_CREATURE_TYPES) }),
  z.object({ kind: z.literal('xp'), amount: boundedInt({ min: 1, max: 99999 }) }),
  z.object({ kind: z.literal('amulet') }),
  z.object({ kind: z.literal('maxVital'), vital: z.enum(KN_VITAL_KEYS), dice: knDiceSchema }),
  z.object({ kind: z.literal('note') }),
])

export type KnGoalEffect = z.infer<typeof knGoalEffectSchema>

export const KN_ONE_SHOT_GOAL_EFFECTS: readonly KnGoalEffect['kind'][] = ['xp', 'amulet', 'maxVital']

export const knGoalEffectEntrySchema = z.object({
  goal: slug,
  effect: knGoalEffectSchema,
  // Le texte de la récompense, pour un rappel.
  text: z.string().max(500).optional(),
})

export const knGoalEffectEntriesSchema = z.array(knGoalEffectEntrySchema).max(100)

export type KnGoalEffectEntry = z.infer<typeof knGoalEffectEntrySchema>

type Effects = readonly KnGoalEffectEntry[]

export const knGoalPerks = (entries: Effects): KnPerkKey[] =>
  entries.flatMap(({ effect }) => effect.kind === 'perk' ? [effect.perk] : [])

// Les Atouts de la fiche : ceux qu'on a cochés et ceux que donnent les objectifs récupérés.
export const knActivePerks = (perkKeys: readonly KnPerkKey[], entries: Effects): KnPerkKey[] =>
  [...new Set([...perkKeys, ...knGoalPerks(entries)])]

export const knHasActivePerk = (sheet: { perkKeys: readonly KnPerkKey[], goalEffects: Effects }, key: KnPerkKey) =>
  knHasPerk(knActivePerks(sheet.perkKeys, sheet.goalEffects), key)

export function knGoalReductions(entries: Effects): Partial<Record<KnDamageType, number>> {
  const reductions: Partial<Record<KnDamageType, number>> = {}
  for (const { effect } of entries) {
    if (effect.kind === 'reduction') reductions[effect.damage] = (reductions[effect.damage] ?? 0) + effect.amount
  }
  return reductions
}

export function knMergeReductions(...parts: Partial<Record<KnDamageType, number>>[]): Partial<Record<KnDamageType, number>> {
  const total: Partial<Record<KnDamageType, number>> = {}
  for (const part of parts) {
    for (const [type, amount] of Object.entries(part) as [KnDamageType, number][]) total[type] = (total[type] ?? 0) + amount
  }
  return total
}

export interface KnGoalAttackDie {
  dice: KnDice
  type?: KnDamageType
}

// Les dés et bonus que les objectifs ajoutent à la réserve de dégâts d'une attaque avec cette compétence d'arme.
export function knGoalAttackDice(entries: Effects, skill: string): KnGoalAttackDie[] {
  return entries.flatMap<KnGoalAttackDie>(({ effect }) => {
    if (effect.kind === 'attackDice') return [{ dice: effect.dice, type: effect.damage }]
    if (effect.kind === 'weaponBonus' && effect.skill === skill) return [{ dice: { count: 0, sides: 0, bonus: effect.amount } }]
    return []
  })
}

export const knGoalCriticalTriple = (entries: Effects, creatureTypes: readonly KnCreatureType[]): boolean =>
  entries.some(({ effect }) => effect.kind === 'criticalTriple' && creatureTypes.includes(effect.creature))

export function knGoalSources(entries: Effects): KnActiveSource[] {
  const reminders = entries.flatMap(({ effect, text }) => effect.kind === 'note' && text ? [{ label: { text }, severity: 'info' as const }] : [])
  return reminders.length ? [{ id: 'goalEffects', label: { text: 'Récompenses d\'objectifs' }, effects: [], reminders }] : []
}

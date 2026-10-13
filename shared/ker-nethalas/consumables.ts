import { z } from 'zod'
import { knDiceSchema } from './diceSchema'
import type { KnItem } from './inventory'
import { knTableEffectSchema, type KnEffectScale, type KnTableEffect } from './tables'
import { boundedInt, knCheckCoverage } from './zodHelpers'

// Ce qu'un fragment ou une potion fait quand on l'emploie : des effets que la fiche applique, et un jet que l'objet demande
// sans l'appliquer lui-même (dégâts sur des cibles, soin étalé sur plusieurs rounds).
export const knUseSchema = z.object({
  effects: z.array(knTableEffectSchema).max(8),
  roll: z.object({ dice: knDiceSchema, label: z.string().trim().min(1).max(100) }).optional(),
})

export type KnUse = z.infer<typeof knUseSchema>

export const KN_AGING_OUTCOMES = ['poison', 'explosion', 'inert', 'weak', 'normal', 'refined', 'permanent'] as const

export type KnAgingOutcome = (typeof KN_AGING_OUTCOMES)[number]

export const KN_AGING_DIE = 20

export const knAgingEntrySchema = z.object({
  min: boundedInt({ min: 1, max: KN_AGING_DIE }),
  max: boundedInt({ min: 1, max: KN_AGING_DIE }),
  text: z.string().trim().min(1).max(600),
  outcome: z.enum(KN_AGING_OUTCOMES),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

export type KnAgingEntry = z.infer<typeof knAgingEntrySchema>

export const knPotionAgingSchema = z.object({
  die: z.literal(KN_AGING_DIE),
  entries: z.array(knAgingEntrySchema).min(1).max(KN_AGING_DIE),
}).superRefine((table, ctx) => knCheckCoverage(table.entries, KN_AGING_DIE, ctx))

export type KnPotionAging = z.infer<typeof knPotionAgingSchema>

export const knAgingAt = (table: KnPotionAging, roll: number): KnAgingEntry | undefined =>
  table.entries.find(entry => roll >= entry.min && roll <= entry.max)

// Une potion qui a perdu de sa puissance agit moitié moins longtemps et moitié moins fort ; raffinée, moitié plus longtemps et
// deux fois plus fort ; parfaite, sans fin.
const SCALES: Partial<Record<KnAgingOutcome, KnEffectScale>> = {
  weak: { amount: 0.5, duration: 0.5 },
  refined: { amount: 2, duration: 1.5 },
  permanent: { amount: 1, duration: 1, permanent: true },
}

export const knAgingScale = (outcome: KnAgingOutcome): KnEffectScale | undefined => SCALES[outcome]

export const KN_POTION_EXPLOSION: KnTableEffect[] = [{ kind: 'damage', dice: { count: 2, sides: 4, bonus: 0 } }]

export const KN_POTION_POISON: KnTableEffect[] = [{ kind: 'condition', key: 'poisoned', value: 1 }]

// Les effets d'une potion bue selon son vieillissement. Une potion tournée au poison laisse un test d'Endurance (voir
// `KN_POTION_POISON` en cas d'échec) ; une explosion blesse celui qui l'ouvre ; une potion éventée ne fait rien.
export function knAgedEffects(outcome: KnAgingOutcome, effects: readonly KnTableEffect[]): KnTableEffect[] {
  if (outcome === 'explosion') return KN_POTION_EXPLOSION
  if (outcome === 'poison' || outcome === 'inert') return []
  return [...effects]
}

interface KnConsumableEntry {
  title?: string
  text: string
  use?: KnUse
}

// Une potion identifiée prend son vrai nom et sa description, et son vieillissement se tire une fois pour toutes.
export function knIdentifyPotion(item: KnItem, entry: Pick<KnConsumableEntry, 'title' | 'text'>, aging: number): KnItem {
  if (!item.consumable) return item
  return {
    ...item,
    name: entry.title ? `Potion : ${entry.title}` : 'Potion',
    note: entry.text.slice(0, 600),
    consumable: { ...item.consumable, identified: true, aging },
  }
}

export interface KnConsumablePlan {
  effects: KnTableEffect[]
  scale?: KnEffectScale
  roll?: KnUse['roll']
  // Une potion tournée au poison : le survivant fait un test d'Endurance, et devient Empoisonné (1) s'il échoue.
  enduranceCheck: boolean
  aging?: KnAgingEntry
}

// Ce que l'emploi d'un fragment ou d'une potion fait : ses effets, tels que son vieillissement les change.
export function knPlanConsumable(entry: KnConsumableEntry, aging?: KnAgingEntry): KnConsumablePlan {
  const effects = entry.use?.effects ?? []
  if (!aging) return { effects, ...(entry.use?.roll ? { roll: entry.use.roll } : {}), enduranceCheck: false }
  const scale = knAgingScale(aging.outcome)
  const works = !(['poison', 'explosion', 'inert'] as const satisfies readonly KnAgingOutcome[]).some(outcome => outcome === aging.outcome)
  return {
    effects: knAgedEffects(aging.outcome, effects),
    ...(scale ? { scale } : {}),
    ...(entry.use?.roll && works ? { roll: entry.use.roll } : {}),
    enduranceCheck: aging.outcome === 'poison',
    aging,
  }
}

// Un fragment ou une potion employé en moins : le dernier exemplaire quitte l'inventaire.
export const knSpendConsumable = (items: readonly KnItem[], id: string): KnItem[] =>
  items.flatMap(item => item.id !== id ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [])

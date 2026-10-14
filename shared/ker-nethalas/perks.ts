import { z } from 'zod'
import type { KnActiveSource } from './effects'

export const KN_PERK_KEYS = ['livingShadow', 'luckyFind', 'precisionStriker', 'scavenger', 'scholar', 'trapBuster'] as const

export type KnPerkKey = (typeof KN_PERK_KEYS)[number]

export const knPerkKeysSchema = z.array(z.enum(KN_PERK_KEYS)).max(KN_PERK_KEYS.length).refine(
  keys => new Set(keys).size === keys.length,
  { message: 'un Atout ne se prend qu\'une fois' },
)

export const knHasPerk = (perks: readonly KnPerkKey[], key: KnPerkKey) => perks.includes(key)

export const KN_LUCKY_FIND_DIE = 20
export const KN_SCAVENGER_DIE = 4

// Seul l'Avantage en Raison se résout comme un effet de la fiche ; les autres Atouts agissent dans le test, le combat ou la salle concernés.
export function knPerkSources(perks: readonly KnPerkKey[]): KnActiveSource[] {
  return knHasPerk(perks, 'scholar')
    ? [{ id: 'perk:scholar', label: { key: 'ker_nethalas.perks.scholar.name' }, effects: [{ type: 'advantage', targets: ['reason'] }], reminders: [] }]
    : []
}

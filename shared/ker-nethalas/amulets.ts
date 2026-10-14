import { z } from 'zod'
import { KN_MASTERY_TIERS, knAbilityPointsUnspent, knMasteryKeySchema, type KnMasteryPick } from './masteries'
import { knRollDie, type KnRng } from './run'
import { boundedInt } from './zodHelpers'

// Une amulette ne se vend pas et occupe un des 10 emplacements d'objets portés.
export const KN_MAX_OWNED_AMULETS = 10

// `owned` : la Maîtrise de chaque amulette possédée (deux amulettes peuvent donner la même) ; `equipped` : celle de
// l'amulette portée ; `tiers` : les aptitudes débloquées, qui suivent le survivant d'une amulette à l'autre.
export const knAmuletsSchema = z.object({
  owned: z.array(knMasteryKeySchema).max(KN_MAX_OWNED_AMULETS),
  equipped: knMasteryKeySchema.nullable(),
  tiers: boundedInt({ min: 0, max: KN_MASTERY_TIERS }),
}).superRefine((amulets, ctx) => {
  if (amulets.equipped !== null && !amulets.owned.includes(amulets.equipped)) {
    ctx.addIssue({ code: 'custom', path: ['equipped'], message: 'l\'amulette portée doit être possédée' })
  }
})

export type KnAmulets = z.infer<typeof knAmuletsSchema>

export const emptyKnAmulets = (): KnAmulets => ({ owned: [], equipped: null, tiers: 0 })

const isTrained = (picks: readonly KnMasteryPick[], key: string) => picks.some(pick => pick.key === key)

// La Maîtrise que l'amulette portée apporte : aucune si rien n'est porté, ou si elle est déjà apprise.
export const knAmuletMastery = (amulets: KnAmulets, picks: readonly KnMasteryPick[]) =>
  amulets.equipped !== null && !isTrained(picks, amulets.equipped) ? amulets.equipped : null

export interface KnMasteryEntry {
  key: string
  tiers: number
  amulet: boolean
}

// Les Maîtrises dont le survivant a l'usage : les apprises, puis celle de l'amulette portée si elle apporte quelque chose.
export function knMasteryEntries(picks: readonly KnMasteryPick[], amulets: KnAmulets): KnMasteryEntry[] {
  const amuletKey = knAmuletMastery(amulets, picks)
  return [
    ...picks.map(pick => ({ key: pick.key, tiers: pick.tiers, amulet: false })),
    ...(amuletKey === null ? [] : [{ key: amuletKey, tiers: amulets.tiers, amulet: true }]),
  ]
}

// Une amulette qui arrive est portée d'office si l'emplacement est libre et qu'elle apporte quelque chose.
export function knAddAmulet(amulets: KnAmulets, key: string, picks: readonly KnMasteryPick[]): KnAmulets {
  if (amulets.owned.length >= KN_MAX_OWNED_AMULETS) return { ...amulets, owned: [...amulets.owned] }
  const wearNow = amulets.equipped === null && !isTrained(picks, key)
  return { ...amulets, owned: [...amulets.owned, key], equipped: wearNow ? key : amulets.equipped }
}

// Porter une amulette ne se fait qu'au camp ; l'outil ne le contrôle pas.
export function knEquipAmulet(amulets: KnAmulets, key: string): KnAmulets {
  return amulets.owned.includes(key) ? { ...amulets, equipped: key } : { ...amulets, owned: [...amulets.owned] }
}

export const knUnequipAmulet = (amulets: KnAmulets): KnAmulets => ({ ...amulets, owned: [...amulets.owned], equipped: null })

// Retire un exemplaire : l'amulette portée ne l'est plus quand il n'en reste aucun.
export function knRemoveAmulet(amulets: KnAmulets, key: string): KnAmulets {
  const index = amulets.owned.indexOf(key)
  if (index === -1) return { ...amulets, owned: [...amulets.owned] }
  const owned = amulets.owned.filter((_, i) => i !== index)
  return { ...amulets, owned, equipped: amulets.equipped === key && !owned.includes(key) ? null : amulets.equipped }
}

export function knUnlockAmuletTier(amulets: KnAmulets, picks: readonly KnMasteryPick[], level: number): KnAmulets {
  if (knAmuletMastery(amulets, picks) === null || amulets.tiers >= KN_MASTERY_TIERS) return { ...amulets, owned: [...amulets.owned] }
  if (knAbilityPointsUnspent(level, picks, amulets.tiers) < 1) return { ...amulets, owned: [...amulets.owned] }
  return { ...amulets, owned: [...amulets.owned], tiers: amulets.tiers + 1 }
}

export const knLockAmuletTier = (amulets: KnAmulets): KnAmulets =>
  ({ ...amulets, owned: [...amulets.owned], tiers: Math.max(0, amulets.tiers - 1) })

// Table « Random Mastery » : un D20 sur les Maîtrises dans l'ordre du livre, soit l'ordre du contenu chargé.
// Une amulette trouvée donne accès à une Maîtrise tirée au hasard ; sans Maîtrises chargées, rien à tirer.
export function knDrawAmulet(
  amulets: KnAmulets,
  picks: readonly KnMasteryPick[],
  masteryKeys: readonly string[],
  rng: KnRng = Math.random,
): { amulets: KnAmulets, key: string } | null {
  const key = knRandomMasteryKey(masteryKeys, rng)
  return key === null ? null : { amulets: knAddAmulet(amulets, key, picks), key }
}

export function knRandomMasteryKey(keys: readonly string[], rng: KnRng = Math.random): string | null {
  return keys.length ? keys[knRollDie(keys.length, rng) - 1] ?? null : null
}

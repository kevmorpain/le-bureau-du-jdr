import { z } from 'zod'
import { KN_CREATURE_TYPES, type KnCreatureType } from './catalog/creatureTypes'
import { KN_DAMAGE_TYPES, type KnDamageType } from './catalog/damageTypes'
import { KN_WEAPON_SKILL_KEYS, type KnSkillKey } from './skills'

// Ce qu'un objectif compte. Sans `counts`, le progrès se note à la main.
export const knGoalCountSchema = z.discriminatedUnion('kind', [
  // Un adversaire vaincu : n'importe lequel, d'un type, vaincu avec une compétence d'arme, ou un Overseer.
  z.object({
    kind: z.literal('defeat'),
    creature: z.enum(KN_CREATURE_TYPES).optional(),
    skill: z.enum(KN_WEAPON_SKILL_KEYS).optional(),
    overseer: z.literal(true).optional(),
  }),
  z.object({ kind: z.literal('damage'), damage: z.enum(KN_DAMAGE_TYPES) }),
  z.object({ kind: z.literal('coins') }),
  z.object({ kind: z.literal('surprise') }),
  z.object({ kind: z.literal('lockpick') }),
  z.object({ kind: z.literal('critical') }),
  z.object({ kind: z.literal('relic') }),
  z.object({ kind: z.literal('scavenge') }),
  z.object({ kind: z.literal('reason') }),
  z.object({ kind: z.literal('trap') }),
  z.object({ kind: z.literal('darkness') }),
  z.object({ kind: z.literal('loreBook') }),
]).refine(
  count => count.kind !== 'defeat' || [count.creature, count.skill, count.overseer].filter(value => value !== undefined).length <= 1,
  { message: 'un seul critère de défaite à la fois' },
)

export type KnGoalCount = z.infer<typeof knGoalCountSchema>

// Ce qui s'est passé dans la partie, tel que le jeu le voit.
export type KnGoalEvent
  = | { kind: 'defeat', types: readonly KnCreatureType[], skill?: KnSkillKey, overseer?: boolean }
    | { kind: 'damage', damage: KnDamageType, amount: number }
    | { kind: 'coins', amount: number }
    | { kind: 'surprise', creatures: number }
    | { kind: 'lockpick' | 'critical' | 'relic' | 'scavenge' | 'reason' | 'trap' | 'darkness' | 'loreBook' }

// Ce que l'événement ajoute au compteur de l'objectif : 0 s'il ne le concerne pas.
export function knGoalIncrement(count: KnGoalCount, event: KnGoalEvent): number {
  if (count.kind !== event.kind) return 0
  switch (event.kind) {
    case 'defeat': {
      if (count.kind !== 'defeat') return 0
      if (count.overseer) return event.overseer ? 1 : 0
      if (count.creature) return event.types.includes(count.creature) ? 1 : 0
      if (count.skill) return event.skill === count.skill ? 1 : 0
      return 1
    }
    case 'damage': return count.kind === 'damage' && count.damage === event.damage ? Math.max(0, event.amount) : 0
    case 'coins': return Math.max(0, event.amount)
    case 'surprise': return Math.max(0, event.creatures)
    default: return 1
  }
}

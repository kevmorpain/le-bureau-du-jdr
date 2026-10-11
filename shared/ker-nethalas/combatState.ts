import { z } from 'zod'
import { boundedInt } from './zodHelpers'

export const KN_COMBAT_BOUNDS = {
  creatures: 12,
  health: { min: 0, max: 9999 },
  round: { min: 1, max: 99 },
  reactions: { min: 0, max: 20 },
  log: 30,
} as const

// Une créature engagée : sa fiche (par clé), son nom pour l'affichage, et sa Santé fixée à l'engagement (niveau compris).
export const knCombatCreatureSchema = z.object({
  ref: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/).optional(),
  name: z.string().trim().min(1).max(100),
  health: boundedInt(KN_COMBAT_BOUNDS.health),
  maxHealth: boundedInt({ min: 1, max: KN_COMBAT_BOUNDS.health.max }),
})

export const knCombatSchema = z.object({
  creatures: z.array(knCombatCreatureSchema).min(1).max(KN_COMBAT_BOUNDS.creatures),
  round: boundedInt(KN_COMBAT_BOUNDS.round),
  // Qui agit en premier jusqu'à la fin du combat, une fois l'Initiative jouée.
  first: z.enum(['survivor', 'creatures']).optional(),
  // Défenses déjà faites ce round : chacune après la première coûte −20, cumulatif.
  reactions: boundedInt(KN_COMBAT_BOUNDS.reactions),
  log: z.array(z.string().max(400)).max(KN_COMBAT_BOUNDS.log),
})

export type KnCombat = z.infer<typeof knCombatSchema>
export type KnCombatCreature = z.infer<typeof knCombatCreatureSchema>

export const KN_REACTION_PENALTY = 20

export const knReactionPenalty = (reactions: number) => KN_REACTION_PENALTY * Math.max(0, reactions)

export const knCreatureDefeated = (creature: KnCombatCreature) => creature.health <= 0

export const knCombatWon = (combat: KnCombat) => combat.creatures.every(knCreatureDefeated)

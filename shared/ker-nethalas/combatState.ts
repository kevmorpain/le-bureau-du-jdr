import { z } from 'zod'
import { KN_DAMAGE_TYPES } from './catalog/damageTypes'
import { knDiceSchema } from './diceSchema'
import { boundedInt } from './zodHelpers'

export const KN_COMBAT_BOUNDS = {
  creatures: 12,
  minions: 6,
  health: { min: 0, max: 9999 },
  round: { min: 1, max: 99 },
  reactions: { min: 0, max: 20 },
  log: 30,
} as const

const knDamageTypeList = z.array(z.enum(KN_DAMAGE_TYPES)).max(KN_DAMAGE_TYPES.length)

// Ce qu'un effet change chez une créature tant qu'il dure (Résistant, Avantage, bonus de Compétence de combat…).
export const knCreatureBuffFields = {
  resistantAll: z.boolean().optional(),
  // Types qu'un « Résistant à tout » laisse passer.
  resistantExcept: knDamageTypeList.optional(),
  resistant: knDamageTypeList.optional(),
  immune: knDamageTypeList.optional(),
  // Immunisée contre les dégâts qui ne sont pas magiques.
  immuneNonMagical: z.boolean().optional(),
  vulnerableAll: z.boolean().optional(),
  // Les attaques qui la visent se font avec Désavantage.
  disadvantageAgainst: z.boolean().optional(),
  // Avantage à ses attaques, ou à ses défenses.
  advantage: z.enum(['attack', 'defense']).optional(),
  // Bonus à toutes ses compétences de combat, ou à ses défenses seulement.
  combatSkill: boundedInt({ min: -99, max: 99 }).optional(),
  defenseSkill: boundedInt({ min: -99, max: 99 }).optional(),
  // Dé ajouté à la réserve de dégâts de ses actions.
  damageBonus: knDiceSchema.optional(),
  // Dégâts subis par la créature qui l'attaque.
  reflect: z.object({ dice: knDiceSchema, type: z.enum(KN_DAMAGE_TYPES) }).optional(),
  // Tombe dès que la créature s'en est servie pour une attaque qui inflige des dégâts.
  once: z.boolean().optional(),
}

export const knCreatureBuffSchema = z.object({
  label: z.string().trim().min(1).max(100),
  // Rounds restants ; jusqu'à son prochain tour (`untilTurn`) ; sans l'un ni l'autre, jusqu'à la fin du combat.
  rounds: boundedInt({ min: 1, max: 99 }).optional(),
  untilTurn: z.boolean().optional(),
  ...knCreatureBuffFields,
})

export type KnCreatureBuff = z.infer<typeof knCreatureBuffSchema>

// Une créature engagée : sa fiche (par clé), son nom pour l'affichage, et sa Santé fixée à l'engagement (niveau compris).
export const knCombatCreatureSchema = z.object({
  ref: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/).optional(),
  name: z.string().trim().min(1).max(100),
  health: boundedInt(KN_COMBAT_BOUNDS.health),
  maxHealth: boundedInt({ min: 1, max: KN_COMBAT_BOUNDS.health.max }),
  // Santé temporaire : dépensée avant la Santé, jusqu'à son prochain tour (`turn`) ou la fin du round (`round`) si elle expire.
  temporary: boundedInt(KN_COMBAT_BOUNDS.health).optional(),
  temporaryUntil: z.enum(['turn', 'round']).optional(),
  effects: z.array(knCreatureBuffSchema).max(8).optional(),
  // Une créature éphémère a joué son action : elle disparaît au tour suivant.
  spent: z.boolean().optional(),
})

export const knCombatSchema = z.object({
  creatures: z.array(knCombatCreatureSchema).min(1).max(KN_COMBAT_BOUNDS.creatures),
  round: boundedInt(KN_COMBAT_BOUNDS.round),
  // Le combat contre l'Overseer du Domaine : sa victoire rapporte plus d'expérience.
  overseer: z.boolean().optional(),
  // Surprise réussie : la première attaque du survivant reçoit +20.
  surprise: z.boolean().optional(),
  // Combat à deux armes : l'identifiant de l'arme dominante, choisie au début du combat.
  dual: z.string().min(1).max(40).optional(),
  // La Parade gratuite du combat à deux armes est déjà prise ce round.
  freeParryUsed: z.boolean().optional(),
  // La lampe est posée au sol (Action Standard) : une main est libre, mais une maladresse la renverse.
  lampDown: z.boolean().optional(),
  // Créature Effrayante ou Terrifiante : la Santé mentale perdue sur un test de Résolution raté, une seule fois par rencontre.
  fear: z.object({ loss: boundedInt({ min: 1, max: 9 }), resolved: z.boolean() }).optional(),
  // Qui agit en premier jusqu'à la fin du combat, une fois l'Initiative jouée.
  first: z.enum(['survivor', 'creatures']).optional(),
  // Défenses déjà faites ce round : chacune après la première coûte −20, cumulatif.
  reactions: boundedInt(KN_COMBAT_BOUNDS.reactions),
  // Les pièces d'équipement (par identifiant) qui ont servi dans ce combat : leur Intégrité se joue à la fin.
  gearUsed: z.array(z.string().min(1).max(40)).max(20).optional(),
  log: z.array(z.string().max(400)).max(KN_COMBAT_BOUNDS.log),
})

export type KnCombat = z.infer<typeof knCombatSchema>
export type KnCombatCreature = z.infer<typeof knCombatCreatureSchema>

export const KN_REACTION_PENALTY = 20

export const knReactionPenalty = (reactions: number) => KN_REACTION_PENALTY * Math.max(0, reactions)

export const knCreatureDefeated = (creature: KnCombatCreature) => creature.health <= 0

export const knCombatWon = (combat: KnCombat) => combat.creatures.every(knCreatureDefeated)

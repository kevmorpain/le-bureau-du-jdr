import { z } from 'zod'
import type { KnDamageType } from './catalog/damageTypes'
import type { KnDice } from './diceSchema'
import { KN_SKILL_KEYS } from './skills'
import { boundedInt } from './zodHelpers'

// Module feuille : `character.ts` en importe le schéma, il ne doit rien tirer de `character`.

// Il faut 1 000 XP pour monter de niveau (p. 62).
export const KN_LEVEL_XP = 1000

// Les huit avantages au choix d'un passage de niveau (p. 62).
export const KN_LEVEL_BENEFITS = ['health', 'toughness', 'sanity', 'aether', 'physicalDamage', 'abilityDamage', 'skill', 'resistances'] as const

export type KnLevelBenefitKey = (typeof KN_LEVEL_BENEFITS)[number]

export const KN_PHYSICAL_DAMAGE_TYPES = ['slashing', 'bludgeoning', 'piercing'] as const

// Ce que chaque avantage de jauge ajoute au maximum.
export const KN_LEVEL_VITAL_DICE = {
  health: { count: 1, sides: 4, bonus: 0 },
  toughness: { count: 1, sides: 6, bonus: 0 },
  sanity: { count: 1, sides: 4, bonus: 0 },
  aether: { count: 1, sides: 6, bonus: 0 },
} as const satisfies Record<string, KnDice>

export const KN_LEVEL_SKILL_BONUS = 5
export const KN_LEVEL_RESISTANCE_BONUS = 5

// Un avantage pris à un passage de niveau : la liste garde l'historique, et sert aux deux avantages qui agissent plus tard (des
// dés de dégâts physiques à la réserve, +1 aux dégâts d'une Aptitude).
export const knLevelBenefitSchema = z.object({
  benefit: z.enum(KN_LEVEL_BENEFITS),
  // Le niveau atteint en le prenant.
  level: boundedInt({ min: 2, max: 99 }),
  skill: z.enum(KN_SKILL_KEYS).optional(),
  damageType: z.enum(KN_PHYSICAL_DAMAGE_TYPES).optional(),
  // `<clé de Maîtrise>:<palier>`, comme les usages limités.
  ability: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}:[1-5]$/).optional(),
})

export type KnLevelBenefit = z.infer<typeof knLevelBenefitSchema>

export const knLevelBenefitsSchema = z.array(knLevelBenefitSchema).max(98)

export type KnLevelChoice = Omit<KnLevelBenefit, 'level'>

export const knCanLevelUp = (xp: number): boolean => xp >= KN_LEVEL_XP

// Ce qui manque à un choix pour être complet : la compétence, le type de dégâts ou l'Aptitude que l'avantage vise.
export function knLevelChoiceIssues(choice: Partial<KnLevelChoice>): string[] {
  if (!choice.benefit) return ['Choisissez un avantage.']
  if (choice.benefit === 'skill' && !choice.skill) return ['Choisissez la compétence.']
  if (choice.benefit === 'physicalDamage' && !choice.damageType) return ['Choisissez le type de dégâts.']
  if (choice.benefit === 'abilityDamage' && !choice.ability) return ['Choisissez l\'Aptitude.']
  return []
}

// Les dés ajoutés à la réserve de dégâts physiques (hors Aptitudes) : un D6 par avantage pris, du type choisi.
export const knLevelAttackDice = (benefits: readonly KnLevelBenefit[]): { dice: KnDice, type: KnDamageType }[] =>
  benefits.flatMap(entry => entry.benefit === 'physicalDamage' && entry.damageType
    ? [{ dice: { count: 1, sides: 6, bonus: 0 }, type: entry.damageType }]
    : [])

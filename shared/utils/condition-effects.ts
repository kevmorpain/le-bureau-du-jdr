import type { ConditionKey } from '~~/server/db/schema/effects'

type SaveKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type ConditionMechanics = {
  speedZero?: boolean
  skillDisadvantage?: boolean
  attackDisadvantage?: boolean
  saveDisadvantage?: SaveKey[]
  saveAutoFail?: SaveKey[]
  resistAllDamage?: boolean
  immunePoison?: boolean
}

export const conditionMechanics: Record<ConditionKey, ConditionMechanics> = {
  prone: { attackDisadvantage: true },
  grappled: { speedZero: true },
  deafened: {},
  blinded: { attackDisadvantage: true },
  charmed: {},
  frightened: { skillDisadvantage: true, attackDisadvantage: true },
  poisoned: { skillDisadvantage: true, attackDisadvantage: true },
  restrained: { speedZero: true, attackDisadvantage: true, saveDisadvantage: ['dex'] },
  stunned: { speedZero: true, saveAutoFail: ['str', 'dex'] },
  incapacitated: {},
  unconscious: { speedZero: true, saveAutoFail: ['str', 'dex'] },
  invisible: {},
  paralyzed: { speedZero: true, saveAutoFail: ['str', 'dex'] },
  petrified: { speedZero: true, saveAutoFail: ['str', 'dex'], resistAllDamage: true, immunePoison: true },
  exhaustion: {},
}

export const conditionTooltipLines: Record<ConditionKey, string[]> = {
  prone: [
    'Désavantage aux jets d\'attaque.',
    'Les attaquants à 1,5 m ont l\'avantage.',
    'Les attaquants à distance ont le désavantage.',
  ],
  grappled: [
    'Vitesse réduite à 0.',
    'Prend fin si l\'agrippeur est neutralisé ou s\'éloigne.',
  ],
  deafened: [
    'Ne peut pas entendre.',
    'Rate automatiquement les jets nécessitant l\'ouïe.',
  ],
  blinded: [
    'Ne peut pas voir.',
    'Désavantage aux jets d\'attaque.',
    'Les attaquants ont l\'avantage.',
    'Rate automatiquement les jets nécessitant la vue.',
    'Les sorts nécessitant la vue sont impossibles.',
  ],
  charmed: [
    'Ne peut pas attaquer le charmeur ni le cibler avec des effets nuisibles.',
    'Le charmeur a l\'avantage aux jets d\'interaction sociale.',
  ],
  frightened: [
    'Désavantage aux jets de caractéristique et d\'attaque si la source de peur est visible.',
    'Ne peut pas s\'approcher volontairement de la source de peur.',
  ],
  poisoned: [
    'Désavantage aux jets d\'attaque.',
    'Désavantage aux jets de caractéristique.',
  ],
  restrained: [
    'Vitesse réduite à 0.',
    'Désavantage aux jets d\'attaque.',
    'Désavantage aux jets de sauvegarde de Dextérité.',
    'Les attaquants ont l\'avantage.',
  ],
  stunned: [
    'Neutralisé (aucune action ni réaction).',
    'Vitesse réduite à 0.',
    'Rate automatiquement les jets de sauvegarde de Force et Dextérité.',
    'Les attaquants ont l\'avantage.',
  ],
  incapacitated: [
    'Ne peut pas effectuer d\'actions ni de réactions.',
  ],
  unconscious: [
    'Neutralisé (aucune action ni réaction).',
    'Vitesse réduite à 0. Lâche tout ce qu\'il tient. Tombe à terre.',
    'Rate automatiquement les jets de sauvegarde de Force et Dextérité.',
    'Les attaquants ont l\'avantage.',
    'Les attaques de corps-à-corps à 1,5 m sont des coups critiques automatiques.',
  ],
  invisible: [
    'Ne peut pas être vu sans magie ou sens spéciaux.',
    'Avantage aux jets d\'attaque.',
    'Les attaquants ont le désavantage.',
  ],
  paralyzed: [
    'Neutralisé (aucune action ni réaction).',
    'Vitesse réduite à 0.',
    'Rate automatiquement les jets de sauvegarde de Force et Dextérité.',
    'Les attaquants ont l\'avantage.',
    'Les attaques de corps-à-corps à 1,5 m sont des coups critiques automatiques.',
  ],
  petrified: [
    'Transformé en pierre. Poids multiplié par 10.',
    'Neutralisé (aucune action ni réaction).',
    'Vitesse réduite à 0.',
    'Rate automatiquement les jets de sauvegarde de Force et Dextérité.',
    'Résistance à tous les types de dégâts.',
    'Immunisé contre le poison et les maladies.',
    'Les attaquants ont l\'avantage.',
  ],
  exhaustion: [],
}

export const exhaustionImpactLines: string[] = [
  'Niv. 1 : Désavantage aux jets de caractéristique',
  'Niv. 2 : Vitesse divisée par 2',
  'Niv. 3 : Désavantage aux jets d\'attaque et de sauvegarde',
  'Niv. 4 : Maximum de PV divisé par 2',
  'Niv. 5 : Vitesse réduite à 0',
  'Niv. 6 : Mort',
]

import type { Effect } from '../../schema/effects'

export interface FeatSeed {
  name: string // Nom FR canonique (PHB 2014)
  description: string
  // Slug stable utilisé par l'UI pour les mappings côté front (LU_FEATS).
  // Stocké uniquement dans le seed, pas en DB — la résolution côté serveur
  // se fait via le nom FR.
  slug: string
  effects: Effect[]
}

// Dons du PHB 2014 (FR). Chacun se traduit en feature `feature_type='feat'` au seed,
// avec ses effets mécaniques quand ils sont automatisables.
export const featsData: FeatSeed[] = [
  {
    slug: 'alert',
    name: 'Alerte',
    description: 'Toujours sur vos gardes : +5 à l\'initiative ; ne peut être surpris tant que vous êtes conscient ; les créatures cachées ou invisibles n\'obtiennent pas l\'avantage à leurs jets d\'attaque contre vous.',
    effects: [
      { type: 'initiative_bonus', value: { amount: 5 } },
      { type: 'other', value: { kind: 'cannot_be_surprised_while_conscious' } },
      { type: 'other', value: { kind: 'no_hidden_attacker_advantage' } },
    ],
  },
  {
    slug: 'athlete',
    name: 'Athlète',
    description: '+1 en Force ou en Dextérité (max 20). Se relever ne coûte que 1,5 m de mouvement ; ne subit pas de désavantage en faisant des sauts en longueur ou en hauteur ; escalade à vitesse normale.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['str', 'dex'] } },
      { type: 'other', value: { kind: 'athlete_movement' } },
    ],
  },
  {
    slug: 'great-weapon',
    name: 'Maître d\'armes de guerre',
    description: 'Avant une attaque de mêlée avec une arme lourde dont vous êtes maître, vous pouvez subir −5 au jet d\'attaque pour gagner +10 aux dégâts. Quand vous obtenez un coup critique ou réduisez une créature à 0 PV avec une arme de mêlée, vous pouvez faire une attaque bonus avec la même arme.',
    effects: [
      { type: 'other', value: { kind: 'great_weapon_master_bonus_attack' } },
      { type: 'other', value: { kind: 'great_weapon_master_power_attack' } },
    ],
  },
  {
    slug: 'lucky',
    name: 'Chanceux',
    description: 'Vous disposez de 3 points de chance par repos long. Avant ou après un jet d\'attaque, de sauvegarde ou de caractéristique, vous pouvez dépenser un point pour lancer un d20 supplémentaire et choisir le résultat.',
    effects: [
      { type: 'other', value: { kind: 'lucky_points_per_long_rest', amount: 3 } },
    ],
  },
  {
    slug: 'mage-slayer',
    name: 'Tueur de mages',
    description: 'Quand une créature à 1,5 m lance un sort, vous pouvez utiliser votre réaction pour l\'attaquer en mêlée. Avantage aux jets de sauvegarde contre les sorts lancés par une créature à 1,5 m. Quand vous infligez des dégâts à une créature concentrée, elle a un désavantage au jet de sauvegarde de concentration.',
    effects: [
      { type: 'other', value: { kind: 'mage_slayer' } },
    ],
  },
  {
    slug: 'mobile',
    name: 'Mobile',
    description: 'Votre vitesse augmente de 3 m. Quand vous utilisez l\'action Sprinter, le terrain difficile ne vous coûte aucun mouvement supplémentaire ce tour. Quand vous attaquez une créature en mêlée, elle ne provoque pas d\'attaque d\'opportunité contre vous ce tour.',
    effects: [
      { type: 'walking_speed', value: 3 },
      { type: 'other', value: { kind: 'mobile_no_opportunity_attacks' } },
    ],
  },
  {
    slug: 'resilient',
    name: 'Résilient',
    description: 'Choisissez une caractéristique : +1 dans celle-ci (max 20), et vous gagnez la maîtrise des jets de sauvegarde correspondants.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1 } },
      { type: 'other', value: { kind: 'resilient_saving_throw_proficiency_choice' } },
    ],
  },
  {
    slug: 'sentinel',
    name: 'Sentinelle',
    description: 'Quand vous portez un coup d\'opportunité, la vitesse de la cible tombe à 0 jusqu\'à la fin du tour. Les créatures provoquent une attaque d\'opportunité même en se Désengageant. Quand une créature à 1,5 m attaque une autre cible que vous, vous pouvez utiliser votre réaction pour l\'attaquer en mêlée.',
    effects: [
      { type: 'other', value: { kind: 'sentinel' } },
    ],
  },
  {
    slug: 'sharpshooter',
    name: 'Tireur d\'élite',
    description: 'Les attaques à distance à longue portée ne subissent pas de désavantage. Les attaques à distance ignorent les couverts à 1/2 et aux 3/4. Avant une attaque à distance avec une arme à laquelle vous êtes maître, vous pouvez choisir de subir –5 au jet d\'attaque pour gagner +10 aux dégâts.',
    effects: [
      { type: 'other', value: { kind: 'sharpshooter' } },
    ],
  },
  {
    slug: 'tough',
    name: 'Robuste',
    description: 'Vos points de vie maximum augmentent de 2 par niveau de personnage. Chaque fois que vous gagnez un niveau par la suite, vos PV maximum augmentent de 2 supplémentaires.',
    effects: [
      { type: 'hp_per_level', value: { amount: 2 } },
    ],
  },
  {
    slug: 'war-caster',
    name: 'Mage de guerre',
    description: 'Avantage aux jets de sauvegarde de Constitution pour maintenir votre concentration sur un sort quand vous subissez des dégâts. Vous pouvez accomplir des composantes somatiques avec vos mains pleines (arme/bouclier). Quand une créature provoque une attaque d\'opportunité, vous pouvez à la place lancer un sort à 1 action (ciblant cette créature).',
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration_after_damage' } },
      { type: 'other', value: { kind: 'war_caster_somatic_with_full_hands' } },
      { type: 'other', value: { kind: 'war_caster_spell_as_opportunity_attack' } },
    ],
  },
  {
    slug: 'magic-init',
    name: 'Initié à la magie',
    description: 'Choisissez une classe (Barde, Clerc, Druide, Ensorceleur, Magicien ou Occultiste). Vous apprenez 2 tours de magie de cette classe et 1 sort de niveau 1 que vous pouvez lancer une fois par repos long sans dépenser d\'emplacement de sort (peut aussi être lancé en utilisant un emplacement).',
    effects: [
      { type: 'other', value: { kind: 'magic_initiate_choice' } },
    ],
  },
  {
    slug: 'observant',
    name: 'Observateur',
    description: '+1 en Intelligence ou en Sagesse (max 20). +5 à votre Perception passive et à votre Investigation passive. Vous pouvez lire sur les lèvres en observant attentivement une créature qui parle une langue que vous comprenez.',
    effects: [
      { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['int', 'wis'] } },
      { type: 'passive_skill_bonus', value: { skill: 'perception', amount: 5 } },
      { type: 'passive_skill_bonus', value: { skill: 'investigation', amount: 5 } },
      { type: 'other', value: { kind: 'observant_lip_reading' } },
    ],
  },
]

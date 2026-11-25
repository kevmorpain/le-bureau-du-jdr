import type { EffectType } from '~~/server/db/schema/effects'
import { ABILITY_SCORE_MAX } from '~~/shared/rules/abilityScores'
import { fixed } from '~~/shared/utils/formula'

// Shared by the item effect editor and the temporary effect editor of the new sheet.
export const EFFECT_TYPE_OPTIONS: { label: string, value: EffectType }[] = [
  { label: 'Bonus à la CA', value: 'armor_class_bonus' },
  { label: 'Bonus aux jets de sauvegarde', value: 'saving_throw_bonus' },
  { label: 'Dégâts supplémentaires', value: 'weapon_damage_dice' },
  { label: 'Résistance aux dégâts', value: 'damage_resistance' },
  { label: 'Immunité aux dégâts', value: 'damage_immunity' },
  { label: 'Vulnérabilité aux dégâts', value: 'vulnerability' },
  { label: 'Augmentation de caractéristique', value: 'ability_increase' },
  { label: 'Caractéristique fixée', value: 'ability_score_set' },
  { label: 'Bonus aux jets d\'attaque d\'arme', value: 'weapon_attack_bonus' },
  { label: 'Bonus aux dégâts d\'arme', value: 'weapon_damage_bonus' },
  { label: 'Avantage (caractéristique, sauvegarde, attaque, initiative)', value: 'advantage' },
  { label: 'Bonus de vitesse', value: 'speed_bonus' },
  { label: 'Vitesse de nage', value: 'swimming_speed' },
  { label: 'Vitesse d\'escalade', value: 'climbing_speed' },
  { label: 'Vitesse de creusement', value: 'burrowing_speed' },
  { label: 'Vision dans le noir', value: 'darkvision' },
  { label: 'Maîtrise d\'arme', value: 'weapon_proficiency' },
  { label: 'Maîtrise (armure/outil)', value: 'proficiency' },
  { label: 'Bonus DD de sort', value: 'spell_save_dc_bonus' },
  { label: 'Bonus jet d\'attaque de sort', value: 'spell_attack_bonus' },
  { label: 'Bonus aux dégâts des sorts', value: 'spell_damage_bonus' },
  { label: 'Bonus à l\'initiative', value: 'initiative_bonus' },
  { label: 'PV par niveau', value: 'hp_per_level' },
  { label: 'Bonus à une compétence passive', value: 'passive_skill_bonus' },
]

export const EFFECT_PASSIVE_SKILL_OPTIONS = [
  { label: 'Perception passive', value: 'perception' },
  { label: 'Investigation passive', value: 'investigation' },
]

export const EFFECT_DAMAGE_TYPE_OPTIONS = [
  { label: 'Acide', value: 'acid' },
  { label: 'Contondant', value: 'bludgeoning' },
  { label: 'Froid', value: 'cold' },
  { label: 'Feu', value: 'fire' },
  { label: 'Force', value: 'force' },
  { label: 'Foudre', value: 'lightning' },
  { label: 'Nécrotique', value: 'necrotic' },
  { label: 'Perçant', value: 'piercing' },
  { label: 'Poison', value: 'poison' },
  { label: 'Psychique', value: 'psychic' },
  { label: 'Radiant', value: 'radiant' },
  { label: 'Tranchant', value: 'slashing' },
  { label: 'Tonnerre', value: 'thunder' },
]

export const EFFECT_ABILITY_OPTIONS = [
  { label: 'Force', value: 'str' },
  { label: 'Dextérité', value: 'dex' },
  { label: 'Constitution', value: 'con' },
  { label: 'Intelligence', value: 'int' },
  { label: 'Sagesse', value: 'wis' },
  { label: 'Charisme', value: 'cha' },
]

export const EFFECT_WEAPON_SCOPE_OPTIONS = [
  { label: 'Toutes', value: 'all' },
  { label: 'Corps à corps', value: 'melee' },
  { label: 'Distance', value: 'ranged' },
]

export const EFFECT_ADVANTAGE_ROLL_OPTIONS = [
  { label: 'Jet de sauvegarde', value: 'saving_throw' },
  { label: 'Jet de caractéristique', value: 'check' },
  { label: 'Jet d\'attaque', value: 'attack' },
  { label: 'Initiative', value: 'initiative' },
]

export const EFFECT_SAVE_ABILITY_OPTIONS = [
  { label: 'Tous', value: 'all' },
  ...EFFECT_ABILITY_OPTIONS,
]

export const defaultEffectValue = (type: string): unknown => {
  switch (type) {
    case 'weapon_damage_dice': return { name: 'Dégâts supplémentaires', dice: fixed(1), sides: 6, damageType: 'fire', weapons: 'all', limit: 'each_hit' }
    case 'damage_resistance':
    case 'damage_immunity':
    case 'vulnerability': return { damageType: 'fire' }
    case 'ability_increase': return { ability: 'str', amount: 2, max: ABILITY_SCORE_MAX }
    case 'ability_score_set': return { ability: 'str', score: 19 }
    case 'weapon_attack_bonus':
    case 'weapon_damage_bonus': return { amount: 1, weapons: 'all' }
    case 'advantage': return { rollType: 'saving_throw', ability: 'all', condition: '' }
    case 'speed_bonus': return { amount: fixed(3) }
    case 'swimming_speed':
    case 'climbing_speed':
    case 'burrowing_speed': return 9
    case 'darkvision': return { range: 18 }
    case 'weapon_proficiency': return 'simple_weapons'
    case 'proficiency': return 'light'
    case 'saving_throw_bonus': return { ability: 'all', amount: 1 }
    case 'armor_class_bonus':
    case 'spell_save_dc_bonus':
    case 'spell_attack_bonus':
    case 'spell_damage_bonus':
    case 'initiative_bonus':
    case 'hp_per_level': return { amount: 1 }
    case 'passive_skill_bonus': return { skill: 'perception', amount: 5 }
    default: return {}
  }
}

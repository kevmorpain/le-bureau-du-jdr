import type { AbilityScoreKey, DamageTypeKey, Effect } from '~~/server/db/schema/effects'
import type { WeaponBonusScope } from '~~/shared/rules/effectBonuses'
import { fixedAmount } from '~~/shared/utils/formula'
import { damageTypeLabels } from '~~/shared/utils/labels'
import { ABILITY_SHORT } from '~~/app/data/character-builder'
import { formatModifier } from './format'

// Les effets d'objet custom ne sont pas validés côté serveur : une clé inconnue s'affiche telle quelle.
const ability = (key: AbilityScoreKey) => ABILITY_SHORT[key] ?? key
const damage = (key: DamageTypeKey) => damageTypeLabels[key] ?? key

const ADVANTAGE_ROLL_LABELS: Record<string, string> = { check: 'JdC', saving_throw: 'JdS', attack: 'attaque', initiative: 'initiative' }

const WEAPON_SCOPE_SUFFIX: Record<WeaponBonusScope, string> = { all: '', melee: ' (corps à corps)', ranged: ' (distance)' }

// Malus : un bonus chiffré négatif, ou une vulnérabilité.
export const isEffectMalus = (effect: Effect): boolean => {
  if (effect.type === 'vulnerability') return true
  if (effect.type === 'speed_bonus') return (fixedAmount(effect.value.amount) ?? 0) < 0
  const v = effect.value
  return typeof v === 'object' && 'amount' in v && typeof v.amount === 'number' && v.amount < 0
}

export const effectLabel = (effect: Effect): string => {
  switch (effect.type) {
    case 'armor_class_bonus': return `${formatModifier(effect.value.amount)} CA`
    case 'saving_throw_bonus': {
      const target = effect.value.ability === 'all' ? '(tous)' : ability(effect.value.ability)
      return `${formatModifier(effect.value.amount)} JS ${target}`
    }
    case 'weapon_attack_bonus':
      return `${formatModifier(effect.value.amount)} attaque${WEAPON_SCOPE_SUFFIX[effect.value.weapons]}`
    case 'weapon_damage_bonus':
      return `${formatModifier(effect.value.amount)} dégâts${WEAPON_SCOPE_SUFFIX[effect.value.weapons]}`
    case 'advantage': {
      const roll = ADVANTAGE_ROLL_LABELS[effect.value.rollType] ?? effect.value.rollType
      const target = effect.value.ability === 'all' || effect.value.rollType === 'initiative' ? '' : ` ${ability(effect.value.ability)}`
      return `Avantage ${roll}${target}${effect.value.condition ? ` : ${effect.value.condition}` : ''}`
    }
    case 'half_proficiency': {
      const target = effect.value.abilities === 'all' ? '' : ` (${effect.value.abilities.map(ability).join(', ')})`
      return `Demi-maîtrise aux jets de caractéristique${target}`
    }
    case 'proficient_check_minimum': return `Jets de compétence maîtrisée : minimum ${effect.value.minimum}`
    case 'critical_range': return `Critique dès ${effect.value.from} (armes)`
    case 'critical_extra_dice': return 'Dés de critique supplémentaires (corps à corps)'
    case 'halve_damage_reaction': return 'Réaction : dégâts ÷ 2'
    case 'spell_save_dc_bonus': return `${formatModifier(effect.value.amount)} DD des sorts`
    case 'spell_attack_bonus': return `${formatModifier(effect.value.amount)} attaque des sorts`
    case 'spell_damage_bonus': return `${formatModifier(effect.value.amount)} dégâts des sorts`
    case 'initiative_bonus': return `${formatModifier(effect.value.amount)} initiative`
    case 'hp_per_level': return `${formatModifier(effect.value.amount)} PV/niveau`
    case 'passive_skill_bonus': {
      const skill = effect.value.skill === 'investigation' ? 'Investigation' : 'Perception'
      return `${formatModifier(effect.value.amount)} ${skill} passive`
    }
    case 'walking_speed': return `Vitesse ${effect.value} m`
    case 'speed_bonus': {
      const amount = fixedAmount(effect.value.amount)
      return amount === undefined ? 'Vitesse (selon le niveau)' : `${formatModifier(amount)} m de vitesse`
    }
    case 'swimming_speed': return `Nage ${effect.value} m`
    case 'climbing_speed': return `Escalade ${effect.value} m`
    case 'burrowing_speed': return `Creusement ${effect.value} m`
    case 'unarmored_defense': return `CA sans armure ${effect.value.base} + ${effect.value.abilities.map(ability).join(' + ')}`
    case 'darkvision': return `Vision dans le noir ${effect.value.range} m`
    case 'ability_increase': {
      const max = typeof effect.value.max === 'number' ? ` (max ${effect.value.max})` : ''
      return `+${effect.value.amount} ${ability(effect.value.ability)}${max}`
    }
    case 'ability_score_set': return `${ability(effect.value.ability)} ${effect.value.score}`
    case 'damage_resistance': return `Résistance ${damage(effect.value.damageType)}`
    case 'damage_immunity': return `Immunité ${damage(effect.value.damageType)}`
    case 'vulnerability': return `Vulnérabilité ${damage(effect.value.damageType)}`
    default: return effect.type
  }
}

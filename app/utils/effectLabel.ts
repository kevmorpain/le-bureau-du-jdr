import type { AbilityScoreKey, DamageTypeKey, Effect } from '~~/server/db/schema/effects'
import { damageTypeLabels } from '~~/shared/utils/labels'
import { ABILITY_SHORT } from '~~/app/data/character-builder'
import { formatModifier } from './format'

// Les effets d'objet custom ne sont pas validés côté serveur : une clé inconnue s'affiche telle quelle.
const ability = (key: AbilityScoreKey) => ABILITY_SHORT[key] ?? key
const damage = (key: DamageTypeKey) => damageTypeLabels[key] ?? key

export const effectLabel = (effect: Effect): string => {
  switch (effect.type) {
    case 'armor_class_bonus': return `${formatModifier(effect.value.amount)} CA`
    case 'saving_throw_bonus': {
      const target = effect.value.ability === 'all' ? '(tous)' : ability(effect.value.ability)
      return `${formatModifier(effect.value.amount)} JS ${target}`
    }
    case 'spell_save_dc_bonus': return `${formatModifier(effect.value.amount)} DD des sorts`
    case 'spell_attack_bonus': return `${formatModifier(effect.value.amount)} attaque des sorts`
    case 'initiative_bonus': return `${formatModifier(effect.value.amount)} initiative`
    case 'hp_per_level': return `${formatModifier(effect.value.amount)} PV/niveau`
    case 'passive_skill_bonus': {
      const skill = effect.value.skill === 'investigation' ? 'Investigation' : 'Perception'
      return `${formatModifier(effect.value.amount)} ${skill} passive`
    }
    case 'walking_speed': return `+${effect.value} m de vitesse`
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

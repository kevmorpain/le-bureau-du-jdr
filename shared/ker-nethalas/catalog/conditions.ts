import { knSkillsExcept, type KnEffect } from '../effects'
import { KN_WEAPON_SKILL_KEYS } from '../skills'

export const KN_CONDITION_KEYS = [
  'bleeding',
  'blinded',
  'burning',
  'charmed',
  'concealed',
  'cursed',
  'dazed',
  'freezing',
  'hypothermia',
  'frightened',
  'paralyzed',
  'poisoned',
  'prone',
  'restrained',
  'sickened',
  'sleeping',
  'stunned',
] as const

export type KnConditionKey = (typeof KN_CONDITION_KEYS)[number]

interface KnConditionDef {
  // Condition à valeur (X ou XX dans le livre) : `default` est la valeur proposée à l'ajout.
  value?: { default: number }
  effects: (value: number) => KnEffect[]
}

const none = () => []

// Gravebound p. 88-89. L'hypothermie n'est pas une condition à part : c'est l'aggravation du Freezing après 5 salles (p. 88).
export const KN_CONDITIONS: Record<KnConditionKey, KnConditionDef> = {
  bleeding: { value: { default: 1 }, effects: none },
  blinded: { effects: () => [{ type: 'disadvantage', targets: knSkillsExcept('reason') }] },
  burning: { effects: none },
  charmed: { effects: none },
  concealed: { effects: none },
  cursed: { effects: none },
  dazed: { value: { default: 1 }, effects: none },
  freezing: { effects: () => [{ type: 'modifier', targets: ['allSkills'], amount: -10 }] },
  hypothermia: { effects: () => [{ type: 'modifier', targets: ['allChecks'], amount: -50 }] },
  frightened: { value: { default: 10 }, effects: value => [{ type: 'modifier', targets: ['weaponSkills'], amount: -value }] },
  paralyzed: { effects: none },
  poisoned: { value: { default: 1 }, effects: none },
  prone: { effects: () => [{ type: 'disadvantage', targets: ['weaponSkills'] }] },
  restrained: {
    effects: () => [{
      type: 'modifier',
      targets: ['acrobatics', 'athletics', 'dodge', ...KN_WEAPON_SKILL_KEYS],
      amount: -20,
    }],
  },
  sickened: { value: { default: 10 }, effects: value => [{ type: 'modifier', targets: ['allChecks'], amount: -value }] },
  sleeping: { effects: none },
  stunned: { value: { default: 1 }, effects: none },
}

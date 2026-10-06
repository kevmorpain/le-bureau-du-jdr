import {
  KN_NON_COMBAT_SKILL_KEYS,
  KN_RESISTANCE_KEYS,
  KN_SKILL_KEYS,
  KN_WEAPON_SKILL_KEYS,
  type KnResistanceKey,
  type KnSkillKey,
} from './skills'

export const KN_VITAL_KEYS = ['health', 'toughness', 'aether', 'sanity'] as const

export type KnVitalKey = (typeof KN_VITAL_KEYS)[number]

export const KN_TARGET_GROUPS = ['allSkills', 'allChecks', 'weaponSkills', 'nonCombatSkills'] as const

export type KnTargetGroup = (typeof KN_TARGET_GROUPS)[number]

export type KnCheckKey = KnSkillKey | KnResistanceKey

export type KnTarget = KnCheckKey | KnTargetGroup

export type KnEffect
  = | { type: 'modifier', targets: readonly KnTarget[], amount: number }
    | { type: 'advantage', targets: readonly KnTarget[] }
    | { type: 'disadvantage', targets: readonly KnTarget[] }
    | { type: 'maxVitalDelta', vital: KnVitalKey, amount: number }
    | { type: 'maxVitalHalf', vital: KnVitalKey }

export type KnReminderSeverity = 'info' | 'warning' | 'danger'

// `key` est une clé i18n ; un paramètre texte qui commence par `ker_nethalas.` est lui-même une clé à traduire.
// `text` porte un libellé saisi par le joueur.
export interface KnSourceLabel {
  key?: string
  params?: Record<string, string | number>
  text?: string
}

export interface KnReminder {
  label: KnSourceLabel
  severity: KnReminderSeverity
}

export interface KnActiveSource {
  id: string
  label: KnSourceLabel
  effects: KnEffect[]
  reminders: KnReminder[]
}

export const knSkillsExcept = (...excluded: KnSkillKey[]): KnSkillKey[] =>
  KN_SKILL_KEYS.filter(key => !excluded.includes(key))

const GROUPS: Record<KnTargetGroup, readonly KnCheckKey[]> = {
  allSkills: KN_SKILL_KEYS,
  allChecks: [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS],
  weaponSkills: KN_WEAPON_SKILL_KEYS,
  nonCombatSkills: KN_NON_COMBAT_SKILL_KEYS,
}

export function expandKnTargets(targets: readonly KnTarget[]): Set<KnCheckKey> {
  const expanded = new Set<KnCheckKey>()
  for (const target of targets) {
    if (target in GROUPS) {
      for (const key of GROUPS[target as KnTargetGroup]) expanded.add(key)
    } else {
      expanded.add(target as KnCheckKey)
    }
  }
  return expanded
}

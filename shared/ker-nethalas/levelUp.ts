import { KN_BOUNDS, type KnResistances, type KnSkills } from './character'
import { knRollDice } from './dice'
import type { KnActiveSource, KnReminder } from './effects'
import {
  KN_LEVEL_RESISTANCE_BONUS,
  KN_LEVEL_SKILL_BONUS,
  KN_LEVEL_VITAL_DICE,
  KN_LEVEL_XP,
  knCanLevelUp,
  knLevelChoiceIssues,
  type KnLevelBenefit,
  type KnLevelChoice,
} from './progression'
import type { KnRng } from './run'
import { KN_RESISTANCE_KEYS } from './skills'

export interface KnLevelSheet {
  level: number
  xp: number
  healthMax: number
  healthCurrent: number
  toughnessMax: number
  toughnessCurrent: number
  aetherMax: number
  aetherCurrent: number
  sanityMax: number
  sanityCurrent: number
  resistances: KnResistances
  skills: KnSkills
  levelBenefits: KnLevelBenefit[]
}

export type KnLevelUpResult = { patch: Partial<KnLevelSheet>, summary: string } | { error: 'xp' | 'level' | 'choice' }

const VITAL_LABELS = { health: 'Santé', toughness: 'Robustesse', sanity: 'Santé mentale', aether: 'Éther' } as const

// Monter de niveau : 1 000 XP en moins (l'excédent se garde), un niveau de plus (donc un Point d'Aptitude de plus, il se déduit du
// niveau), et l'avantage choisi. Le niveau 99 est le plafond.
export function knLevelUp(sheet: KnLevelSheet, choice: KnLevelChoice, rng: KnRng = Math.random): KnLevelUpResult {
  if (!knCanLevelUp(sheet.xp)) return { error: 'xp' }
  if (sheet.level >= KN_BOUNDS.level.max) return { error: 'level' }
  if (knLevelChoiceIssues(choice).length) return { error: 'choice' }

  const level = sheet.level + 1
  const patch: Partial<KnLevelSheet> = { level, xp: sheet.xp - KN_LEVEL_XP, levelBenefits: [...sheet.levelBenefits, { ...choice, level }] }
  let summary = ''

  if (choice.benefit === 'health' || choice.benefit === 'toughness' || choice.benefit === 'sanity' || choice.benefit === 'aether') {
    const gained = knRollDice(KN_LEVEL_VITAL_DICE[choice.benefit], rng).total
    patch[`${choice.benefit}Max`] = Math.min(KN_BOUNDS.vital.max, sheet[`${choice.benefit}Max`] + gained)
    patch[`${choice.benefit}Current`] = Math.min(KN_BOUNDS.vital.max, sheet[`${choice.benefit}Current`] + gained)
    summary = `${VITAL_LABELS[choice.benefit]} maximale +${gained}`
  } else if (choice.benefit === 'skill' && choice.skill) {
    const skill = sheet.skills[choice.skill]
    patch.skills = { ...sheet.skills, [choice.skill]: { ...skill, score: Math.min(KN_BOUNDS.skill.max, skill.score + KN_LEVEL_SKILL_BONUS) } }
    summary = `+${KN_LEVEL_SKILL_BONUS} à la compétence`
  } else if (choice.benefit === 'resistances') {
    patch.resistances = Object.fromEntries(
      KN_RESISTANCE_KEYS.map(key => [key, Math.min(KN_BOUNDS.resistance.max, sheet.resistances[key] + KN_LEVEL_RESISTANCE_BONUS)]),
    ) as KnResistances
    summary = `+${KN_LEVEL_RESISTANCE_BONUS} en Endurance, Résolution et Résistance magique`
  } else if (choice.benefit === 'physicalDamage') {
    summary = '+D6 dégâts physiques à la réserve'
  } else {
    summary = '+1 aux dégâts d\'une Aptitude'
  }

  return { patch, summary }
}

// Le +1 aux dégâts d'une Aptitude se joue à la main : la fiche le rappelle, avec le nom de l'Aptitude quand on le connaît.
export function knLevelBenefitSources(benefits: readonly KnLevelBenefit[], abilityName: (key: string) => string | undefined): KnActiveSource[] {
  const reminders = benefits.flatMap<KnReminder>(entry => entry.benefit === 'abilityDamage' && entry.ability
    ? [{ label: { text: `${abilityName(entry.ability) ?? entry.ability} : +1 dégât (niveau ${entry.level})` }, severity: 'info' }]
    : [])
  return reminders.length ? [{ id: 'levelBenefits', label: { text: 'Montées de niveau' }, effects: [], reminders }] : []
}

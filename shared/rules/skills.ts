import { z } from 'zod'
import { ABILITY_KEYS, type AbilityKey } from './abilities'

// Clés snake_case identiques à `skills.id`, `character_skills.skill_key`, l'i18n et les effets.
export const SKILLS = {
  acrobatics: { ability: 'dex' },
  animal_handling: { ability: 'wis' },
  arcana: { ability: 'int' },
  athletics: { ability: 'str' },
  deception: { ability: 'cha' },
  history: { ability: 'int' },
  insight: { ability: 'wis' },
  intimidation: { ability: 'cha' },
  investigation: { ability: 'int' },
  medicine: { ability: 'wis' },
  nature: { ability: 'int' },
  perception: { ability: 'wis' },
  performance: { ability: 'cha' },
  persuasion: { ability: 'cha' },
  religion: { ability: 'int' },
  sleight_of_hand: { ability: 'dex' },
  stealth: { ability: 'dex' },
  survival: { ability: 'wis' },
} as const satisfies Record<string, { ability: AbilityKey }>

export type SkillKey = keyof typeof SKILLS

export const SKILL_KEYS = Object.keys(SKILLS) as [SkillKey, ...SkillKey[]]

export const skillEnum = z.enum(SKILL_KEYS)

export const SKILL_ABILITY = Object.fromEntries(
  SKILL_KEYS.map(key => [key, SKILLS[key].ability]),
) as Record<SkillKey, AbilityKey>

/** Inclut les caractéristiques sans compétence (`con` → `[]`). */
export const ABILITY_SKILLS = Object.fromEntries(
  ABILITY_KEYS.map(ability => [ability, SKILL_KEYS.filter(key => SKILLS[key].ability === ability)]),
) as Record<AbilityKey, SkillKey[]>

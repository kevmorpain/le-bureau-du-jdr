import { z } from 'zod'
import { ABILITY_KEYS, type AbilityKey } from './abilities'

/**
 * Les 18 compétences D&D 5e (2014) — ensemble fermé canonique (cf. decisions.md D6/D7).
 *
 * Chaque compétence porte sa CLÉ MACHINE (snake_case, identique à la DB `skills.id`, à
 * `character_skills.skill_key`, à l'i18n et aux effets) et la caractéristique associée.
 * Le type `SkillKey`, le validateur Zod `skillEnum`, la table `skills` (seedée depuis
 * cette const) et les maps dérivées ci-dessous en découlent — plus aucune liste de
 * compétences recopiée à la main (cf. architecture-audit.md §6 : le bug de casse
 * `sleightOfHand`/`sleight_of_hand`).
 *
 * Les libellés vivent dans l'i18n sous `skills.<caractéristique>.<clé>` (cf. D11) —
 * cette const ne porte QUE la structure.
 */
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

/** Union dérivée des clés machine (snake_case). */
export type SkillKey = keyof typeof SKILLS

/** Toutes les clés, dans l'ordre de déclaration (alphabétique). */
export const SKILL_KEYS = Object.keys(SKILLS) as [SkillKey, ...SkillKey[]]

/** Validateur Zod dérivé. */
export const skillEnum = z.enum(SKILL_KEYS)

/** compétence → caractéristique associée. */
export const SKILL_ABILITY = Object.fromEntries(
  SKILL_KEYS.map(key => [key, SKILLS[key].ability]),
) as Record<SkillKey, AbilityKey>

/**
 * caractéristique → compétences (ordre de déclaration). Inclut les caractéristiques
 * sans compétence (Constitution → `[]`). Remplace le `abilitySkillKeys` recopié dans
 * `useCharacterAbilities` (cf. decisions.md D6).
 */
export const ABILITY_SKILLS = Object.fromEntries(
  ABILITY_KEYS.map(ability => [ability, SKILL_KEYS.filter(key => SKILLS[key].ability === ability)]),
) as Record<AbilityKey, SkillKey[]>

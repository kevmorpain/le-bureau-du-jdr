import { z } from 'zod'

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export type AbilityKey = (typeof ABILITY_KEYS)[number]

export const abilityEnum = z.enum(ABILITY_KEYS)

export type SavingThrowKey = `${AbilityKey}_save`

// Les JS partagent la table des maîtrises de compétences (`character_skills.skill_key`) sous la clé `<carac>_save`.
export const savingThrowKey = (ability: AbilityKey): SavingThrowKey => `${ability}_save`

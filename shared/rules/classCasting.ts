import { abilityEnum, type AbilityKey } from './abilities'
import type { CasterType, SpellcastingType } from './spellcasting'
import { maxSpellLevelForLevel } from './spellSlots'

export interface ClassCasting {
  ability: AbilityKey
  type: CasterType
  startsAtLevel: number
}

/** Premier niveau de classe qui donne un emplacement de sort. */
export function firstCastingLevel(type: CasterType): number {
  for (let level = 1; level <= 20; level++) {
    if (maxSpellLevelForLevel(type, level) > 0) return level
  }
  return 1
}

/** Incantation d'une classe du catalogue ; `null` si elle n'incante pas par elle-même. */
export function classCastingOf(cls: { spellcastingType: SpellcastingType, spellcastingAbility: string | null }): ClassCasting | null {
  const ability = abilityEnum.safeParse(cls.spellcastingAbility)
  if (cls.spellcastingType === 'none' || !ability.success) return null
  return { ability: ability.data, type: cls.spellcastingType, startsAtLevel: firstCastingLevel(cls.spellcastingType) }
}

import type { Effect } from '~~/server/db/schema/effects'
import { savingThrowKey, type AbilityKey } from './abilities'
import type { ProficiencyOverrideRow } from './proficiencyOverrides'

export type ProficiencyLevel = 'none' | 'proficient' | 'expert'

const PRIORITY: Record<ProficiencyLevel, number> = { none: 0, proficient: 1, expert: 2 }

// Compétences et jets de sauvegarde partagent la table des niveaux, ces derniers sous `<carac>_save`.
const levelKeyOf = (o: ProficiencyOverrideRow): string | null => {
  if (o.proficiencyType === 'skill') return o.value
  if (o.proficiencyType === 'saving_throw') return savingThrowKey(o.value as AbilityKey)
  return null
}

// Niveau de chaque compétence et jet de sauvegarde : le plus haut des effets et des ajouts manuels ; un retrait
// manuel l'emporte sur tout.
export function proficiencyLevels(effects: readonly Effect[], overrides: readonly ProficiencyOverrideRow[]): Map<string, ProficiencyLevel> {
  const levels = new Map<string, ProficiencyLevel>()
  const raise = (key: string, level: ProficiencyLevel) => {
    if (PRIORITY[level] > PRIORITY[levels.get(key) ?? 'none']) levels.set(key, level)
  }
  for (const e of effects) {
    if (e.type === 'skill_proficiency') raise(e.value.skill, 'proficient')
    else if (e.type === 'skill_expertise') raise(e.value.skill, 'expert')
    else if (e.type === 'saving_throw_proficiency') raise(savingThrowKey(e.value.ability), 'proficient')
  }
  for (const o of overrides) {
    const key = levelKeyOf(o)
    if (key != null && o.action !== 'revoke') raise(key, o.action === 'expertise' ? 'expert' : 'proficient')
  }
  for (const o of overrides) {
    const key = levelKeyOf(o)
    if (key != null && o.action === 'revoke') levels.delete(key)
  }
  return levels
}

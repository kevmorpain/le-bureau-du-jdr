import type { SpellComponent } from '~~/server/db/schema/spells'
import { spellCostOf, type ActionCost } from '~~/shared/rules/actionCost'
import { matchesSearch } from '~~/shared/utils/search'

export interface SpellFilters {
  search?: string
  cost?: ActionCost | null
  components?: readonly SpellComponent[]
  levels?: readonly number[]
}

type FilterableSpell = Pick<Spell, 'name' | 'castingTime' | 'components' | 'level'>

export const matchesSpellFilters = (spell: FilterableSpell, { search = '', cost = null, components = [], levels = [] }: SpellFilters): boolean => {
  if (!matchesSearch(spell.name, search)) return false
  if (cost && spellCostOf(spell.castingTime) !== cost) return false
  if (!components.every(component => spell.components.includes(component))) return false
  if (levels.length && !levels.includes(spell.level)) return false
  return true
}

import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Effect } from '../../server/db/schema/effects'
import type { SpeciesTraitData } from '../../server/db/seeds/lib/seedLineages'
import { elf } from '../../server/db/seeds/data/elf'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { useCharacterConditions } from '../../app/composables/character/useCharacterConditions'

const feyAncestry = (traits: SpeciesTraitData[]): Effect[] =>
  traits.find(t => t.name === 'Ascendance féerique')?.effects ?? []

async function defenseEntries(effects: Effect[]) {
  let entries: { key: string, label: string, level: string }[] = []
  await mountSuspended(defineComponent({
    setup() {
      entries = useCharacterConditions(undefined, {
        allEffects: computed(() => effects),
        speed: computed(() => 9),
        abilityModifiers: computed(() => ({})),
      }).defenseEntries.value
      return () => h('div')
    },
  }))
  return [...entries].sort((a, b) => a.key.localeCompare(b.key))
}

describe('Ascendance féerique — défenses de la fiche', () => {
  it.each([
    ['Elfe (lignée)', elf.baseTraits],
    ['Demi-elfe', characterSpecies.find(s => s.name === 'Demi-elfe')!.traits],
  ])('%s : immunité au sommeil magique et avantage contre le charme', async (_, traits) => {
    expect(await defenseEntries(feyAncestry(traits))).toEqual([
      { key: 'imm:sleep_magic', label: 'Sommeil magique', level: 'immunity' },
      { key: 'jds:charmed', label: 'Charmé (JdS)', level: 'resistance' },
    ])
  })
})

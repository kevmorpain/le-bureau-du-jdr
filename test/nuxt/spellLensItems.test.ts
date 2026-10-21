import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useSpellLens } from '../../app/composables/useSpellLens'

// O7b (3) : la lentille de sorts lit la fiche comme la fiche elle-même, objets et effets temporaires compris
// (un Bandeau d'intelligence fixe l'Intelligence, donc le modificateur d'incantation d'un magicien).

const bandeau = (attuned: boolean) => ({
  inventory: { equipped: true, attuned },
  item: { name: 'Bandeau d\'intelligence', requiresAttunement: true, effects: [{ type: 'ability_score_set', value: { ability: 'int', score: 19 } }] },
})

const sheet = (id: number, over: Record<string, unknown> = {}) => ({
  id,
  baseAbilityScores: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(abilityId => ({ abilityId, value: 10 })),
  classes: [{ classId: 1, level: 5, isMain: true, class: { id: 1, name: 'Magicien', spellcastingAbility: 'int' }, subclass: null }],
  features: [],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  species: { name: 'Espèce', speed: 9, speciesFeatures: [] },
  temporaryEffects: [],
  spellSlots: [],
  inventory: [],
  ...over,
})

const loaded = async (id: number, over: Record<string, unknown>) => {
  registerEndpoint(`/api/character_sheets/${id}`, () => sheet(id, over))
  let lens!: ReturnType<typeof useSpellLens>
  await mountSuspended(defineComponent({
    setup() {
      lens = useSpellLens()
      return () => h('div')
    },
  }))
  await lens.loadSheet(id)
  return lens
}

describe('lentille de sorts — objets et effets temporaires', () => {
  it('un objet équipé et lié compte : Intelligence 19, modificateur +4', async () => {
    const lens = await loaded(9601, { inventory: [bandeau(true)] })
    expect(lens.stats.value.abilityScores.int).toBe(19)
    expect(lens.spellcastingModifier.value).toBe(4)
  })

  it('un objet qui exige un lien ne compte pas tant qu\'il n\'est pas lié', async () => {
    const lens = await loaded(9602, { inventory: [bandeau(false)] })
    expect(lens.stats.value.abilityScores.int).toBe(10)
  })

  it('un effet temporaire actif compte, éteint il ne compte pas', async () => {
    const potion = { id: 1, name: 'Potion', active: true, effects: [{ type: 'ability_increase', value: { ability: 'int', amount: 2 } }] }
    const active = await loaded(9603, { temporaryEffects: [potion] })
    expect(active.stats.value.abilityScores.int).toBe(12)
    const off = await loaded(9604, { temporaryEffects: [{ ...potion, active: false }] })
    expect(off.stats.value.abilityScores.int).toBe(10)
  })
})

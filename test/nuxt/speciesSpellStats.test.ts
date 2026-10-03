import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { abilityScores, classSheet } from '../fixtures/classSheet'

// Un sort octroyé par l'espèce n'a pas de classe : DD et bonus d'attaque se calculent avec la caractéristique que
// l'espèce déclare (Fadette : au choix du joueur), pas avec celle de la classe active.

const SHEET_ID = 9700

const grant = (spellcastingAbility: string) => ({
  effect: { type: 'spell_grant', value: { level: 0, spellcastingAbility, spellName: 'Druidisme', countPerLongRest: 0 } },
})

async function mountSheet(speciesAbility: string | null) {
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
  registerEndpoint('/api/backgrounds', () => [])
  const sheet = classSheet(SHEET_ID, 'Magicien', 3, 1, [], {
    baseAbilityScores: abilityScores({ int: 10, wis: 16, cha: 14 }),
    classes: [{ classId: 3, level: 1, isMain: true, class: { name: 'Magicien', spellcastingAbility: 'int' }, subclass: null }],
    species: speciesAbility
      ? { speciesFeatures: [{ feature: { featureType: 'species_trait', featureEffects: [grant(speciesAbility)] } }] }
      : { speciesFeatures: [] },
  })
  let s!: ReturnType<typeof useCharacterSheet>
  await mountSuspended(defineComponent({
    setup() {
      s = useCharacterSheet(toRef(() => sheet) as never)
      return () => h('div')
    },
  }))
  return s
}

describe('statsForSpell — sorts d\'espèce', () => {
  it('Magicien Fadette (Sagesse) : le sort d\'espèce utilise la Sagesse, les sorts de classe l\'Intelligence', async () => {
    const s = await mountSheet('wis')
    expect(s.statsForSpell({ classId: null, source: 'species' })).toMatchObject({ ability: 'wis', modifier: 3, dc: 13, attackBonus: 5 })
    expect(s.statsForSpell({ classId: 3, source: null })).toMatchObject({ ability: 'int', modifier: 0 })
  })

  it('espèce sans sort octroyé : repli sur la classe active, comme avant', async () => {
    const s = await mountSheet(null)
    expect(s.statsForSpell({ classId: null, source: 'species' })).toMatchObject({ ability: 'int' })
  })

  it('un sort d\'une autre source ne prend pas la caractéristique de l\'espèce', async () => {
    const s = await mountSheet('wis')
    expect(s.statsForSpell({ classId: null, source: 'feat' })).toMatchObject({ ability: 'int' })
  })
})

import { describe, it, expect } from 'vitest'
import { defineComponent, h, toRef } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { boonsData } from '../../server/db/seeds/data/boons'
import { abilityScores, classSheet } from '../fixtures/classSheet'

// Faveurs permanentes sur la fiche : leurs effets comptent, et elles se distinguent des dons.

const SHEET_ID = 9701
const vitality = boonsData.find(b => b.name === 'Manuel de vitalité')!

const boonRow = {
  featureId: 500,
  currentUses: 0,
  active: false,
  feature: {
    id: 500, name: vitality.name, description: vitality.description, featureType: 'boon', classId: null, subclassId: null, levelRequired: null,
    actionType: null, rechargeType: null, maxUsesFormula: null, meta: null,
    featureEffects: vitality.effects.map(effect => ({ effect })),
  },
}

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/backgrounds`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])

describe('fiche — une faveur permanente', () => {
  it('ses effets comptent (Constitution 20 → 22) et elle est étiquetée « Faveur », pas « Don »', async () => {
    const sheet = classSheet(SHEET_ID, 'Guerrier', 1, 5, [boonRow as never], { baseAbilityScores: abilityScores({ con: 20 }) })
    let layers!: ReturnType<typeof useCharacterSheet>
    await mountSuspended(defineComponent({
      props: { characterSheet: { type: Object, required: true } },
      setup(props) {
        layers = useCharacterSheet(toRef(props, 'characterSheet') as never)
        return () => h('div')
      },
    }), { props: { characterSheet: sheet } })

    expect(layers.abilityScores.value.con).toMatchObject({ maximum: 22, total: 22 })
    expect(layers.allCharacterFeatures.value.find(f => f.name === vitality.name)?.origin.label).toBe('Faveur')
  })
})

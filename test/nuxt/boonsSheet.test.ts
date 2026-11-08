import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, toRef } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import AddFeatSlideover from '../../app/components/character_sheet/AddFeatSlideover.vue'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { boonsData } from '../../server/db/seeds/data/boons'
import { abilityScores, classSheet } from '../fixtures/classSheet'

// Faveurs permanentes sur la fiche : leurs effets comptent, elles se distinguent des dons, et « Ajouter une faveur » les propose seules.

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

describe('« Ajouter une faveur »', () => {
  it('propose les faveurs et les ajoute comme un don attribué', async () => {
    registerEndpoint('/api/catalog/boons', () => boonsData.map((b, i) => ({ id: 500 + i, name: b.name, description: b.description, effects: b.effects })))
    const posted = vi.fn()
    registerEndpoint(`/api/character_sheets/${SHEET_ID}/feats`, {
      method: 'POST',
      handler: async (event) => {
        posted(await readBody(event))
        return { ok: true }
      },
    })

    await mountSuspended(AddFeatSlideover, { props: { open: true, kind: 'boon', characterSheetId: SHEET_ID, ownedFeatureIds: [] } })
    await vi.waitFor(() => expect(document.body.textContent).toContain('Manuel de vitalité'))
    expect(document.body.textContent).toContain('Ajouter une faveur')

    const click = (text: string) => (Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes(text)) as HTMLButtonElement).click()
    click('Manuel de vitalité')
    await flushPromises()
    click('Ajouter la faveur')
    await vi.waitFor(() => expect(posted).toHaveBeenCalledWith({ featureId: 500, source: 'bonus', choices: null }))
  })
})

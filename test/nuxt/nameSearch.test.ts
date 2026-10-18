import { describe, it, expect, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import InventorySection from '../../app/components/character_sheet/InventorySection.vue'
import MagicSection from '../../app/components/character_sheet/MagicSection.vue'
import { spells } from '../../server/db/seeds/data/spells'
import { abilityScores, classSheet } from '../fixtures/classSheet'

// U8 : la recherche par nom, sans casse ni accents, dans l'inventaire et dans la liste de sorts de la fiche.

const weapon = (id: number, name: string) => ({
  id,
  characterSheetId: 9401,
  itemId: id,
  quantity: 1,
  equipped: false,
  attuned: false,
  isPactWeapon: false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  item: {
    id, name, itemType: 'weapon', description: null, effects: [], maxUses: null, rechargeType: null, rechargeDice: null,
    properties: { weapon_category: 'martial_melee', weapon_properties: [], damage_dice: '1d8', damage_type: 'slashing' },
    isCustom: false, rarity: null, requiresAttunement: false, attunementNote: null,
  },
})
const rope = { ...weapon(3, 'Corde de chanvre'), item: { ...weapon(3, 'Corde de chanvre').item, itemType: 'equipment', properties: { category: 'adventuring_gear' } } }

registerEndpoint('/api/character_sheets/9401/inventory', () => [weapon(1, 'Épée longue'), weapon(2, 'Dague'), rope])
registerEndpoint('/api/character_sheets/9401/proficiency-overrides', () => [])
registerEndpoint('/api/character_sheets/9401/spells', () => [])
registerEndpoint('/api/backgrounds', () => [])
registerEndpoint('/api/items', () => [])

const inventorySheet = () => reactive({
  id: 9401, name: 'Brom', exhaustionLevel: 0, baseAbilityScores: [], classes: [], features: [], skills: [],
  abilityScoreImprovements: [], species: null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any) as any

describe('inventaire — recherche par nom', () => {
  it('filtre les onglets sans tenir compte de la casse ni des accents, et le dit quand rien ne correspond', async () => {
    // UTooltip exige un UApp parent : sans objet ici, on le remplace par son contenu.
    const wrapper = await mountSuspended(InventorySection, {
      props: { characterSheet: inventorySheet() },
      global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Armes (2)'))
    expect(wrapper.text()).toContain('Épée longue')
    expect(wrapper.text()).toContain('Dague')

    const search = wrapper.find('input[placeholder="Rechercher un objet"]')
    await search.setValue('EPEE')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Armes (1)'))
    expect(wrapper.text()).toContain('Épée longue')
    expect(wrapper.text()).not.toContain('Dague')

    await search.setValue('corde')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Équipement (1)'))
    expect(wrapper.text()).toContain('Aucun objet ne correspond à la recherche')

    await search.setValue('')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Armes (2)'))
    expect(wrapper.text()).toContain('Dague')
  })
})

const seedSpell = (name: string, id: number) => ({ ...spells.find(s => s.name === name)!, id, school: { name: 'evocation' } })
const characterSpell = (name: string, id: number, classId: number) => ({
  characterSheetId: 1, spellId: id, classId, isKnown: true, isPrepared: true, alwaysPrepared: false, source: null, spell: seedSpell(name, id),
})

const slots = ref({ spellcasting: { 1: { max: 2, current: 2 }, 3: { max: 2, current: 2 } }, pact_magic: {} })

const mountSpells = async (sheetId: number) => {
  registerEndpoint(`/api/character_sheets/${sheetId}/spells`, () => [
    characterSpell('Boule de feu', 501, 1),
    characterSpell('Détection de la magie', 502, 1),
    characterSpell('Rayon de givre', 503, 1),
  ])
  registerEndpoint(`/api/character_sheets/${sheetId}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${sheetId}/proficiency-overrides`, () => [])
  const sheet = classSheet(sheetId, 'Magicien', 1, 5, [], {
    baseAbilityScores: abilityScores({ int: 16 }),
    classes: [{ classId: 1, level: 5, isMain: true, class: { name: 'Magicien', spellcastingAbility: 'int' }, subclass: null }],
  })
  const wrapper = await mountSuspended(MagicSection, { props: { characterSheet: sheet }, global: { provide: { spellSlots: slots }, stubs: { UTooltip: { template: '<div><slot /></div>' } } } })
  await flushPromises()
  return wrapper
}

const spellNames = (wrapper: Awaited<ReturnType<typeof mountSpells>>) =>
  wrapper.findAll('span.font-medium').map(s => s.text()).filter(t => ['Boule de feu', 'Détection de la magie', 'Rayon de givre'].includes(t))

describe('liste de sorts — recherche par nom', () => {
  it('ne garde que les sorts dont le nom correspond, accents et casse ignorés', async () => {
    const wrapper = await mountSpells(9402)
    expect(spellNames(wrapper)).toHaveLength(3)

    const search = wrapper.find('input[placeholder="Rechercher un sort"]')
    await search.setValue('DETECTION')
    await flushPromises()
    expect(spellNames(wrapper)).toEqual(['Détection de la magie'])

    await search.setValue('givre')
    await flushPromises()
    expect(spellNames(wrapper)).toEqual(['Rayon de givre'])

    await search.setValue('')
    await flushPromises()
    expect(spellNames(wrapper)).toHaveLength(3)
  })
})

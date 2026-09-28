import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepClass from '../../app/components/level_up/LevelUpStepClass.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'

// AideDD (multiclassage) : il faut les valeurs requises par la classe ACTUELLE et par la nouvelle. Les
// prérequis viennent du catalogue (colonne `multiclass_prerequisites`) et restent non bloquants.

const PALADIN = 7
const FIGHTER = 5
const WIZARD = 12

const catalogClass = (id: number, name: string) => ({
  id, name, subclassLevel: 3, multiclassSkillCount: 0, subclasses: [],
  multiclassPrerequisites: CLASS_IDENTITY.find(c => c.dbName === name)!.multiclassPrerequisites,
})

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', () => [
    catalogClass(PALADIN, 'Paladin'),
    catalogClass(FIGHTER, 'Guerrier'),
    catalogClass(WIZARD, 'Magicien'),
  ])
  registerEndpoint('/api/catalog/progressions', () => ({ progressions: [] }))
  registerEndpoint('/api/character_sheets/1/proficiency-overrides', () => [])
})

// Paladin 3 (FOR 15) : `cha` décide si SES prérequis (FOR 13 et CHA 13) sont remplis.
async function mountClassStep(cha: number) {
  const charSheet = ref({
    id: 1,
    classes: [{ classId: PALADIN, level: 3, isMain: true, class: { name: 'Paladin' } }],
    baseAbilityScores: [
      { abilityId: 'str', value: 15 },
      { abilityId: 'dex', value: 10 },
      { abilityId: 'int', value: 8 },
      { abilityId: 'cha', value: cha },
    ],
    skills: [],
    spells: [],
  })
  let levelUp!: ReturnType<typeof useLevelUp>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
      levelUp.resetWizard()
      return () => h(LevelUpStepClass)
    },
  })
  const wrapper = await mountSuspended(Host)
  for (let i = 0; i < 50 && levelUp.multiclassPrerequisitesOf('fighter').length === 0; i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  const card = (name: string) => wrapper.findAll('button').find(b => b.text().includes(name))!
  return { levelUp, card, text: () => wrapper.text(), compactText: () => wrapper.text().replace(/\s+/g, '') }
}

const CURRENT_CLASSES_WARNING = 'Vos classes actuelles ne remplissent pas leurs propres prérequis'

describe('Étape Classe du level-up — prérequis de multiclassage', () => {
  it('rappelle les prérequis de la classe actuelle', async () => {
    const { compactText } = await mountClassStep(12)
    expect(compactText()).toContain('Paladin:FOR≥13(15)CHA≥13(12)')
  })

  it('classe actuelle insuffisante : un seul bandeau, les cartes ne jugent que la classe visée', async () => {
    const { levelUp, card, text } = await mountClassStep(12)
    expect(levelUp.meetsCurrentClassesPrerequisites.value).toBe(false)
    expect(text().split(CURRENT_CLASSES_WARNING)).toHaveLength(2)
    expect(levelUp.meetsTargetPrerequisites('fighter')).toBe(true)
    expect(card('Guerrier').text()).toContain('FOR ≥13 (15)')
    expect(card('Guerrier').text()).not.toContain('Prérequis non remplis')
    expect(card('Magicien').text()).toContain('Prérequis non remplis')
  })

  it('classe actuelle remplie : pas de bandeau, seule la classe visée décide', async () => {
    const { levelUp, card, text } = await mountClassStep(13)
    expect(levelUp.meetsCurrentClassesPrerequisites.value).toBe(true)
    expect(text()).not.toContain(CURRENT_CLASSES_WARNING)
    expect(card('Guerrier').text()).not.toContain('Prérequis non remplis')
    expect(levelUp.meetsTargetPrerequisites('wizard')).toBe(false)
    expect(card('Magicien').text()).toContain('INT ≥13 (8)')
    expect(card('Magicien').text()).toContain('Prérequis non remplis')
  })

  it('non bloquant : une classe aux prérequis non remplis reste sélectionnable', async () => {
    const { levelUp, card } = await mountClassStep(12)
    await card('Magicien').trigger('click')
    expect(levelUp.state.value.pickedClassId).toBe('wizard')
    expect(levelUp.state.value.isMulticlass).toBe(true)
  })
})

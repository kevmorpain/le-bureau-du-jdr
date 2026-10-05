import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Component, type Ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepClass from '../../app/components/level_up/LevelUpStepClass.vue'
import LevelUpStepSkills from '../../app/components/level_up/LevelUpStepSkills.vue'
import LevelUpSummary from '../../app/components/level_up/LevelUpSummary.vue'
import { useLevelUp, type CharacterSheetWithASI, type LevelUpState } from '../../app/composables/useLevelUp'
import { catalogClasses } from '../fixtures/catalogClasses'

// Rejoindre une classe par multiclassage : il faut les valeurs requises par la classe ACTUELLE et par
// la nouvelle (non bloquant), et la classe rejointe n'accorde que son sous-ensemble de maîtrises. Prérequis et
// maîtrises viennent du catalogue (`multiclass_prerequisites`, porteurs `multiclass_proficiency_grant`).

const PALADIN = 7

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', catalogClasses)
  registerEndpoint('/api/catalog/progressions', () => ({ progressions: [] }))
  registerEndpoint('/api/character_sheets/1/proficiency-overrides', () => [])
  registerEndpoint('/api/feats', () => [])
  registerEndpoint('/api/invocations', () => [])
  registerEndpoint('/api/character_sheets/1/level-up-replacements', () => ({
    choices: [{
      progressionId: 42,
      ownerLevelRequired: 1,
      kind: 'tool',
      classLevel: 1,
      count: 1,
      made: 0,
      remaining: 1,
      replaceable: false,
      global: true,
      optionSource: { type: 'tools' },
      options: [{ value: 'Kit de déguisement' }, { value: 'Outils de voleur' }],
    }],
    duplicated: { skills: [], tools: ['Outils de voleur'] },
  }))
})

// Paladin 3 (FOR 15) : `cha` décide si SES prérequis (FOR 13 et CHA 13) sont remplis.
async function mount(component: Component, cha: number, state: Partial<LevelUpState> = {}) {
  const charSheet = ref({
    id: 1,
    hpBase: 28,
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
      Object.assign(levelUp.state.value, state)
      return () => h(component)
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
    const { compactText } = await mount(LevelUpStepClass, 12)
    expect(compactText()).toContain('Paladin:FOR≥13(15)CHA≥13(12)')
  })

  it('classe actuelle insuffisante : un seul bandeau, les cartes ne jugent que la classe visée', async () => {
    const { levelUp, card, text } = await mount(LevelUpStepClass, 12)
    expect(levelUp.meetsCurrentClassesPrerequisites.value).toBe(false)
    expect(text().split(CURRENT_CLASSES_WARNING)).toHaveLength(2)
    expect(levelUp.meetsTargetPrerequisites('fighter')).toBe(true)
    expect(card('Guerrier').text()).toContain('FOR ≥13 (15)')
    expect(card('Guerrier').text()).not.toContain('Prérequis non remplis')
    expect(card('Magicien').text()).toContain('Prérequis non remplis')
  })

  it('classe actuelle remplie : pas de bandeau, seule la classe visée décide', async () => {
    const { levelUp, card, text } = await mount(LevelUpStepClass, 13)
    expect(levelUp.meetsCurrentClassesPrerequisites.value).toBe(true)
    expect(text()).not.toContain(CURRENT_CLASSES_WARNING)
    expect(card('Guerrier').text()).not.toContain('Prérequis non remplis')
    expect(levelUp.meetsTargetPrerequisites('wizard')).toBe(false)
    expect(card('Magicien').text()).toContain('INT ≥13 (8)')
    expect(card('Magicien').text()).toContain('Prérequis non remplis')
  })

  it('non bloquant : une classe aux prérequis non remplis reste sélectionnable', async () => {
    const { levelUp, card } = await mount(LevelUpStepClass, 12)
    await card('Magicien').trigger('click')
    expect(levelUp.state.value.pickedClassId).toBe('wizard')
    expect(levelUp.state.value.isMulticlass).toBe(true)
  })
})

describe('Étape Classe du level-up — maîtrises reçues en rejoignant la classe', () => {
  it('chaque carte liste le sous-ensemble du multiclassage, sans armure lourde', async () => {
    const { card } = await mount(LevelUpStepClass, 13)
    expect(card('Guerrier').text()).toContain('Maîtrises : Armure légère, Armure intermédiaire, Bouclier, Toutes les armes simples, Toutes les armes de guerre')
    expect(card('Roublard').text()).toContain('Maîtrises : Armure légère, Outils de voleur, 1 compétence')
    expect(card('Magicien').text()).toContain('Maîtrises : aucune')
  })
})

describe('Récapitulatif du level-up — classe rejointe', () => {
  it('liste les maîtrises de multiclassage et nomme la compétence choisie', async () => {
    const { compactText } = await mount(LevelUpSummary, 13, {
      pickedClassId: 'rogue',
      isMulticlass: true,
      fromLevel: 0,
      toLevel: 1,
      newSkills: ['stealth'],
    })
    expect(compactText()).toContain('Maîtrisesdemulticlassage' + 'Armurelégère,Outilsdevoleur')
    expect(compactText()).toContain('1compétence(s)multiclasse' + 'Discrétion')
  })
})

describe('Étape Maîtrises du level-up — maîtrise doublée par la classe rejointe', () => {
  const joinRogue = { pickedClassId: 'rogue', isMulticlass: true, fromLevel: 0, toLevel: 1 }

  async function mountJoiningRogue(component: Component) {
    const mounted = await mount(component, 13, joinRogue)
    for (let i = 0; i < 50 && mounted.levelUp.replacementChoices.value.length === 0; i++) {
      await flushPromises()
      await new Promise(r => setTimeout(r, 10))
    }
    return mounted
  }

  it('nomme la maîtrise doublée et propose un outil de remplacement, facultatif', async () => {
    const { levelUp, text } = await mountJoiningRogue(LevelUpStepSkills)
    expect(text()).toContain('Maîtrise en double')
    expect(text()).toContain('Outils de voleur')
    expect(text()).toContain('Outil de remplacement')
    expect(levelUp.isStepComplete.value('skills')).toBe(true)
  })

  it('l\'étape Maîtrises existe même sans autre choix, et le récapitulatif nomme le remplacement', async () => {
    const { levelUp, compactText } = await mountJoiningRogue(LevelUpSummary)
    expect(levelUp.activeSteps.value.map(s => s.id)).toContain('skills')
    levelUp.state.value.choicePicks[42] = ['Kit de déguisement']
    await flushPromises()
    expect(compactText()).toContain('Maîtrisesderemplacement' + 'Kitdedéguisement')
  })
})

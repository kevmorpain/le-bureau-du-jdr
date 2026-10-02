import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { defineComponent, h, provide, ref, toRaw, type Component, type Ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#app'
import LevelUpPage from '../../app/pages/characters/[id]/level-up.vue'
import LevelUpStepClass from '../../app/components/level_up/LevelUpStepClass.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'

const SHEET = {
  id: 1,
  name: 'Brom',
  hpBase: 28,
  classes: [{ classId: 5, level: 3, isMain: true, class: { name: 'Guerrier' } }],
  baseAbilityScores: [{ abilityId: 'str', value: 16 }, { abilityId: 'con', value: 14 }, { abilityId: 'cha', value: 14 }],
  skills: [],
  spells: [],
}

beforeAll(() => {
  registerEndpoint('/api/character_sheets/1', () => SHEET)
})

const mounted: { unmount: () => void }[] = []

async function mountLevelUp(child?: Component) {
  let levelUp!: ReturnType<typeof useLevelUp>
  const charSheet = ref(SHEET) as unknown as Ref<CharacterSheetWithASI | null>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet)
      return () => (child ? h(child) : h('div'))
    },
  })
  const wrapper = await mountSuspended(Host)
  mounted.push(wrapper)
  const clickButton = (label: string) => wrapper.findAll('button').find(b => b.text().includes(label))!.trigger('click')
  return { levelUp, clickButton }
}

function freshPageLoad() {
  mounted.splice(0).forEach(w => w.unmount())
  clearNuxtState(['level-up-state', 'level-up-step'], { reset: false })
}

beforeEach(freshPageLoad)

describe('Level-up — remise à zéro de l\'assistant', () => {
  it('resetWizard repart d\'un état vierge, même après des modifications en place', async () => {
    const { levelUp } = await mountLevelUp()
    levelUp.resetWizard()
    const s = levelUp.state.value
    s.newSkills.push('athletics')
    s.expertiseSkills.push('stealth')
    s.newCantripIds.push(1)
    s.newSpellIds.push(4)
    s.pactBoonCantripIds.push(2)
    s.bookOfAncientSecretsSpellIds.push(7)
    s.asiBonuses.str = 2

    levelUp.resetWizard()

    expect(levelUp.state.value).toMatchObject({
      newSkills: [],
      expertiseSkills: [],
      newCantripIds: [],
      newSpellIds: [],
      pactBoonCantripIds: [],
      bookOfAncientSecretsSpellIds: [],
      asiBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    })

    freshPageLoad()
    const { levelUp: reloaded } = await mountLevelUp()
    expect(reloaded.state.value.newSkills).toEqual([])
    expect(reloaded.state.value.asiBonuses.str).toBe(0)
  })

  it('ouvrir la page repart d\'un assistant vierge, sans les choix d\'un level-up abandonné', async () => {
    const { levelUp } = await mountLevelUp()
    levelUp.resetWizard()
    const blank = structuredClone(toRaw(levelUp.state.value))
    Object.assign(levelUp.state.value, { pickedClassId: 'rogue', fromLevel: 4, toLevel: 5, newSkills: ['athletics'], featureId: 12 })
    levelUp.currentStepId.value = 'skills'
    mounted.splice(0).forEach(w => w.unmount())

    mounted.push(await mountSuspended(LevelUpPage, { route: '/characters/1/level-up' }))

    expect(levelUp.state.value).toEqual(blank)
    expect(levelUp.currentStepId.value).toBe('class')
  })
})

describe('Level-up — changement de classe', () => {
  it('repart d\'un état vierge : aucun choix de la classe précédente ne subsiste', async () => {
    const { levelUp, clickButton } = await mountLevelUp(LevelUpStepClass)
    levelUp.resetWizard()
    const blank = structuredClone(toRaw(levelUp.state.value))

    await clickButton('Guerrier')
    Object.assign(levelUp.state.value, {
      asiChoice: 'feat',
      featureId: 12,
      featAbility: 'str',
      featSkills: ['athletics'],
      newSkills: ['perception'],
      pactBoon: 'tome',
      pactBoonCantripIds: [1],
      newInvocationIds: [3],
      hpMethod: 'roll',
      hpRolled: 9,
    })

    await clickButton('Paladin')

    expect(levelUp.state.value).toEqual({ ...blank, pickedClassId: 'paladin', isMulticlass: true, fromLevel: 0, toLevel: 1 })
  })

  it('re-sélectionner la classe déjà choisie conserve les choix', async () => {
    const { levelUp, clickButton } = await mountLevelUp(LevelUpStepClass)
    levelUp.resetWizard()
    await clickButton('Guerrier')
    Object.assign(levelUp.state.value, { asiChoice: 'feat', featureId: 12, newSkills: ['perception'] })

    await clickButton('Guerrier')

    expect(levelUp.state.value).toMatchObject({ pickedClassId: 'fighter', fromLevel: 3, asiChoice: 'feat', featureId: 12, newSkills: ['perception'] })
  })

  it('l\'étape PV reste complète en passant à une classe de même dé de vie', async () => {
    const { levelUp, clickButton } = await mountLevelUp(LevelUpStepClass)
    levelUp.resetWizard()
    await clickButton('Guerrier')
    expect(levelUp.stepSummaries.value.hp).toBe('+8 PV')

    await clickButton('Paladin')

    expect(levelUp.isStepComplete.value('hp')).toBe(true)
    expect(levelUp.stepSummaries.value.hp).toBe('+8 PV')
  })
})

describe('Level-up — points de vie gagnés', () => {
  it('« Jet de dé » sans avoir lancé : étape incomplète, pas de reliquat de la moyenne', async () => {
    const { levelUp, clickButton } = await mountLevelUp(LevelUpStepClass)
    levelUp.resetWizard()
    await clickButton('Guerrier')
    expect(levelUp.isStepComplete.value('hp')).toBe(true)

    levelUp.state.value.hpMethod = 'roll'
    expect(levelUp.isStepComplete.value('hp')).toBe(false)
    expect(levelUp.stepSummaries.value.hp).toBeNull()

    levelUp.state.value.hpRolled = 7
    expect(levelUp.isStepComplete.value('hp')).toBe(true)
    expect(levelUp.stepSummaries.value.hp).toBe('+9 PV')
  })
})

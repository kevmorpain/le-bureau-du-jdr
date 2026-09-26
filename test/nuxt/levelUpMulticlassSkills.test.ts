import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepSkills from '../../app/components/level_up/LevelUpStepSkills.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'
import { SKILL_KEYS, type SkillKey } from '../../shared/rules/skills'
import type { Catalog, CatalogProgression } from '../../shared/rules/resolve'

// Le nombre (colonne `multiclass_skill_count`) et la liste (progression `skill` de la classe) viennent
// du catalogue, comme côté serveur : plus de table front recopiée.

const FIGHTER = 2
const ROGUE = 4
const BARD = 6
const ROGUE_LIST: SkillKey[] = ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth']

const classSkillChoice = (progressionId: number, ownerClassId: number, count: number, from: SkillKey[]): CatalogProgression => ({
  progressionId, ownerClassId, ownerLevelRequired: 1, kind: 'skill',
  count: { op: 'fixed', value: count }, optionSource: { type: 'skills', from }, replaceable: false,
  options: from.map(value => ({ value })),
})

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', () => [
    { id: FIGHTER, name: 'Guerrier', subclassLevel: 3, multiclassSkillCount: 0, subclasses: [] },
    { id: ROGUE, name: 'Roublard', subclassLevel: 3, multiclassSkillCount: 1, subclasses: [] },
    { id: BARD, name: 'Barde', subclassLevel: 3, multiclassSkillCount: 1, subclasses: [] },
  ])
  registerEndpoint('/api/catalog/progressions', (): Catalog => ({
    progressions: [
      classSkillChoice(1, FIGHTER, 2, ['acrobatics', 'athletics']),
      classSkillChoice(2, ROGUE, 4, ROGUE_LIST),
      classSkillChoice(3, BARD, 3, [...SKILL_KEYS]),
    ],
  }))
  registerEndpoint('/api/character_sheets/1/proficiency-overrides', () => [])
})

// Guerrier 3 dont Athlétisme vient du CHOIX de classe (dérivé, plus stocké en character_skills).
const sheet = (derivedSkills: SkillKey[]) => ({
  id: 1,
  classes: [{ classId: FIGHTER, level: 3, isMain: true, class: { name: 'Guerrier' } }],
  baseAbilityScores: [],
  skills: [],
  spells: [],
  classSkillEffects: derivedSkills.map(skill => ({ type: 'skill_proficiency', value: { skill } })),
})

async function mountSkillsStep(pickedClassId: string, derivedSkills: SkillKey[] = ['athletics']) {
  const charSheet = ref(sheet(derivedSkills))
  let levelUp!: ReturnType<typeof useLevelUp>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
      levelUp.resetWizard()
      Object.assign(levelUp.state.value, { pickedClassId, isMulticlass: true, fromLevel: 0, toLevel: 1, newSkills: [] })
      return () => h(LevelUpStepSkills)
    },
  })
  const wrapper = await mountSuspended(Host)
  for (let i = 0; i < 50 && levelUp.multiclassSkills.value.options.length === 0; i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  const button = (label: string) => wrapper.findAll('button').find(b => b.text().startsWith(label))
  return { levelUp, button, text: () => wrapper.text().replace(/\s+/g, ' ') }
}

describe('Étape Compétences du level-up — multiclassage', () => {
  it('Guerrier → Roublard : 1 compétence dans la liste du Roublard, exigée', async () => {
    const { levelUp, button, text } = await mountSkillsStep('rogue')

    expect(levelUp.needsMulticlassSkills.value).toBe(true)
    expect(levelUp.multiclassSkills.value).toEqual({ count: 1, options: ROGUE_LIST })
    expect(text()).toContain('1 compétence au choix parmi la liste ci-dessous')
    expect(button('Acrobaties')).toBeDefined()
    expect(button('Arcanes')).toBeUndefined()

    expect(levelUp.isStepComplete.value('skills')).toBe(false)
    levelUp.state.value.newSkills = ['acrobatics']
    expect(levelUp.isStepComplete.value('skills')).toBe(true)
  })

  it('une compétence maîtrisée par un choix de classe DÉRIVÉ est grisée', async () => {
    const { button } = await mountSkillsStep('rogue', ['athletics'])

    expect(button('Athlétisme')!.attributes('disabled')).toBeDefined()
    expect(button('Athlétisme')!.text()).toContain('(déjà maîtrisé)')
    expect(button('Acrobaties')!.attributes('disabled')).toBeUndefined()
  })

  it('Guerrier → Barde : n\'importe quelle compétence', async () => {
    const { levelUp, text } = await mountSkillsStep('bard')

    expect(levelUp.multiclassSkills.value.options).toHaveLength(SKILL_KEYS.length)
    expect(text()).toContain('1 compétence au choix.')
  })

  it('liste du Roublard déjà entièrement maîtrisée : l\'étape ne bloque pas', async () => {
    const { levelUp } = await mountSkillsStep('rogue', ROGUE_LIST)

    expect(levelUp.requiredMulticlassSkillPicks.value).toBe(0)
    expect(levelUp.isStepComplete.value('skills')).toBe(true)
  })
})

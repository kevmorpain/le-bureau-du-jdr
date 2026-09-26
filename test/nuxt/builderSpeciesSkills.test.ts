import { describe, it, expect, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import StepClass from '../../app/components/character_builder/StepClass.vue'
import StepAsi from '../../app/components/character_builder/StepAsi.vue'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'

// Les compétences d'espèce comptent comme maîtrisées dans le builder : éligibles à l'expertise (AideDD,
// Roublard : « choisissez deux des compétences que vous maîtrisez »), signalées en doublon d'un choix de
// classe, exclues du picker Doué. Effets recopiés du seed (Sens aiguisés, Menaçant).

const ROUBLARD = 7
const DOUE = 902

let releaseElf!: () => void
const elfLoaded = new Promise<void>((resolve) => {
  releaseElf = resolve
})

registerEndpoint('/api/character_species', () => [
  { id: 10, name: 'Demi-orc' },
  { id: 20, name: 'Elfe' },
  { id: 30, name: 'Humain' },
])
registerEndpoint('/api/catalog/species/10', () => ({
  id: 10,
  name: 'Demi-orc',
  speed: 9,
  size: 'M',
  effects: [
    { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
    { type: 'skill_proficiency', value: { skill: 'intimidation' } }, // Menaçant
  ],
  lineages: [],
}))
// Réponse retenue jusqu'à `releaseElf()` : simule la fenêtre où les effets d'espèce ne sont pas arrivés.
registerEndpoint('/api/catalog/species/20', async () => {
  await elfLoaded
  return {
    id: 20,
    name: 'Elfe',
    speed: 9,
    size: 'M',
    effects: [
      { type: 'ability_increase', value: { ability: 'dex', amount: 2 } },
      { type: 'skill_proficiency', value: { skill: 'perception' } }, // Sens aiguisés
    ],
    lineages: [],
  }
})
registerEndpoint('/api/catalog/species/30', () => ({
  id: 30,
  name: 'Humain',
  speed: 9,
  size: 'M',
  effects: [{ type: 'ability_increase', value: { ability: 'str', amount: 1 } }],
  lineages: [],
}))
registerEndpoint('/api/catalog/classes', () => [{ id: ROUBLARD, name: 'Roublard', subclassLevel: 3, subclasses: [] }])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [
    {
      progressionId: 1,
      ownerClassId: ROUBLARD,
      ownerLevelRequired: 1,
      kind: 'expertise',
      count: { op: 'fixed', value: 2 },
      optionSource: { type: 'proficient_skills' },
      replaceable: false,
    },
    {
      progressionId: 2,
      ownerClassId: ROUBLARD,
      ownerLevelRequired: 4,
      kind: 'asi_or_feat',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'abilities', from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], distributions: ['2+1', '1+1+1'] },
      replaceable: false,
    },
  ],
}))
registerEndpoint('/api/feats', () => [
  { id: DOUE, name: 'Doué', description: null, effects: [{ type: 'other', value: { kind: 'skilled_choice' } }] },
])

type Wrapper = { findAll: (selector: string) => Array<{ text: () => string, findAll: (s: string) => Array<{ text: () => string }> }> }

function buildRogue(partial: Partial<BuilderState>) {
  const builder = useCharacterBuilder()
  builder.resetBuilder()
  Object.assign(builder.state.value, {
    name: 'Test',
    level: 1,
    classId: 'rogue',
    backgroundId: 'acolyte', // Intuition + Religion
    alignment: 'N',
    abilities: { str: 8, dex: 15, con: 14, int: 12, wis: 13, cha: 10 },
    ...partial,
  })
  return builder
}

// Le bloc le plus interne dont le texte contient `title` (les conteneurs parents le contiennent aussi).
function buttonsOf(wrapper: Wrapper, selector: string, title: string): string[] {
  const section = wrapper.findAll(selector).filter(d => d.text().includes(title)).at(-1)
  if (!section) throw new Error(`bloc « ${title} » absent`)
  return section.findAll('button').map(b => b.text().trim())
}
const expertiseButtons = (wrapper: Wrapper) => buttonsOf(wrapper, 'div.rounded-xl', '★ Expertise')
const skilledButtons = (wrapper: Wrapper) => buttonsOf(wrapper, 'div.rounded-lg', 'Doué — 3 maîtrises')

// Premier du fichier : l'Elfe ne doit pas avoir été chargé par un test précédent.
describe('purge de l\'expertise — attend les compétences d\'espèce', () => {
  it('un pick d\'expertise sur une compétence d\'espèce survit à la fenêtre de chargement', async () => {
    // État restauré (localStorage) : Perception vient de Sens aiguisés, pas des compétences de classe.
    const { state, proficientSkills, catalogSpeciesId } = buildRogue({
      raceId: 'elf',
      skills: ['stealth', 'acrobatics', 'deception', 'intimidation'],
      expertiseSkills: ['perception', 'stealth'],
    })
    await vi.waitFor(() => expect(catalogSpeciesId.value).toBe(20))

    state.value.skills = ['stealth', 'acrobatics', 'deception', 'investigation']
    await nextTick()
    expect(proficientSkills.value).not.toContain('perception')
    expect(state.value.expertiseSkills).toEqual(['perception', 'stealth'])

    releaseElf()
    await vi.waitFor(() => expect(proficientSkills.value).toContain('perception'))
    await nextTick()
    expect(state.value.expertiseSkills).toEqual(['perception', 'stealth'])
  })

  it('une fois l\'espèce chargée, la purge reprend (changement de race)', async () => {
    const { state, speciesEffects } = buildRogue({
      raceId: 'elf',
      skills: ['stealth', 'acrobatics', 'deception', 'intimidation'],
      expertiseSkills: ['perception', 'stealth'],
    })
    await vi.waitFor(() => expect(speciesEffects.value).not.toEqual([]))

    state.value.raceId = 'human'
    await vi.waitFor(() => expect(speciesEffects.value[0]).toMatchObject({ value: { ability: 'str' } }))
    await vi.waitFor(() => expect(state.value.expertiseSkills).toEqual(['stealth']))
  })

  it('une espèce absente du catalogue ne bloque pas la purge', async () => {
    // Gnome : absent de `/api/character_species` ici → aucun effet à attendre une fois la liste chargée.
    const { state, catalogSpeciesId } = buildRogue({
      raceId: 'gnome',
      skills: ['stealth', 'acrobatics', 'deception', 'intimidation'],
      expertiseSkills: ['perception', 'stealth'],
    })
    await nextTick()
    expect(catalogSpeciesId.value).toBeNull()

    state.value.skills = ['stealth', 'acrobatics', 'deception', 'investigation']
    await vi.waitFor(() => expect(state.value.expertiseSkills).toEqual(['stealth']))
  })
})

describe('expertise — compétences d\'espèce éligibles', () => {
  it('Roublard elfe : Perception (Sens aiguisés) proposée sans être une compétence de classe', async () => {
    buildRogue({ raceId: 'elf', skills: ['stealth', 'acrobatics', 'deception', 'intimidation'] })
    const wrapper = await mountSuspended(StepClass)
    // Classe (4) + Acolyte (Intuition, Religion) + espèce (Perception), dans l'ordre de SKILLS.
    await vi.waitFor(() => expect(expertiseButtons(wrapper)).toEqual([
      'Acrobaties', 'Tromperie', 'Intuition', 'Intimidation', 'Perception', 'Religion', 'Discrétion',
    ]))
  })
})

describe('doublon compétence de classe ↔ source fixe', () => {
  it('signale le doublon avec l\'espèce comme avec l\'historique, en nommant la source', async () => {
    const { classSkillConflicts, classSkillConflictLabels } = buildRogue({
      raceId: 'half-orc',
      skills: ['intimidation', 'insight', 'stealth', 'acrobatics'],
    })
    await vi.waitFor(() => expect(classSkillConflicts.value).toEqual(['intimidation', 'insight']))
    expect(classSkillConflictLabels.value).toBe('Intimidation (espèce), Intuition (historique)')

    const wrapper = await mountSuspended(StepClass)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Déjà accordé par ailleurs : Intimidation (espèce), Intuition (historique).'))
  })
})

describe('picker Doué (palier d\'ASI)', () => {
  const rogue4 = (skilled: string[]) => buildRogue({
    raceId: 'half-orc',
    level: 4,
    skills: ['stealth', 'acrobatics', 'deception', 'perception'],
    asiChoice: { 4: 'feat' },
    asiFeats: { 4: DOUE },
    featChoices: { [DOUE]: { skills: skilled, tools: [] } },
  })

  it('n\'offre pas la compétence d\'espèce', async () => {
    rogue4([])
    const wrapper = await mountSuspended(StepAsi)
    await vi.waitFor(() => expect(skilledButtons(wrapper)).toContain('Athlétisme'))
    await vi.waitFor(() => expect(skilledButtons(wrapper)).not.toContain('Intimidation'))
    expect(skilledButtons(wrapper)).not.toContain('Perception')
    expect(skilledButtons(wrapper)).not.toContain('Religion')
  })

  it('un choix devenu doublon reste affiché (désélectionnable) et signalé', async () => {
    rogue4(['intimidation', 'arcana'])
    const wrapper = await mountSuspended(StepAsi)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Déjà maîtrisé par ailleurs : Intimidation.'))
    expect(skilledButtons(wrapper)).toContain('Intimidation')
    expect(skilledButtons(wrapper)).not.toContain('Religion')
  })
})

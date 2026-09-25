import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepSpells from '../../app/components/level_up/LevelUpStepSpells.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'

// Garde-fou du bug « multiclasser vers un lanceur ne propose aucun sort » : en multiclasse la classe
// part du niveau 0, et les sorts se choisissent classe par classe (règle de multiclassage PHB 2014).

const spell = (id: number, name: string, level: number, className: string) =>
  ({ id, name, level, className, school: { name: 'Evocation' } })

const SPELLS = [
  spell(1, 'Décharge occulte', 0, 'Occultiste'),
  spell(2, 'Illusion mineure', 0, 'Occultiste'),
  spell(3, 'Contact glacial', 0, 'Occultiste'),
  spell(4, 'Maléfice', 1, 'Occultiste'),
  spell(5, 'Armure d\'Agathys', 1, 'Occultiste'),
  spell(6, 'Charme-personne', 1, 'Occultiste'),
  // Quatre sorts mineurs de Clerc seulement : le seed n'en compte pas davantage.
  spell(10, 'Flamme sacrée', 0, 'Clerc'),
  spell(11, 'Thaumaturgie', 0, 'Clerc'),
  spell(12, 'Assistance', 0, 'Clerc'),
  spell(13, 'Lumière', 0, 'Clerc'),
  spell(20, 'Trait de feu', 0, 'Magicien'),
  spell(21, 'Main de mage', 0, 'Magicien'),
  spell(22, 'Prestidigitation', 0, 'Magicien'),
  spell(23, 'Projectile magique', 1, 'Magicien'),
  spell(24, 'Bouclier', 1, 'Magicien'),
  spell(25, 'Invisibilité', 2, 'Magicien'),
  spell(26, 'Boule de feu', 3, 'Magicien'),
  spell(30, 'Marque du chasseur', 1, 'Rôdeur'),
  spell(31, 'Soins', 1, 'Rôdeur'),
  spell(32, 'Passage sans trace', 2, 'Rôdeur'),
]

beforeAll(() => {
  registerEndpoint('/api/spells', (event) => {
    const { className } = getQuery(event) as { className?: string }
    return className ? SPELLS.filter(s => s.className === className) : SPELLS
  })
  registerEndpoint('/api/invocations', () => [])
})

type ClassFixture = { id: number, name: string, level: number }

const sheet = (classes: ClassFixture[], knownSpellIds: number[] = []) => ({
  id: 1,
  classes: classes.map((c, i) => ({ classId: c.id, level: c.level, isMain: i === 0, class: { name: c.name } })),
  baseAbilityScores: [{ abilityId: 'int', value: 16 }, { abilityId: 'wis', value: 16 }, { abilityId: 'cha', value: 16 }],
  skills: [],
  spells: knownSpellIds.map(spellId => ({ spellId })),
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 50 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountSpellsStep(classes: ClassFixture[], pickedClassId: string, fromLevel: number, knownSpellIds: number[] = []) {
  const charSheet = ref(sheet(classes, knownSpellIds))
  let levelUp!: ReturnType<typeof useLevelUp>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
      levelUp.resetWizard()
      Object.assign(levelUp.state.value, {
        pickedClassId,
        isMulticlass: fromLevel === 0,
        fromLevel,
        toLevel: fromLevel + 1,
        newCantripIds: [],
        newSpellIds: [],
        pactBoon: null,
        pactBoonCantripIds: [],
        newInvocationIds: [],
        bookOfAncientSecretsSpellIds: [],
      })
      return () => h(LevelUpStepSpells)
    },
  })
  const wrapper = await mountSuspended(Host, { global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } } })
  await waitFor(() => levelUp.classSpells.value.length > 0 && !levelUp.classSpellsPending.value)
  return { levelUp, text: () => wrapper.text().replace(/\s+/g, ' ') }
}

describe('Étape Magie du level-up — multiclassage vers un lanceur', () => {
  it('Guerrier 3 → Occultiste 1 : 2 sorts mineurs et 2 sorts connus à choisir, exigés', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 5, name: 'Guerrier', level: 3 }], 'warlock', 0)

    expect(levelUp.cantripsToLearn.value).toBe(2)
    expect(levelUp.spellsToLearn.value).toBe(2)
    expect(text()).toMatch(/Sorts mineurs ?0\/2/)
    expect(text()).toMatch(/Sorts connus ?0\/2/)
    expect(text()).toContain('Maléfice')

    expect(levelUp.isStepComplete.value('spells')).toBe(false)
    levelUp.state.value.newCantripIds = [1, 2]
    levelUp.state.value.newSpellIds = [4, 5]
    expect(levelUp.isStepComplete.value('spells')).toBe(true)
  })

  it('Clerc 5 → Magicien 1 : grimoire de 6 sorts, limités au niveau 1 de MAGICIEN', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 3, name: 'Clerc', level: 5 }], 'wizard', 0)

    expect(levelUp.cantripsToLearn.value).toBe(3)
    expect(levelUp.spellsToLearn.value).toBe(6)
    // Les emplacements combinés (niveau de lanceur 6) montent au niveau 3, pas le magicien 1.
    expect(levelUp.maxLearnableSpellLevel.value).toBe(1)
    expect(text()).toContain('Projectile magique')
    expect(text()).not.toContain('Invisibilité')
    expect(text()).not.toContain('Boule de feu')
    // Deux sorts de niveau 1 au catalogue : le dû est plafonné, et la raison est affichée.
    expect(levelUp.requiredSpellPicks.value).toBe(2)
    expect(text()).toContain('Seulement 2 sort(s) encore disponible(s)')
  })

  it('Clerc 5 → Magicien 1 : « Avant » montre les emplacements déjà possédés', async () => {
    const { text } = await mountSpellsStep([{ id: 3, name: 'Clerc', level: 5 }], 'wizard', 0)
    expect(text()).not.toContain('Aucun emplacement')
  })

  it('changer de classe après chargement recharge la liste de la nouvelle classe', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 5, name: 'Guerrier', level: 3 }], 'warlock', 0)
    expect(text()).toContain('Maléfice')

    levelUp.state.value.pickedClassId = 'wizard'
    await waitFor(() => levelUp.classSpells.value.some(s => s.name === 'Projectile magique') && !levelUp.classSpellsPending.value)
    expect(levelUp.spellsToLearn.value).toBe(6)
    expect(text()).toContain('Projectile magique')
    expect(text()).not.toContain('Maléfice')
  })

  it('Magicien 3 → Clerc 1 : 3 sorts mineurs, aucun sort connu (il prépare)', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 6, name: 'Magicien', level: 3 }], 'cleric', 0)

    expect(levelUp.cantripsToLearn.value).toBe(3)
    expect(levelUp.spellsToLearn.value).toBe(0)
    expect(text()).toMatch(/Sorts mineurs ?0\/3/)
  })
})

describe('Étape Magie du level-up — classe déjà possédée', () => {
  it('Rôdeur 1 → 2 : le Rôdeur 2014 CONNAÎT 2 sorts', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 9, name: 'Rôdeur', level: 1 }], 'ranger', 1)

    expect(levelUp.spellsToLearn.value).toBe(2)
    expect(text()).toMatch(/Sorts connus ?0\/2/)
    expect(text()).toContain('Marque du chasseur')
    expect(text()).not.toContain('Passage sans trace')
  })

  it('Clerc 9 → 10 connaissant tous les sorts mineurs du catalogue : l\'étape ne bloque pas', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 3, name: 'Clerc', level: 9 }], 'cleric', 9, [10, 11, 12, 13])

    expect(levelUp.cantripsToLearn.value).toBe(1)
    expect(levelUp.requiredCantripPicks.value).toBe(0)
    expect(levelUp.isStepComplete.value('spells')).toBe(true)
  })
})

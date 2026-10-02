import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepSpells from '../../app/components/level_up/LevelUpStepSpells.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'

// Garde-fou du bug « multiclasser vers un lanceur ne propose aucun sort » : en multiclasse la classe
// part du niveau 0, et les sorts se choisissent classe par classe (règle de multiclassage PHB 2014).

const spell = (id: number, name: string, level: number, className: string, school = 'Evocation') =>
  ({ id, name, level, className, school: { name: school } })

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
  spell(27, 'Rayon empoisonné', 1, 'Magicien', 'Necromancy'),
  spell(28, 'Sommeil', 1, 'Magicien', 'Enchantment'),
  spell(40, 'Sommeil', 1, 'Barde'),
  spell(41, 'Soins', 1, 'Barde'),
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
  spells: knownSpellIds.map((spellId) => {
    const known = SPELLS.find(s => s.id === spellId)
    return { spellId, classId: classes[0]!.id, source: null, spell: known && { name: known.name, level: known.level } }
  }),
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 50 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountSpellsStep(classes: ClassFixture[], pickedClassId: string, fromLevel: number, knownSpellIds: number[] = [], extraState: Record<string, unknown> = {}) {
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
        ...extraState,
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
    // Quatre sorts de niveau 1 au catalogue : le dû est plafonné, et la raison est affichée.
    expect(levelUp.requiredSpellPicks.value).toBe(4)
    expect(text()).toContain('Seulement 4 sort(s) encore disponible(s)')
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

describe('Étape Magie du level-up — remplacement d\'un sort connu', () => {
  it('Rôdeur 3 → 4 : rien de nouveau à apprendre, mais un sort connu se remplace ; le remplaçant devient exigé', async () => {
    const { levelUp, text } = await mountSpellsStep([{ id: 9, name: 'Rôdeur', level: 3 }], 'ranger', 3, [30])

    expect(levelUp.spellsToLearn.value).toBe(0)
    expect(levelUp.replaceableSpells.value.map(s => s.id)).toEqual([30])
    expect(text()).toContain('Remplacer un sort connu')
    expect(levelUp.isStepComplete.value('spells')).toBe(true)

    levelUp.state.value.replacedSpellId = 30
    expect(levelUp.spellPicksDue.value).toBe(1)
    expect(levelUp.isStepComplete.value('spells')).toBe(false)
    levelUp.state.value.newSpellIds = [31]
    expect(levelUp.isStepComplete.value('spells')).toBe(true)
  })

  it('Magicien : il prépare, il ne remplace rien', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 6, name: 'Magicien', level: 3 }], 'wizard', 3, [23])
    expect(levelUp.replaceableSpells.value).toEqual([])
  })

  it('classe rejointe par multiclassage : aucun sort à remplacer', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 5, name: 'Guerrier', level: 3 }], 'warlock', 0)
    expect(levelUp.replaceableSpells.value).toEqual([])
  })
})

describe('Étape Magie du level-up — Secrets magiques du Barde', () => {
  it('Barde 9 → 10 : deux sorts de n\'importe quelle classe, jamais plus de deux hors de la liste du barde', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 7, name: 'Barde', level: 9 }], 'bard', 9)

    expect(levelUp.spellsToLearn.value).toBe(2)
    expect(levelUp.freeListPicks.value).toBe(2)
    const names = levelUp.learnableSpells.value.map(s => s.name)
    expect(names).toContain('Projectile magique')
    expect(names).toContain('Sommeil')
    expect(levelUp.isOutsideClassList(23)).toBe(true)
    expect(levelUp.isOutsideClassList(40)).toBe(false)

    levelUp.state.value.newSpellIds = [23, 24]
    expect(levelUp.canPickOutsideClassList.value).toBe(false)
    levelUp.state.value.newSpellIds = [23, 40]
    expect(levelUp.canPickOutsideClassList.value).toBe(true)
  })

  it('Barde 10 → 11 : pas de Secrets magiques, la liste de la classe seulement', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 7, name: 'Barde', level: 10 }], 'bard', 10)

    expect(levelUp.freeListPicks.value).toBe(0)
    expect(levelUp.learnableSpells.value.map(s => s.name).sort()).toEqual(['Soins', 'Sommeil'])
  })

  it('Collège du savoir, niveau 5 → 6 : deux sorts de plus que le décompte', async () => {
    const { levelUp } = await mountSpellsStep([{ id: 7, name: 'Barde', level: 5 }], 'bard', 5)
    levelUp.state.value.newSubclassName = 'Collège du savoir'

    expect(levelUp.freeListPicks.value).toBe(2)
    expect(levelUp.spellPicksDue.value).toBe(levelUp.spellsToLearn.value + 2)
  })
})

describe('Étape Magie du level-up — Chevalier occulte (lanceur du tiers)', () => {
  const eldritchKnight = (fromLevel: number) =>
    mountSpellsStep([{ id: 5, name: 'Guerrier', level: fromLevel }], 'fighter', fromLevel, [], { newSubclassName: 'Chevalier occulte' })

  it('Guerrier 2 → 3 en choisissant le Chevalier occulte : l\'étape Magie s\'ouvre, avec la liste du Magicien', async () => {
    const { levelUp } = await eldritchKnight(2)

    expect(levelUp.hasSpellcasting.value).toBe(true)
    expect(levelUp.activeSteps.value.some(step => step.id === 'spells')).toBe(true)
    expect(levelUp.cantripsToLearn.value).toBe(2)
    expect(levelUp.spellsToLearn.value).toBe(3)
    expect(levelUp.maxLearnableSpellLevel.value).toBe(1)
    expect(levelUp.learnableSpells.value.map(s => s.name)).toContain('Projectile magique')
    expect(levelUp.learnableSpells.value.map(s => s.name)).not.toContain('Boule de feu')
  })

  it('un Guerrier d\'une autre sous-classe n\'a pas d\'étape Magie', async () => {
    const charSheet = ref(sheet([{ id: 5, name: 'Guerrier', level: 2 }]))
    let levelUp!: ReturnType<typeof useLevelUp>
    const Host = defineComponent({
      setup() {
        levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
        levelUp.resetWizard()
        Object.assign(levelUp.state.value, { pickedClassId: 'fighter', fromLevel: 2, toLevel: 3, newSubclassName: 'Champion' })
        return () => h('div')
      },
    })
    await mountSuspended(Host)
    expect(levelUp.hasSpellcasting.value).toBe(false)
  })

  it('deux écoles pour la plupart des sorts, une école libre au niveau 3', async () => {
    const { levelUp } = await eldritchKnight(2)
    const necromancy = levelUp.learnableSpells.value.find(s => s.name === 'Rayon empoisonné')!
    const enchantment = levelUp.learnableSpells.value.find(s => s.name === 'Sommeil')!

    expect(levelUp.schoolRestriction.value).toMatchObject({ schools: ['Abjuration', 'Evocation'], freePicks: 1 })
    expect(levelUp.isSchoolBlocked(necromancy)).toBe(false)
    levelUp.state.value.newSpellIds = [necromancy.id]
    expect(levelUp.outsideSchoolPicks.value).toBe(1)
    expect(levelUp.isSchoolBlocked(enchantment)).toBe(true)
    expect(levelUp.isSchoolBlocked(necromancy)).toBe(false)
  })

  it('niveau 3 → 4 : aucune école libre, un seul sort', async () => {
    const charSheet = ref({ ...sheet([{ id: 5, name: 'Guerrier', level: 3 }]), classes: [{ classId: 5, level: 3, isMain: true, class: { name: 'Guerrier' }, subclass: { name: 'Chevalier occulte' } }] })
    let levelUp!: ReturnType<typeof useLevelUp>
    const Host = defineComponent({
      setup() {
        levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
        levelUp.resetWizard()
        Object.assign(levelUp.state.value, { pickedClassId: 'fighter', fromLevel: 3, toLevel: 4 })
        return () => h('div')
      },
    })
    await mountSuspended(Host)
    await waitFor(() => levelUp.classSpells.value.length > 0 && !levelUp.classSpellsPending.value)

    expect(levelUp.spellsToLearn.value).toBe(1)
    expect(levelUp.cantripsToLearn.value).toBe(0)
    expect(levelUp.schoolRestriction.value?.freePicks).toBe(0)
  })
})

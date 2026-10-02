import { describe, it, expect } from 'vitest'
import { choicesGainedAtLevelUp, isPickChoice, resolveChoices, type CatalogProgression } from '../../shared/rules/resolve'

// Un choix que porte une sous-classe (terrain du Cercle de la terre) n'existe qu'une fois la sous-classe choisie ;
// au level-up, la sous-classe peut être choisie au niveau même où le choix devient dû.

const DRUID = 5
const EARTH_CIRCLE = 50
const MOON_CIRCLE = 51
const TERRAINS = ['Arctique', 'Forêt', 'Plaine']

const terrain: CatalogProgression = {
  progressionId: 1,
  ownerClassId: DRUID,
  ownerSubclassId: EARTH_CIRCLE,
  ownerLevelRequired: 2,
  kind: 'terrain',
  count: { op: 'fixed', value: 1 },
  optionSource: { type: 'enum', values: TERRAINS },
  replaceable: false,
  options: TERRAINS.map(value => ({ value })),
}
const catalog = { progressions: [terrain] }

describe('resolveChoices — choix porté par une sous-classe', () => {
  it('dû au niveau de classe de la sous-classe, avec ses options', () => {
    const [choice] = resolveChoices({ classLevels: { [DRUID]: 2 }, subclassIds: [EARTH_CIRCLE] }, catalog).choices
    expect(choice).toMatchObject({ kind: 'terrain', count: 1, remaining: 1, ownerClassId: DRUID })
    expect(choice!.options.map(o => o.value)).toEqual(TERRAINS)
  })

  it('absent sans la sous-classe, avec une autre sous-classe, ou avant son niveau', () => {
    expect(resolveChoices({ classLevels: { [DRUID]: 2 } }, catalog).choices).toEqual([])
    expect(resolveChoices({ classLevels: { [DRUID]: 2 }, subclassIds: [MOON_CIRCLE] }, catalog).choices).toEqual([])
    expect(resolveChoices({ classLevels: { [DRUID]: 1 }, subclassIds: [EARTH_CIRCLE] }, catalog).choices).toEqual([])
  })

  it('est un choix générique de pick, comme les maîtrises', () => {
    const [choice] = resolveChoices({ classLevels: { [DRUID]: 2 }, subclassIds: [EARTH_CIRCLE] }, catalog).choices
    expect(isPickChoice(choice!)).toBe(true)
  })
})

describe('choicesGainedAtLevelUp — sous-classe choisie à ce niveau', () => {
  const gained = (over: Partial<Parameters<typeof choicesGainedAtLevelUp>[1]>) =>
    choicesGainedAtLevelUp(catalog, { classId: DRUID, fromLevel: 1, toLevel: 2, mainClassId: DRUID, ...over }).map(c => c.progressionId)

  it('niveau 1 → 2 en choisissant le Cercle de la terre : le terrain est gagné', () => {
    expect(gained({ subclassIdsAfter: [EARTH_CIRCLE] })).toEqual([1])
  })

  it('sans sous-classe choisie, ou avec un autre cercle : rien', () => {
    expect(gained({})).toEqual([])
    expect(gained({ subclassIdsAfter: [MOON_CIRCLE] })).toEqual([])
  })

  it('aux niveaux suivants, le terrain déjà choisi n\'est pas regagné', () => {
    expect(gained({ fromLevel: 2, toLevel: 3, subclassIdsBefore: [EARTH_CIRCLE], subclassIdsAfter: [EARTH_CIRCLE] })).toEqual([])
  })
})

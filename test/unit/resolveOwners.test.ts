import { describe, it, expect } from 'vitest'
import { resolveChoices, type CatalogProgression } from '../../shared/rules/resolve'

// Propriétaires d'un point de choix hors classe et sous-classe : lignée, historique, règle générale ; et, pour
// une classe, porteur de départ (1re classe) ou de multiclassage (classe rejointe).

const BARD = 2
const ROGUE = 9

function progression(id: number, owner: Partial<CatalogProgression>, count: CatalogProgression['count'] = { op: 'fixed', value: 1 }): CatalogProgression {
  return {
    progressionId: id,
    ownerLevelRequired: 1,
    kind: 'tool',
    count,
    optionSource: { type: 'tools' },
    replaceable: false,
    options: [{ value: 'Luth' }, { value: 'Flûte' }],
    ...owner,
  }
}

const due = (ids: number[]) => ids.sort((a, b) => a - b)

describe('resolveChoices — propriétaires lignée, historique, règle générale', () => {
  const catalog = {
    progressions: [
      progression(1, { ownerLineageId: 10 }),
      progression(2, { ownerBackgroundId: 20 }),
      progression(3, { global: true }, { op: 'var', name: 'duplicate_tools' }),
    ],
  }

  it('gate la lignée et l\'historique sur ceux du personnage', () => {
    const ids = resolveChoices({ classLevels: { [BARD]: 1 }, lineageId: 10, backgroundId: 20 }, catalog).choices.map(c => c.progressionId)
    expect(due(ids)).toEqual([1, 2])
    expect(resolveChoices({ classLevels: { [BARD]: 1 }, lineageId: 11, backgroundId: 21 }, catalog).choices).toEqual([])
  })

  it('propose ces choix avant qu\'une classe soit choisie (builder : niveau 1 au moins)', () => {
    const ids = resolveChoices({ classLevels: {}, lineageId: 10, backgroundId: 20 }, catalog).choices.map(c => c.progressionId)
    expect(due(ids)).toEqual([1, 2])
  })

  it('règle générale : due autant de fois que de maîtrises reçues en double', () => {
    const none = resolveChoices({ classLevels: { [BARD]: 1 } }, catalog).choices
    expect(none.some(c => c.global)).toBe(false)
    const [replacement] = resolveChoices({ classLevels: { [BARD]: 1 }, duplicates: { skills: 0, tools: 2 } }, catalog).choices
    expect(replacement).toMatchObject({ progressionId: 3, global: true, count: 2, remaining: 2 })
  })
})

describe('resolveChoices — porteur de départ ou de multiclassage d\'une classe', () => {
  const catalog = {
    progressions: [
      progression(1, { ownerClassId: BARD, classGrant: 'start' }, { op: 'fixed', value: 3 }),
      progression(2, { ownerClassId: BARD, classGrant: 'multiclass' }),
    ],
  }

  it('création (1re classe implicite) : seul le choix de départ', () => {
    const [choice] = resolveChoices({ classLevels: { [BARD]: 1 } }, catalog).choices
    expect(choice).toMatchObject({ progressionId: 1, count: 3 })
    expect(resolveChoices({ classLevels: { [BARD]: 1 } }, catalog).choices).toHaveLength(1)
  })

  it('Barde rejoint par un Roublard : seul le choix de multiclassage', () => {
    const choices = resolveChoices({ classLevels: { [ROGUE]: 3, [BARD]: 1 }, mainClassId: ROGUE }, catalog).choices
    expect(choices.map(c => c.progressionId)).toEqual([2])
  })

  it('Barde 1re classe multiclassé : toujours son choix de départ, pas celui de multiclassage', () => {
    const choices = resolveChoices({ classLevels: { [BARD]: 3, [ROGUE]: 1 }, mainClassId: BARD }, catalog).choices
    expect(choices.map(c => c.progressionId)).toEqual([1])
  })
})

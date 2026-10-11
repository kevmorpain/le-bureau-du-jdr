import { describe, it, expect } from 'vitest'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import { knBuildCreatedSheet, knCreationSchema } from '../../shared/ker-nethalas/creation'
import {
  knAbilityPointsSpent,
  knAbilityPointsTotal,
  knAbilityPointsUnspent,
  knLockMastery,
  knMasteriesContentSchema,
  knMasteryPicksSchema,
  knMasteryPickIssues,
  knUnlockMastery,
  type KnMasteryPick,
} from '../../shared/ker-nethalas/masteries'
import { validKnCreation } from '../fixtures/knCreation'
import { fakeMastery } from '../fixtures/knMasteries'

describe('contenu des Maîtrises', () => {
  it('est enregistré sous le nom « masteries »', () => {
    expect(Object.keys(KN_CONTENT_SCHEMAS)).toContain('masteries')
    expect(Object.keys(KN_CONTENT_SCHEMAS).every(name => KN_CONTENT_NAME_RE.test(name))).toBe(true)
  })

  it('accepte une liste de Maîtrises complètes', () => {
    expect(knMasteriesContentSchema.safeParse([fakeMastery('alpha'), fakeMastery('beta')]).success).toBe(true)
  })

  it('refuse une liste vide, des clés en double et une clé mal formée', () => {
    expect(knMasteriesContentSchema.safeParse([]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([fakeMastery('alpha'), fakeMastery('alpha')]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([fakeMastery('Alpha Beta')]).success).toBe(false)
  })

  it('exige cinq aptitudes dans l\'ordre des paliers et six lieux d\'entraînement', () => {
    const base = fakeMastery('alpha')

    expect(knMasteriesContentSchema.safeParse([{ ...base, abilities: base.abilities.slice(0, 4) }]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([{ ...base, abilities: [...base.abilities].reverse() }]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([{ ...base, training: base.training.slice(0, 5) }]).success).toBe(false)
  })

  it('refuse une aptitude sans texte, ou dont le coût en Éther est négatif', () => {
    const base = fakeMastery('alpha')
    const broken = (patch: Partial<(typeof base.abilities)[number]>) =>
      [{ ...base, abilities: base.abilities.map((ability, index) => index === 0 ? { ...ability, ...patch } : ability) }]

    expect(knMasteriesContentSchema.safeParse(broken({ text: '' })).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse(broken({ aether: -1 })).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse(broken({ aether: null })).success).toBe(true)
  })
})

describe('Maîtrises du survivant', () => {
  it('accepte deux Maîtrises au plus, sans doublon, avec 1 à 5 paliers', () => {
    expect(knMasteryPicksSchema.safeParse([]).success).toBe(true)
    expect(knMasteryPicksSchema.safeParse([{ key: 'alpha', tiers: 1 }, { key: 'beta', tiers: 5 }]).success).toBe(true)
    expect(knMasteryPicksSchema.safeParse([{ key: 'alpha', tiers: 1 }, { key: 'alpha', tiers: 2 }]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([{ key: 'a', tiers: 1 }, { key: 'b', tiers: 1 }, { key: 'c', tiers: 1 }]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([{ key: 'alpha', tiers: 0 }]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([{ key: 'alpha', tiers: 6 }]).success).toBe(false)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ masteryPicks: [{ key: 'alpha', tiers: 2 }] }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ masteryPicks: [{ key: 'alpha', tiers: 9 }] }).success).toBe(false)
  })
})

describe('points d\'Aptitude', () => {
  const picks = (...tiers: number[]): KnMasteryPick[] => tiers.map((count, index) => ({ key: `m${index}`, tiers: count }))

  it('deux points au niveau 1, un de plus par niveau', () => {
    expect(knAbilityPointsTotal(1)).toBe(2)
    expect(knAbilityPointsTotal(5)).toBe(6)
  })

  it('les points non dépensés se déduisent du niveau et des paliers débloqués', () => {
    expect(knAbilityPointsSpent(picks(1, 1))).toBe(2)
    expect(knAbilityPointsUnspent(1, picks(1, 1))).toBe(0)
    expect(knAbilityPointsUnspent(3, picks(2, 1))).toBe(1)
    expect(knAbilityPointsUnspent(1, picks(5, 5))).toBe(0)
  })
})

describe('débloquer et reprendre une aptitude', () => {
  it('prend une première Maîtrise au palier 1, puis les paliers un à un', () => {
    let current: KnMasteryPick[] = []
    current = knUnlockMastery(current, 'alpha', 3)
    current = knUnlockMastery(current, 'alpha', 3)
    current = knUnlockMastery(current, 'beta', 3)

    expect(current).toEqual([{ key: 'alpha', tiers: 2 }, { key: 'beta', tiers: 1 }])
  })

  it('ne dépense pas plus de points que le niveau n\'en donne', () => {
    const full = [{ key: 'alpha', tiers: 1 }, { key: 'beta', tiers: 1 }]

    expect(knUnlockMastery(full, 'alpha', 1)).toEqual(full)
    expect(knUnlockMastery([], 'alpha', 1)).toEqual([{ key: 'alpha', tiers: 1 }])
  })

  it('n\'accepte pas une troisième Maîtrise ni un sixième palier', () => {
    const two = [{ key: 'alpha', tiers: 1 }, { key: 'beta', tiers: 1 }]

    expect(knUnlockMastery(two, 'gamma', 9)).toEqual(two)
    expect(knUnlockMastery([{ key: 'alpha', tiers: 5 }], 'alpha', 9)).toEqual([{ key: 'alpha', tiers: 5 }])
  })

  it('ne modifie pas la liste d\'origine', () => {
    const original = [{ key: 'alpha', tiers: 1 }]
    knUnlockMastery(original, 'alpha', 3)
    knLockMastery(original, 'alpha')

    expect(original).toEqual([{ key: 'alpha', tiers: 1 }])
  })

  it('reprendre un palier le retire, et retire la Maîtrise quand il n\'en reste plus', () => {
    expect(knLockMastery([{ key: 'alpha', tiers: 3 }, { key: 'beta', tiers: 1 }], 'alpha')).toEqual([{ key: 'alpha', tiers: 2 }, { key: 'beta', tiers: 1 }])
    expect(knLockMastery([{ key: 'alpha', tiers: 1 }, { key: 'beta', tiers: 1 }], 'alpha')).toEqual([{ key: 'beta', tiers: 1 }])
    expect(knLockMastery([{ key: 'beta', tiers: 1 }], 'alpha')).toEqual([{ key: 'beta', tiers: 1 }])
  })
})

describe('choix des Maîtrises à la création', () => {
  const available = ['alpha', 'beta', 'gamma']

  it('exige deux Maîtrises connues et différentes quand le contenu est chargé', () => {
    expect(knMasteryPickIssues(['alpha', 'beta'], available)).toEqual([])
    expect(knMasteryPickIssues(['alpha'], available)).toEqual(['il faut choisir 2 Maîtrises'])
    expect(knMasteryPickIssues([], available)).toEqual(['il faut choisir 2 Maîtrises'])
    expect(knMasteryPickIssues(['alpha', 'alpha'], available)).toEqual(['deux Maîtrises différentes sont attendues'])
    expect(knMasteryPickIssues(['alpha', 'delta'], available)).toEqual(['Maîtrise inconnue : delta'])
  })

  it('n\'en accepte aucune quand le contenu n\'est pas chargé', () => {
    expect(knMasteryPickIssues([], null)).toEqual([])
    expect(knMasteryPickIssues(['alpha', 'beta'], null)).toHaveLength(1)
  })

  it('le schéma de création borne à deux clés et la fiche construite en tire les paliers 1', () => {
    expect(knCreationSchema.safeParse(validKnCreation('x', { masteries: ['a', 'b', 'c'] })).success).toBe(false)

    const sheet = knBuildCreatedSheet(validKnCreation('x', { masteries: ['alpha', 'beta'] }))
    expect(sheet.masteryPicks).toEqual([{ key: 'alpha', tiers: 1 }, { key: 'beta', tiers: 1 }])
    expect(knBuildCreatedSheet(validKnCreation('x')).masteryPicks).toEqual([])
  })
})

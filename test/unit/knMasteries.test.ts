import { describe, it, expect } from 'vitest'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import { knBuildCreatedSheet, knCreationSchema } from '../../shared/ker-nethalas/creation'
import {
  knAbilityPointsSpent,
  knAbilityPointsTotal,
  knAbilityPointsUnspent,
  knAddAmulet,
  knDropAmulet,
  knLockMastery,
  knMasteriesContentSchema,
  knMasteryPicksSchema,
  knMasteryPickIssues,
  knSwapAmulet,
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

describe('amulette', () => {
  const trained = [{ key: 'alpha', tiers: 2 }, { key: 'beta', tiers: 1 }]
  const worn = (key: string, tiers: number): KnMasteryPick => ({ key, tiers, amulet: true })

  it('est une troisième entrée, marquée, avec zéro à cinq paliers', () => {
    expect(knMasteryPicksSchema.safeParse([...trained, worn('gamma', 0)]).success).toBe(true)
    expect(knMasteryPicksSchema.safeParse([...trained, worn('gamma', 5)]).success).toBe(true)
    expect(knMasteryPicksSchema.safeParse([...trained, worn('gamma', 6)]).success).toBe(false)
  })

  it('refuse deux amulettes, trois Maîtrises apprises, un doublon et une Maîtrise apprise sans palier', () => {
    expect(knMasteryPicksSchema.safeParse([...trained, worn('gamma', 0), worn('delta', 0)]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([...trained, { key: 'gamma', tiers: 1 }]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([...trained, worn('alpha', 0)]).success).toBe(false)
    expect(knMasteryPicksSchema.safeParse([{ key: 'alpha', tiers: 0 }]).success).toBe(false)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ masteryPicks: [...trained, worn('gamma', 3)] }).success).toBe(true)
  })

  it('s\'ajoute sans coûter de point, une seule fois, et pas sur une Maîtrise apprise', () => {
    expect(knAddAmulet(trained, 'gamma')).toEqual([...trained, worn('gamma', 0)])
    expect(knAddAmulet(trained, 'alpha')).toEqual(trained)
    expect(knAddAmulet([...trained, worn('gamma', 0)], 'delta')).toEqual([...trained, worn('gamma', 0)])
    expect(knAbilityPointsUnspent(3, [...trained, worn('gamma', 0)])).toBe(1)
  })

  it('ses paliers coûtent des points, et se débloquent comme les autres', () => {
    const picks = [...trained, worn('gamma', 0)]
    const unlocked = knUnlockMastery(picks, 'gamma', 6)

    expect(unlocked).toContainEqual(worn('gamma', 1))
    expect(knAbilityPointsSpent(unlocked)).toBe(4)
    expect(knUnlockMastery(picks, 'gamma', 2)).toEqual(picks)
  })

  it('une Maîtrise apprise ne se débloque pas en troisième quand l\'amulette occupe la place', () => {
    expect(knUnlockMastery([...trained, worn('gamma', 0)], 'delta', 9)).toEqual([...trained, worn('gamma', 0)])
    expect(knUnlockMastery([{ key: 'alpha', tiers: 1 }, worn('gamma', 1)], 'delta', 9)).toHaveLength(3)
  })

  it('reprendre un palier laisse l\'amulette portée, à zéro palier', () => {
    expect(knLockMastery([...trained, worn('gamma', 1)], 'gamma')).toEqual([...trained, worn('gamma', 0)])
    expect(knLockMastery([...trained, worn('gamma', 0)], 'gamma')).toEqual([...trained, worn('gamma', 0)])
  })

  it('changer d\'amulette garde le nombre de paliers, sauf vers une Maîtrise apprise', () => {
    const picks = [...trained, worn('gamma', 3)]

    expect(knSwapAmulet(picks, 'delta')).toEqual([...trained, worn('delta', 3)])
    expect(knSwapAmulet(picks, 'alpha')).toEqual(picks)
    expect(knSwapAmulet(trained, 'delta')).toEqual(trained)
  })

  it('se retire tant qu\'aucun palier n\'y est débloqué', () => {
    expect(knDropAmulet([...trained, worn('gamma', 0)])).toEqual(trained)
    expect(knDropAmulet([...trained, worn('gamma', 1)])).toEqual([...trained, worn('gamma', 1)])
  })

  it('ne modifie pas la liste d\'origine', () => {
    const original = [...trained, worn('gamma', 1)]
    knSwapAmulet(original, 'delta')
    knDropAmulet(original)
    knLockMastery(original, 'gamma')

    expect(original).toEqual([...trained, worn('gamma', 1)])
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

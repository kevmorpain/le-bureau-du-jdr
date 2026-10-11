import { describe, it, expect } from 'vitest'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import { knBuildCreatedSheet, knCreationSchema } from '../../shared/ker-nethalas/creation'
import {
  knCanTakeGoal,
  knClaimGoal,
  knDropGoal,
  knGoalPickIssues,
  knGoalPicksSchema,
  knGoalReached,
  knPersonalGoalsContentSchema,
  knSetGoalProgress,
  knTakeGoal,
  knUnclaimGoal,
  type KnGoalPick,
} from '../../shared/ker-nethalas/goals'
import { validKnCreation } from '../fixtures/knCreation'
import { fakeGoal } from '../fixtures/knGoals'

const pick = (key: string, progress = 0, claimed = false): KnGoalPick => ({ key, progress, claimed })

describe('contenu des objectifs personnels', () => {
  it('est enregistré sous le nom « personalGoals »', () => {
    expect(Object.keys(KN_CONTENT_SCHEMAS)).toContain('personalGoals')
    expect(Object.keys(KN_CONTENT_SCHEMAS).every(name => KN_CONTENT_NAME_RE.test(name))).toBe(true)
  })

  it('accepte une liste d\'objectifs, avec ou sans la mention « recommandé »', () => {
    expect(knPersonalGoalsContentSchema.safeParse([fakeGoal('alpha'), fakeGoal('beta', { recommended: true })]).success).toBe(true)
  })

  it('refuse une liste vide, des clés en double, une cible nulle et un texte vide', () => {
    expect(knPersonalGoalsContentSchema.safeParse([]).success).toBe(false)
    expect(knPersonalGoalsContentSchema.safeParse([fakeGoal('alpha'), fakeGoal('alpha')]).success).toBe(false)
    expect(knPersonalGoalsContentSchema.safeParse([fakeGoal('alpha', { target: 0 })]).success).toBe(false)
    expect(knPersonalGoalsContentSchema.safeParse([fakeGoal('alpha', { reward: '' })]).success).toBe(false)
    expect(knPersonalGoalsContentSchema.safeParse([fakeGoal('Alpha Beta')]).success).toBe(false)
  })
})

describe('objectifs du survivant', () => {
  it('accepte deux objectifs en cours au plus, sans doublon, plus tous ceux déjà récupérés', () => {
    expect(knGoalPicksSchema.safeParse([]).success).toBe(true)
    expect(knGoalPicksSchema.safeParse([pick('a', 3), pick('b', 0)]).success).toBe(true)
    expect(knGoalPicksSchema.safeParse([pick('a', 10, true), pick('b', 10, true), pick('c'), pick('d')]).success).toBe(true)
    expect(knGoalPicksSchema.safeParse([pick('a'), pick('b'), pick('c')]).success).toBe(false)
    expect(knGoalPicksSchema.safeParse([pick('a'), pick('a', 1, true)]).success).toBe(false)
    expect(knGoalPicksSchema.safeParse([pick('a', -1)]).success).toBe(false)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ goalPicks: [pick('a', 2)] }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ goalPicks: [pick('a'), pick('b'), pick('c')] }).success).toBe(false)
  })
})

describe('prendre et suivre un objectif', () => {
  it('on prend un objectif tant qu\'il y en a moins de deux en cours', () => {
    let picks: KnGoalPick[] = []
    picks = knTakeGoal(picks, 'a')
    picks = knTakeGoal(picks, 'b')
    picks = knTakeGoal(picks, 'c')

    expect(picks).toEqual([pick('a'), pick('b')])
  })

  it('un objectif récupéré libère une place, mais ne se reprend pas', () => {
    const picks = [pick('a', 10, true), pick('b')]

    expect(knCanTakeGoal(picks, 'c')).toBe(true)
    expect(knCanTakeGoal(picks, 'a')).toBe(false)
    expect(knTakeGoal(picks, 'a')).toEqual(picks)
    expect(knTakeGoal(picks, 'c')).toEqual([...picks, pick('c')])
  })

  it('le progrès se règle, borné, et seulement tant que l\'objectif est en cours', () => {
    expect(knSetGoalProgress([pick('a', 3)], 'a', 7)).toEqual([pick('a', 7)])
    expect(knSetGoalProgress([pick('a', 3)], 'a', -5)).toEqual([pick('a', 0)])
    expect(knSetGoalProgress([pick('a', 3)], 'a', 2.9)).toEqual([pick('a', 2)])
    expect(knSetGoalProgress([pick('a', 3)], 'a', 1e9)).toEqual([pick('a', 99999)])
    expect(knSetGoalProgress([pick('a', 10, true)], 'a', 1)).toEqual([pick('a', 10, true)])
  })

  it('l\'objectif est atteint quand le progrès rejoint la cible', () => {
    expect(knGoalReached(fakeGoal('a', { target: 10 }), pick('a', 9))).toBe(false)
    expect(knGoalReached(fakeGoal('a', { target: 10 }), pick('a', 10))).toBe(true)
    expect(knGoalReached(fakeGoal('a', { target: 10 }), pick('a', 12))).toBe(true)
  })

  it('ne modifie pas la liste d\'origine', () => {
    const original = [pick('a', 3)]
    knTakeGoal(original, 'b')
    knSetGoalProgress(original, 'a', 9)
    knDropGoal(original, 'a')

    expect(original).toEqual([pick('a', 3)])
  })
})

describe('récupérer la récompense', () => {
  const goal = fakeGoal('a', { target: 10 })

  it('refuse tant que la cible n\'est pas atteinte', () => {
    expect(knClaimGoal([pick('a', 9)], goal)).toEqual([pick('a', 9)])
  })

  it('marque l\'objectif récupéré une fois la cible atteinte, et pas deux fois', () => {
    const claimed = knClaimGoal([pick('a', 10), pick('b', 2)], goal)

    expect(claimed).toEqual([pick('a', 10, true), pick('b', 2)])
    expect(knClaimGoal(claimed, goal)).toEqual(claimed)
  })

  it('une récupération par mégarde s\'annule s\'il reste de la place', () => {
    expect(knUnclaimGoal([pick('a', 10, true), pick('b')], 'a')).toEqual([pick('a', 10), pick('b')])
    expect(knUnclaimGoal([pick('a', 10, true), pick('b'), pick('c')], 'a')).toEqual([pick('a', 10, true), pick('b'), pick('c')])
    expect(knUnclaimGoal([pick('a', 10), pick('b')], 'b')).toEqual([pick('a', 10), pick('b')])
  })

  it('un objectif choisi par erreur se retire tant qu\'il est vierge, jamais ensuite', () => {
    expect(knDropGoal([pick('a'), pick('b', 1)], 'a')).toEqual([pick('b', 1)])
    expect(knDropGoal([pick('a'), pick('b', 1)], 'b')).toEqual([pick('a'), pick('b', 1)])
    expect(knDropGoal([pick('a', 10, true)], 'a')).toEqual([pick('a', 10, true)])
  })
})

describe('choix des objectifs à la création', () => {
  const available = ['alpha', 'beta', 'gamma']

  it('exige deux objectifs connus et différents quand le contenu est chargé', () => {
    expect(knGoalPickIssues(['alpha', 'beta'], available)).toEqual([])
    expect(knGoalPickIssues(['alpha'], available)).toEqual(['il faut choisir 2 objectifs'])
    expect(knGoalPickIssues([], available)).toEqual(['il faut choisir 2 objectifs'])
    expect(knGoalPickIssues(['alpha', 'alpha'], available)).toEqual(['deux objectifs différents sont attendus'])
    expect(knGoalPickIssues(['alpha', 'delta'], available)).toEqual(['objectif inconnu : delta'])
  })

  it('n\'en accepte aucun quand le contenu n\'est pas chargé', () => {
    expect(knGoalPickIssues([], null)).toEqual([])
    expect(knGoalPickIssues(['alpha', 'beta'], null)).toHaveLength(1)
  })

  it('le schéma de création borne à deux clés et la fiche construite part de deux objectifs vierges', () => {
    expect(knCreationSchema.safeParse(validKnCreation('x', { goals: ['a', 'b', 'c'] })).success).toBe(false)

    expect(knBuildCreatedSheet(validKnCreation('x', { goals: ['alpha', 'beta'] })).goalPicks).toEqual([pick('alpha'), pick('beta')])
    expect(knBuildCreatedSheet(validKnCreation('x')).goalPicks).toEqual([])
  })
})

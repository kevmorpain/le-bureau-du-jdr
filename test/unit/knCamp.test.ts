import { describe, it, expect } from 'vitest'
import fr from '../../i18n/locales/fr.json'
import {
  KN_CAMP_ACTIVITY_KEYS,
  KN_PROVISION_KEYS,
  emptyKnCampPlan,
  emptyKnProvisions,
  knCampContext,
  knFinishCamp,
  knLowerDie,
  knPreviewCamp,
  knProvisionsSchema,
  knTakeBreather,
  type KnCampContext,
  type KnCampPlan,
  type KnCampState,
  type KnProvisions,
} from '../../shared/ker-nethalas/camp'
import { KN_USAGE_DICE, emptyKnDomain } from '../../shared/ker-nethalas/run'

// Une séquence de tirages : chaque entrée est le résultat voulu d'un dé à `sides` faces.
const rolls = (...results: [sides: number, result: number][]) => {
  const queue = results.map(([sides, result]) => (result - 0.5) / sides)
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('plus de tirage prévu')
    return next
  }
}

const provisions = (over: Partial<KnProvisions> = {}): KnProvisions => ({ ...emptyKnProvisions(), ...over })

const plan = (activities: Partial<KnCampPlan['activities']> = {}, over: Partial<KnCampPlan> = {}): KnCampPlan => {
  const base = emptyKnCampPlan()
  return { ...base, ...over, activities: { ...base.activities, ...activities } }
}

const context = (over: Partial<KnProvisions> = {}, extra: Partial<KnCampContext> = {}): KnCampContext => ({
  provisions: provisions(over),
  checkPenalty: 0,
  attuneBlocked: false,
  ...extra,
})

const state = (over: Partial<KnCampState> = {}): KnCampState => ({
  toughness: 5,
  toughnessMax: 20,
  health: 3,
  healthMax: 10,
  sanity: 4,
  sanityMax: 12,
  exhaustion: 12,
  rotStage: 0,
  ...over,
})

describe('provisions', () => {
  it('commencent à zéro et refusent un compteur négatif ou inconnu', () => {
    expect(Object.values(emptyKnProvisions()).every(count => count === 0)).toBe(true)
    expect(knProvisionsSchema.safeParse(emptyKnProvisions()).success).toBe(true)
    expect(knProvisionsSchema.safeParse({ ...emptyKnProvisions(), rations: -1 }).success).toBe(false)
    expect(knProvisionsSchema.safeParse({ ...emptyKnProvisions(), rations: 1000 }).success).toBe(false)
    expect(knProvisionsSchema.safeParse({ rations: 1 }).success).toBe(false)
  })

  it('ont un libellé français pour chaque provision et chaque activité du camp', () => {
    const labels = fr.ker_nethalas as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const key of KN_PROVISION_KEYS) expect(labels.provisions[key], key).toBeTruthy()
    for (const key of KN_CAMP_ACTIVITY_KEYS) {
      for (const field of ['name', 'unit', 'hint']) expect(labels.camp.activities[key][field], `${key}.${field}`).toBeTruthy()
    }
    expect(Object.keys(labels.camp.activities).sort()).toEqual([...KN_CAMP_ACTIVITY_KEYS].sort())
    expect(labels.camp.sleep.name).toBeTruthy()
  })
})

describe('Reprendre son souffle', () => {
  const input = { toughness: 5, toughnessMax: 20, health: 3, healthMax: 10, exhaustion: 6, lightRemaining: 12, tensionDie: 8 as const }

  it('rend D10+2 de Robustesse, 1 de Santé, retire 2 d\'Épuisement et 5 de lumière, et baisse le dé de Tension', () => {
    expect(knTakeBreather(input, rolls([10, 5]))).toEqual({
      toughness: 12,
      health: 4,
      exhaustion: 4,
      lightRemaining: 7,
      tensionDie: 6,
      toughnessRoll: 5,
    })
  })

  it('ne dépasse pas les maximums, ne descend pas sous 0 et garde le dé au D4', () => {
    const result = knTakeBreather(
      { ...input, toughness: 19, health: 10, exhaustion: 1, lightRemaining: 3, tensionDie: 4 },
      rolls([10, 10]),
    )

    expect(result).toMatchObject({ toughness: 20, health: 10, exhaustion: 0, lightRemaining: 0, tensionDie: 4 })
  })

  it('ne retire pas une valeur au-dessus d\'un maximum réduit', () => {
    expect(knTakeBreather({ ...input, toughness: 15, toughnessMax: 10 }, rolls([10, 1])).toughness).toBe(15)
  })

  it('descend le dé d\'un cran à la fois', () => {
    expect(KN_USAGE_DICE.map(die => knLowerDie(die))).toEqual([12, 10, 8, 6, 4, 4])
  })
})

describe('aperçu du camp', () => {
  it('barricader coûte 1 d\'Épuisement et rapporte 5 au test par Fourniture dépensée', () => {
    const preview = knPreviewCamp(plan({ barricade: 3 }), context({ craftingSupplies: 5, rations: 1 }))

    expect(preview).toMatchObject({ exhaustionCost: 3, checkModifier: 15, hasRation: true, issues: [] })
    expect(preview.provisions).toEqual(provisions({ craftingSupplies: 2, rations: 0 }))
  })

  it('fabriquer et réparer coûtent une fois quelle que soit la quantité', () => {
    const one = knPreviewCamp(plan({ torches: 1, repair: 1 }), context({ craftingSupplies: 9 }))
    const many = knPreviewCamp(plan({ torches: 4, repair: 3 }), context({ craftingSupplies: 99 }))

    expect(one).toMatchObject({ exhaustionCost: 3, checkModifier: -4 })
    expect(many).toMatchObject({ exhaustionCost: 3, checkModifier: -4 })
  })

  it('cumule toutes les activités avec leurs coûts propres', () => {
    const preview = knPreviewCamp(
      plan({ cooking: 2, bandages: 1, torches: 1, repair: 1, lampOil: 1 }),
      context({ cookingIngredients: 2, craftingSupplies: 6 }),
    )

    expect(preview.exhaustionCost).toBe(1 + 1 + 1 + 2 + 1)
    expect(preview.checkModifier).toBe(-1 - 1 - 2 - 2 - 2)
    expect(preview.issues).toEqual([])
    expect(preview.provisions).toEqual(provisions({ rations: 1, bandages: 1, torches: 1, lampOil: 1, craftingSupplies: 0 }))
  })

  it('harmoniser et soigner coûtent par unité, soigner consomme des Bandages', () => {
    const preview = knPreviewCamp(
      plan({ attune: 2, healConditions: 3 }),
      context({ attunementCrystals: 2, bandages: 3 }),
    )

    expect(preview).toMatchObject({ exhaustionCost: 5, checkModifier: 0, issues: [] })
    expect(preview.provisions).toMatchObject({ attunementCrystals: 0, bandages: 0 })
  })

  it('compte les Bandages fabriqués au camp pour soigner', () => {
    const preview = knPreviewCamp(plan({ bandages: 1, healConditions: 1 }), context({ craftingSupplies: 1 }))

    expect(preview.issues).toEqual([])
    expect(preview.provisions.bandages).toBe(0)
  })

  it('signale chaque pénurie avec la quantité manquante', () => {
    const preview = knPreviewCamp(plan({ torches: 3, attune: 1 }), context({ craftingSupplies: 2 }))

    expect(preview.issues).toEqual(expect.arrayContaining([
      { type: 'shortage', key: 'craftingSupplies', missing: 1 },
      { type: 'shortage', key: 'attunementCrystals', missing: 1 },
    ]))
  })

  it('Dormir donne +2 au test et exclut tout sauf Barricader', () => {
    const sleep = knPreviewCamp(plan({}, { sleep: true }), context())
    const withBarricade = knPreviewCamp(plan({ barricade: 1 }, { sleep: true }), context({ craftingSupplies: 1 }))
    const withTorches = knPreviewCamp(plan({ torches: 1 }, { sleep: true }), context({ craftingSupplies: 1 }))

    expect(sleep.checkModifier).toBe(2)
    expect(withBarricade.issues).toEqual([])
    expect(withBarricade.checkModifier).toBe(7)
    expect(withTorches.issues).toEqual([{ type: 'sleepExclusive' }])
  })

  it('prend en compte le modificateur libre et le retrait des événements', () => {
    const preview = knPreviewCamp(plan({}, { modifier: 3 }), context({}, { checkPenalty: 2 }))

    expect(preview.checkModifier).toBe(1)
  })

  it('une Ration se consomme si elle existe, y compris une Ration cuisinée au camp', () => {
    expect(knPreviewCamp(plan(), context()).hasRation).toBe(false)
    expect(knPreviewCamp(plan({ cooking: 1 }), context({ cookingIngredients: 1 })).hasRation).toBe(true)
    expect(knPreviewCamp(plan(), context({ rations: 2 })).provisions.rations).toBe(1)
  })

  it('l\'événement « mains tremblantes » retire 1 par exemplaire, « concentration » interdit l\'Harmonisation', () => {
    const domain = {
      ...emptyKnDomain(1),
      growingDarkness: [{ key: 'gd_17_18' as const }, { key: 'gd_17_18' as const }, { key: 'gd_19_20' as const }],
    }
    const ctx = knCampContext(provisions({ attunementCrystals: 1 }), domain)

    expect(ctx).toMatchObject({ checkPenalty: 2, attuneBlocked: true })
    expect(knPreviewCamp(plan({ attune: 1 }), ctx).issues).toContainEqual({ type: 'attuneBlocked' })
    expect(knCampContext(provisions(), emptyKnDomain(1))).toMatchObject({ checkPenalty: 0, attuneBlocked: false })
  })
})

describe('fin du camp', () => {
  it('test réussi avec une Ration : bénéfices complets, coûts et provisions appliqués', () => {
    const outcome = knFinishCamp(plan({ barricade: 2 }), state(), context({ rations: 1, craftingSupplies: 5 }), 3, rolls([4, 3]))!

    expect(outcome).toMatchObject({ total: 13, success: true, halved: false, sanityRoll: 3 })
    expect(outcome.state).toEqual({ toughness: 20, health: 4, sanity: 7, exhaustion: 4 })
    expect(outcome.gains).toEqual({ toughness: 15, health: 1, sanity: 3, exhaustion: -8 })
    expect(outcome.provisions).toEqual(provisions({ rations: 0, craftingSupplies: 3 }))
  })

  it('test raté : les bénéfices sont réduits de moitié, arrondis à l\'inférieur', () => {
    const outcome = knFinishCamp(plan({ barricade: 2 }), state(), context({ rations: 1, craftingSupplies: 2 }), 1, rolls([4, 3]))!

    expect(outcome).toMatchObject({ total: 11, success: false, halved: true })
    expect(outcome.state).toEqual({ toughness: 12, health: 3, sanity: 5, exhaustion: 9 })
  })

  it('sans Ration, même réussi, les bénéfices sont réduits de moitié', () => {
    const outcome = knFinishCamp(plan(), state(), context(), 20, rolls([4, 4]))!

    expect(outcome).toMatchObject({ success: true, hasRation: false, halved: true })
    expect(outcome.state).toEqual({ toughness: 12, health: 3, sanity: 6, exhaustion: 7 })
  })

  it('Dormir ajoute ses effets sans les réduire ; la Pourriture au stade 5 ajoute un D4 de Santé', () => {
    const outcome = knFinishCamp(
      plan({}, { sleep: true }),
      state({ toughness: 20, health: 1, sanity: 12, exhaustion: 20, rotStage: 5 }),
      context({ rations: 1 }),
      10,
      rolls([4, 3], [4, 4]),
    )!

    expect(outcome).toMatchObject({ total: 12, success: true, sanityRoll: 3, rotHealthRoll: 4 })
    expect(outcome.state).toEqual({ toughness: 20, health: 7, sanity: 12, exhaustion: 5 })
  })

  it('réduit aussi le D4 de la Pourriture quand les bénéfices sont réduits', () => {
    const outcome = knFinishCamp(plan(), state({ rotStage: 5, health: 2 }), context(), 20, rolls([4, 1], [4, 4]))!

    expect(outcome.state.health).toBe(4)
  })

  it('n\'a pas de tirage de Pourriture avant le stade 5', () => {
    const outcome = knFinishCamp(plan(), state({ rotStage: 4 }), context({ rations: 1 }), 20, rolls([4, 1]))!

    expect(outcome.rotHealthRoll).toBeUndefined()
  })

  it('ne dépasse pas les maximums, ne descend pas sous 0 d\'Épuisement et garde une valeur déjà au-dessus d\'un maximum', () => {
    const outcome = knFinishCamp(
      plan(),
      state({ toughness: 30, toughnessMax: 20, health: 10, sanity: 12, exhaustion: 3 }),
      context({ rations: 1 }),
      20,
      rolls([4, 4]),
    )!

    expect(outcome.state).toEqual({ toughness: 30, health: 10, sanity: 12, exhaustion: 0 })
    expect(outcome.gains).toMatchObject({ toughness: 0, health: 0, sanity: 0, exhaustion: -3 })
  })

  it('refuse de finir un camp qui a un problème', () => {
    expect(knFinishCamp(plan({ torches: 1 }), state(), context(), 20)).toBeNull()
    expect(knFinishCamp(plan({ attune: 1 }), state(), context({ attunementCrystals: 1 }, { attuneBlocked: true }), 20)).toBeNull()
  })

  it('ne modifie pas les provisions d\'origine', () => {
    const ctx = context({ rations: 1, craftingSupplies: 5 })
    knFinishCamp(plan({ barricade: 2 }), state(), ctx, 20, rolls([4, 1]))

    expect(ctx.provisions).toEqual(provisions({ rations: 1, craftingSupplies: 5 }))
  })
})

import { describe, it, expect } from 'vitest'
import {
  emptyKnCampPlan,
  emptyKnProvisions,
  knCampContext,
  knFinishCamp,
  knPreviewCamp,
  type KnCampTraitActivity,
} from '../../shared/ker-nethalas/camp'
import { knMasteriesContentSchema, type KnCampActivity } from '../../shared/ker-nethalas/masteries'
import { knCampRecoverEffects, knCampTraits } from '../../shared/ker-nethalas/masteryEffects'
import { emptyKnDomain } from '../../shared/ker-nethalas/run'
import { fakeMastery } from '../fixtures/knMasteries'

const pray: KnCampActivity = {
  name: 'Prier',
  exhaustion: 2,
  check: -1,
  recover: [{ kind: 'recover', vital: 'sanity', dice: { count: 1, sides: 4, bonus: 0 } }],
}
const prepare: KnCampActivity = {
  name: 'Préparer',
  exhaustion: 0,
  check: -4,
  quantity: true,
  consumes: { craftingSupplies: 1 },
  produces: { ritualComponents: 1 },
}
const traits = (...entries: [string, KnCampActivity][]): KnCampTraitActivity[] => entries.map(([key, activity]) => ({ key, activity }))

const context = (over: Partial<ReturnType<typeof knCampContext>> = {}, supplies = 10) =>
  ({ ...knCampContext({ ...emptyKnProvisions(), rations: 1, craftingSupplies: supplies }, emptyKnDomain(1), { activities: traits(['alpha', pray], ['beta', prepare]) }), ...over })

const plan = (traitActivities: Record<string, number>, over = {}) => ({ ...emptyKnCampPlan(), traitActivities, ...over })

describe('format d\'une activité de camp dans le contenu', () => {
  const withCamp = (campActivity: unknown, campCheck?: number) => {
    const base = fakeMastery('alpha')
    return [{ ...base, feature: { ...base.feature, campActivity }, abilities: base.abilities.map(a => a.tier === 1 ? { ...a, campCheck } : a) }]
  }

  it('accepte une activité avec provisions et effets sur soi, et un bonus d\'aptitude', () => {
    expect(knMasteriesContentSchema.safeParse(withCamp(prepare, 2)).success).toBe(true)
    expect(knMasteriesContentSchema.safeParse(withCamp(pray)).success).toBe(true)
  })

  it('refuse une provision inconnue et un modificateur démesuré', () => {
    expect(knMasteriesContentSchema.safeParse(withCamp({ ...prepare, consumes: { gold: 1 } })).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse(withCamp({ ...prepare, check: -99 })).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse(withCamp(pray, 99)).success).toBe(false)
  })
})

describe('activités de camp apportées par les traits', () => {
  it('l\'Épuisement et le test se paient une fois, la quantité ne change que les provisions', () => {
    const one = knPreviewCamp(plan({ beta: 1 }), context())
    const four = knPreviewCamp(plan({ beta: 4 }), context())

    expect(one).toMatchObject({ exhaustionCost: 0, checkModifier: -4 })
    expect(four).toMatchObject({ exhaustionCost: 0, checkModifier: -4 })
    expect(one.provisions).toMatchObject({ craftingSupplies: 9, ritualComponents: 1 })
    expect(four.provisions).toMatchObject({ craftingSupplies: 6, ritualComponents: 4 })
  })

  it('une activité sans quantité coûte son Épuisement et son modificateur', () => {
    expect(knPreviewCamp(plan({ alpha: 1 }), context())).toMatchObject({ exhaustionCost: 2, checkModifier: -1 })
    expect(knPreviewCamp(plan({ alpha: 0 }), context())).toMatchObject({ exhaustionCost: 0, checkModifier: 0 })
  })

  it('signale le manque de Fournitures, comme pour les activités du livre', () => {
    const preview = knPreviewCamp(plan({ beta: 4 }), context({}, 2))

    expect(preview.issues).toEqual([{ type: 'shortage', key: 'craftingSupplies', missing: 2 }])
  })

  it('Dormir interdit aussi une activité de trait', () => {
    expect(knPreviewCamp(plan({ alpha: 1 }, { sleep: true }), context()).issues).toEqual([{ type: 'sleepExclusive' }])
    expect(knPreviewCamp(plan({}, { sleep: true }), context()).issues).toEqual([])
  })

  it('le bonus d\'aptitude s\'ajoute au test de Camp', () => {
    const ctx = { ...context(), traitCheckBonus: 2 }

    expect(knPreviewCamp(plan({}), ctx).checkModifier).toBe(2)
    expect(knPreviewCamp(plan({ beta: 1 }), ctx).checkModifier).toBe(-2)
  })

  it('un camp sans trait se calcule comme avant', () => {
    const bare = knCampContext({ ...emptyKnProvisions(), rations: 1 }, emptyKnDomain(1))

    expect(bare).toMatchObject({ traitActivities: [], traitCheckBonus: 0 })
    expect(knPreviewCamp(emptyKnCampPlan(), bare)).toMatchObject({ exhaustionCost: 0, checkModifier: 0, issues: [] })
  })

  it('la fin du camp garde les composants produits', () => {
    const outcome = knFinishCamp(
      plan({ beta: 3 }),
      { toughness: 5, toughnessMax: 25, health: 10, healthMax: 15, sanity: 8, sanityMax: 14, exhaustion: 0, rotStage: 0 },
      context(),
      15,
      () => 0.5,
    )

    expect(outcome?.provisions).toMatchObject({ craftingSupplies: 7, ritualComponents: 3 })
  })
})

describe('ce que les Maîtrises ajoutent au camp', () => {
  const rich = (() => {
    const base = fakeMastery('alpha')
    return {
      ...base,
      feature: { ...base.feature, campActivity: pray },
      abilities: base.abilities.map(a => a.tier === 3 ? { ...a, campCheck: 2 } : a),
    }
  })()

  it('l\'activité du trait dès que la Maîtrise est possédée, le bonus quand l\'aptitude est débloquée', () => {
    expect(knCampTraits([rich], [{ key: 'alpha', tiers: 1, amulet: false }])).toEqual({ activities: [{ key: 'alpha', activity: pray }], checkBonus: 0 })
    expect(knCampTraits([rich], [{ key: 'alpha', tiers: 3, amulet: false }]).checkBonus).toBe(2)
    expect(knCampTraits([rich], [{ key: 'omega', tiers: 5, amulet: false }])).toEqual({ activities: [], checkBonus: 0 })
  })

  it('les effets sur soi ne sortent que des activités réellement faites', () => {
    const activities = traits(['alpha', pray], ['beta', prepare])

    expect(knCampRecoverEffects(activities, { alpha: 1 })).toEqual(pray.recover)
    expect(knCampRecoverEffects(activities, { alpha: 0, beta: 3 })).toEqual([])
    expect(knCampRecoverEffects(activities, {})).toEqual([])
  })
})

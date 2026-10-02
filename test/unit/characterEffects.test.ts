import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import {
  activeItemEffectSources,
  activeTemporaryEffectSources,
  asiEffectsOf,
  featureEffectsOf,
  speciesEffectsOf,
  type EffectInputsSheet,
} from '../../shared/rules/characterEffects'
import { computeAbilityScores } from '../../shared/rules/abilityScores'

const conUp = (amount: number): Effect => ({ type: 'ability_increase', value: { ability: 'con', amount } })
const withEffects = (featureType: string, effects: Effect[], extra: Record<string, unknown> = {}) => ({
  featureType,
  featureEffects: effects.map(effect => ({ effect })),
  ...extra,
})

describe('speciesEffectsOf', () => {
  it('rassemble les effets de tous les traits d\'espèce', () => {
    const sheet: EffectInputsSheet = {
      species: { speciesFeatures: [{ feature: withEffects('species_trait', [conUp(2)]) }, { feature: withEffects('species_trait', [conUp(1)]) }] },
    }
    expect(speciesEffectsOf(sheet)).toEqual([conUp(2), conUp(1)])
  })

  it('ignore une fiche sans espèce', () => {
    expect(speciesEffectsOf({ species: null })).toEqual([])
    expect(speciesEffectsOf(undefined)).toEqual([])
  })
})

describe('featureEffectsOf', () => {
  const classes = [{ classId: 1, level: 4, subclass: { id: 9 } }]

  it('n\'applique un trait de classe qu\'une fois son niveau atteint', () => {
    const sheet: EffectInputsSheet = {
      classes,
      features: [
        { feature: withEffects('class_feature', [conUp(1)], { classId: 1, levelRequired: 4 }) },
        { feature: withEffects('class_feature', [conUp(2)], { classId: 1, levelRequired: 5 }) },
      ],
    }
    expect(featureEffectsOf(sheet)).toEqual([conUp(1)])
  })

  it('rattache un trait de sous-classe à la sous-classe choisie', () => {
    const sheet: EffectInputsSheet = {
      classes,
      features: [
        { feature: withEffects('subclass_feature', [conUp(1)], { subclassId: 9, levelRequired: 3 }) },
        { feature: withEffects('subclass_feature', [conUp(2)], { subclassId: 10, levelRequired: 3 }) },
      ],
    }
    expect(featureEffectsOf(sheet)).toEqual([conUp(1)])
  })

  it('résout le choix d\'un don à choix de caractéristique', () => {
    const half: Effect = { type: 'ability_increase_choice', value: { count: 1, amount: 1, abilities: ['con', 'str'] } }
    const sheet: EffectInputsSheet = {
      classes,
      features: [{ feature: withEffects('feat', [half]), choices: { ability: 'con' } }],
    }
    expect(featureEffectsOf(sheet)).toEqual([conUp(1)])
  })

  it('applique d\'office les invocations et les traits d\'espèce portés par la fiche', () => {
    const sheet: EffectInputsSheet = {
      classes,
      features: [{ feature: withEffects('eldritch_invocation', [conUp(1)]) }, { feature: withEffects('species_trait', [conUp(1)]) }],
    }
    expect(featureEffectsOf(sheet)).toHaveLength(2)
  })
})

describe('asiEffectsOf', () => {
  it('ne retient que les ASI dont le niveau de classe est atteint', () => {
    const sheet: EffectInputsSheet = {
      classes: [{ classId: 1, level: 5 }],
      abilityScoreImprovements: [
        { classId: 1, classLevel: 4, ability: 'con', amount: 2 },
        { classId: 1, classLevel: 8, ability: 'con', amount: 2 },
        { classId: 2, classLevel: 1, ability: 'con', amount: 2 },
      ],
    }
    expect(asiEffectsOf(sheet)).toEqual([conUp(2)])
  })
})

describe('activeItemEffectSources', () => {
  const item = (over: Record<string, unknown>) => ({ name: 'Amulette', requiresAttunement: false, effects: [conUp(2)], ...over })

  it('exige l\'équipement', () => {
    expect(activeItemEffectSources([{ equipped: false, attuned: true, item: item({}) }])).toEqual([])
  })

  it('exige le lien quand l\'objet le demande (DMG : sans lien, aucun avantage magique)', () => {
    expect(activeItemEffectSources([{ equipped: true, attuned: false, item: item({ requiresAttunement: true }) }])).toEqual([])
    expect(activeItemEffectSources([{ equipped: true, attuned: true, item: item({ requiresAttunement: true }) }])).toHaveLength(1)
  })

  it('porte le libellé de l\'objet et ignore un objet sans effet', () => {
    expect(activeItemEffectSources([
      { equipped: true, attuned: false, item: item({}) },
      { equipped: true, attuned: false, item: item({ effects: [] }) },
    ])).toEqual([{ label: 'Amulette', effects: [conUp(2)] }])
  })
})

describe('activeTemporaryEffectSources', () => {
  it('ne retient que les effets temporaires actifs', () => {
    const effects = [{ type: 'armor_class_bonus' as const, value: { amount: 2 } }]
    expect(activeTemporaryEffectSources([
      { id: 1, name: 'Bouclier de la foi', active: true, effects },
      { id: 2, name: 'Éteint', active: false, effects },
    ])).toEqual([{ label: 'Bouclier de la foi', effects }])
  })
})

describe('computeAbilityScores', () => {
  const sources = (over: Partial<Parameters<typeof computeAbilityScores>[0]> = {}) => ({
    base: { con: 14 },
    speciesEffects: [],
    featureEffects: [],
    asiEffects: [],
    activeEffects: [],
    ...over,
  })

  it('décompose espèce, don et ASI, et vaut 10 sans score de base', () => {
    const scores = computeAbilityScores(sources({ speciesEffects: [conUp(2)], featureEffects: [conUp(1)], asiEffects: [conUp(2)] }))
    expect(scores.con).toEqual({ base: 14, species: 2, feature: 1, asi: 2, bonus: 5, maximum: 20, capped: 0, items: 0, total: 19 })
    expect(scores.str.total).toBe(10)
  })

  it('applique un objet porté au-delà du score naturel', () => {
    const scores = computeAbilityScores(sources({ activeEffects: [{ type: 'ability_score_set', value: { ability: 'con', score: 19 } }] }))
    expect(scores.con).toMatchObject({ items: 5, total: 19 })
  })

  it('relève le maximum avec ability_max_increase', () => {
    const maxUp: Effect = { type: 'ability_max_increase', value: { ability: 'con', amount: 2 } }
    const scores = computeAbilityScores(sources({ base: { con: 20 }, speciesEffects: [conUp(2)], featureEffects: [maxUp] }))
    expect(scores.con).toMatchObject({ maximum: 22, total: 22 })
  })
})

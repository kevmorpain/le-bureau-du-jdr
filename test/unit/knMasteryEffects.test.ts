import { describe, it, expect } from 'vitest'
import { knMasteriesContentSchema } from '../../shared/ker-nethalas/masteries'
import {
  knAbilityBlockers,
  knAbilityIsPassive,
  knCostSummary,
  knMasteryProvidesLight,
  knMasterySources,
  knPayAbility,
  knSustainBlockers,
  knSustainedKey,
  knToggleSustained,
} from '../../shared/ker-nethalas/masteryEffects'
import { knStatusSchema, emptyKnStatus } from '../../shared/ker-nethalas/status'
import { fakeMastery } from '../fixtures/knMasteries'

const withAbility = (tier: number, patch: Record<string, unknown>, feature?: Record<string, unknown>) => {
  const base = fakeMastery('alpha')
  return {
    ...base,
    feature: { ...base.feature, ...feature },
    abilities: base.abilities.map(ability => ability.tier === tier ? { ...ability, ...patch } : ability),
  }
}

const entry = (key: string, tiers: number, amulet = false) => ({ key, tiers, amulet })

describe('format des effets dans le contenu', () => {
  it('accepte des coûts, un drapeau de lumière et des effets, tous optionnels', () => {
    const mastery = withAbility(1, { exhaustion: 2, health: 1, light: true, effects: [{ kind: 'modifier', target: 'endurance', amount: 10 }] },
      { effects: [{ kind: 'advantage', target: 'perception' }, { kind: 'maxVital', vital: 'sanity', amount: -5 }] })

    expect(knMasteriesContentSchema.safeParse([mastery]).success).toBe(true)
    expect(knMasteriesContentSchema.safeParse([fakeMastery('alpha')]).success).toBe(true)
  })

  it('refuse un effet visant une cible inconnue, et un coût négatif', () => {
    expect(knMasteriesContentSchema.safeParse([withAbility(1, { effects: [{ kind: 'modifier', target: 'luck', amount: 1 }] })]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([withAbility(1, { exhaustion: -1 })]).success).toBe(false)
    expect(knMasteriesContentSchema.safeParse([withAbility(1, {}, { effects: [{ kind: 'maxVital', vital: 'mana', amount: 1 }] })]).success).toBe(false)
  })
})

describe('aptitudes Maintenues du survivant', () => {
  it('l\'état en cours accepte une liste d\'aptitudes allumées, et son absence', () => {
    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), sustained: ['alpha:2'] }).success).toBe(true)
    expect(knStatusSchema.safeParse(emptyKnStatus()).success).toBe(true)
    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), sustained: ['alpha:6'] }).success).toBe(false)
    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), sustained: ['Alpha Beta:2'] }).success).toBe(false)
  })

  it('allume et éteint une aptitude sans toucher à la liste d\'origine', () => {
    const original = ['alpha:2']

    expect(knToggleSustained(original, 'alpha:3')).toEqual(['alpha:2', 'alpha:3'])
    expect(knToggleSustained(original, 'alpha:2')).toEqual([])
    expect(original).toEqual(['alpha:2'])
    expect(knSustainedKey('alpha', 2)).toBe('alpha:2')
  })
})

describe('sources apportées par les Maîtrises', () => {
  const featured = withAbility(3, { effects: [{ kind: 'maxVital', vital: 'sanity', amount: -5 }] }, {
    effects: [{ kind: 'modifier', target: 'endurance', amount: 10 }],
  })

  it('le trait agit dès que la Maîtrise est possédée, même sans palier pour une amulette', () => {
    const sources = knMasterySources([featured], [entry('alpha', 0, true)], [])

    expect(sources).toHaveLength(1)
    expect(sources[0]!.effects).toEqual([{ type: 'modifier', targets: ['endurance'], amount: 10 }])
  })

  it('les effets d\'une aptitude ne s\'appliquent qu\'une fois son palier débloqué', () => {
    expect(knMasterySources([featured], [entry('alpha', 2)], [])).toHaveLength(1)

    const unlocked = knMasterySources([featured], [entry('alpha', 3)], [])
    expect(unlocked.map(source => source.id)).toEqual(['mastery:alpha:feature', 'mastery:alpha:3'])
    expect(unlocked[1]!.effects).toEqual([{ type: 'maxVitalDelta', vital: 'sanity', amount: -5 }])
  })

  it('une aptitude Maintenue ne réduit l\'Éther maximum que lorsqu\'elle est allumée', () => {
    const mastery = fakeMastery('alpha')
    const off = knMasterySources([mastery], [entry('alpha', 2)], [])
    const on = knMasterySources([mastery], [entry('alpha', 2)], ['alpha:2'])

    expect(off).toEqual([])
    expect(on).toHaveLength(1)
    expect(on[0]!.effects).toEqual([{ type: 'maxVitalDelta', vital: 'aether', amount: -5 }])
    expect(on[0]!.label).toEqual({ text: 'Aptitude 2' })
  })

  it('une aptitude allumée mais pas débloquée, ou d\'une Maîtrise inconnue, n\'apporte rien', () => {
    expect(knMasterySources([fakeMastery('alpha')], [entry('alpha', 1)], ['alpha:2'])).toEqual([])
    expect(knMasterySources([fakeMastery('alpha')], [entry('omega', 5)], ['omega:2'])).toEqual([])
  })

  it('cumule les effets de l\'aptitude Maintenue et son coût en Éther', () => {
    const mastery = withAbility(2, { effects: [{ kind: 'modifier', target: 'spellward', amount: 20 }] })
    const [source] = knMasterySources([mastery], [entry('alpha', 2)], ['alpha:2'])

    expect(source!.effects).toEqual([
      { type: 'maxVitalDelta', vital: 'aether', amount: -5 },
      { type: 'modifier', targets: ['spellward'], amount: 20 },
    ])
  })
})

describe('lumière apportée par une aptitude', () => {
  const lamp = withAbility(2, { light: true })

  it('dispense de source de lumière quand l\'aptitude Maintenue est allumée et débloquée', () => {
    expect(knMasteryProvidesLight([lamp], [entry('alpha', 2)], ['alpha:2'])).toBe(true)
    expect(knMasteryProvidesLight([lamp], [entry('alpha', 2)], [])).toBe(false)
    expect(knMasteryProvidesLight([lamp], [entry('alpha', 1)], ['alpha:2'])).toBe(false)
    expect(knMasteryProvidesLight([fakeMastery('alpha')], [entry('alpha', 5)], ['alpha:2'])).toBe(false)
  })

  it('une aptitude de lumière non Maintenue agit dès qu\'elle est débloquée', () => {
    expect(knMasteryProvidesLight([withAbility(1, { light: true })], [entry('alpha', 1)], [])).toBe(true)
  })
})

describe('utiliser une aptitude', () => {
  const ability = { ...fakeMastery('alpha').abilities[0]!, aether: 4, exhaustion: 2, health: 1 }
  const purse = { aetherCurrent: 10, healthCurrent: 12, exhaustion: 3 }

  it('l\'Éther actuel doit couvrir le coût', () => {
    expect(knAbilityBlockers(ability, purse)).toEqual([])
    expect(knAbilityBlockers(ability, { ...purse, aetherCurrent: 3 })).toEqual(['Éther insuffisant'])
    expect(knAbilityBlockers({ ...ability, aether: null }, { ...purse, aetherCurrent: 0 })).toEqual([])
  })

  it('une aptitude Maintenue demande que l\'Éther maximum absorbe son coût', () => {
    expect(knSustainBlockers(ability, 20)).toEqual([])
    expect(knSustainBlockers(ability, 3)).toEqual(['Éther maximum insuffisant'])
  })

  it('paie l\'Éther et la Santé, ajoute l\'Épuisement, sans aller sous zéro ni au-delà du maximum', () => {
    expect(knPayAbility(ability, purse)).toEqual({ aetherCurrent: 6, healthCurrent: 11, exhaustion: 5 })
    expect(knPayAbility(ability, { aetherCurrent: 2, healthCurrent: 0, exhaustion: 99 })).toEqual({ aetherCurrent: 0, healthCurrent: 0, exhaustion: 99 })
    expect(knPayAbility({ ...ability, aether: null, exhaustion: undefined, health: undefined }, purse)).toEqual(purse)
  })

  it('résume le coût, et reconnaît une aptitude passive', () => {
    expect(knCostSummary(ability)).toBe('−4 Éther, −1 Santé, +2 Épuisement')
    expect(knCostSummary({ aether: null })).toBe('')
    expect(knAbilityIsPassive({ action: 'Passif' })).toBe(true)
    expect(knAbilityIsPassive({ action: '1 Action Standard' })).toBe(false)
  })
})

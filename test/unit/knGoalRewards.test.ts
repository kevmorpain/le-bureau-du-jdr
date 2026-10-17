import { describe, it, expect } from 'vitest'
import { emptyKnMadness } from '../../shared/ker-nethalas/catalog/madness'
import type { KnDamageInput } from '../../shared/ker-nethalas/combat'
import { knResolveDamage } from '../../shared/ker-nethalas/combat'
import { knAttackOptions } from '../../shared/ker-nethalas/equipment'
import {
  knActivePerks,
  knGoalAttackDice,
  knGoalCriticalTriple,
  knGoalEffectEntriesSchema,
  knGoalEffectSchema,
  knGoalReductions,
  knGoalSources,
  knHasActivePerk,
  knMergeReductions,
  type KnGoalEffect,
  type KnGoalEffectEntry,
} from '../../shared/ker-nethalas/goalEffects'
import { knClaimGoalReward, knUnclaimGoalReward, type KnGoalSheet } from '../../shared/ker-nethalas/goalRewards'
import { knGoalPicksSchema, knNewGoalPick, type KnPersonalGoal } from '../../shared/ker-nethalas/goals'
import type { KnItem } from '../../shared/ker-nethalas/inventory'

const goal = (key: string, effect?: KnGoalEffect, over: Partial<KnPersonalGoal> = {}): KnPersonalGoal => ({
  key,
  name: key,
  objective: 'objectif',
  target: 3,
  reward: `récompense ${key}`,
  ...(effect ? { effect } : {}),
  ...over,
})

const sheet = (over: Partial<KnGoalSheet> = {}): KnGoalSheet => ({
  xp: 100,
  healthMax: 12,
  healthCurrent: 9,
  toughnessMax: 25,
  toughnessCurrent: 25,
  aetherMax: 10,
  aetherCurrent: 4,
  sanityMax: 11,
  sanityCurrent: 11,
  goalPicks: [{ ...knNewGoalPick('a'), progress: 3 }],
  goalEffects: [],
  ...over,
})

const ok = (result: ReturnType<typeof knClaimGoalReward>) => {
  if ('error' in result) throw new Error(`erreur : ${result.error}`)
  return result
}

const die = (sides: number, result: number) => () => (result - 0.5) / sides

describe('récupérer la récompense d\'un objectif', () => {
  it('refuse tant que la cible n\'est pas atteinte, ou si l\'objectif est déjà récupéré', () => {
    expect(knClaimGoalReward(sheet({ goalPicks: [knNewGoalPick('a')] }), goal('a'))).toEqual({ error: 'notReached' })
    expect(knClaimGoalReward(sheet({ goalPicks: [{ ...knNewGoalPick('a'), progress: 3, claimed: true }] }), goal('a'))).toEqual({ error: 'notReached' })
    expect(knClaimGoalReward(sheet(), goal('inconnu'))).toEqual({ error: 'notReached' })
  })

  it('sans effet typé, l\'objectif passe en récupéré et rien d\'autre ne bouge', () => {
    const { patch, lines, amulet } = ok(knClaimGoalReward(sheet(), goal('a')))

    expect(patch).toEqual({ goalPicks: [{ key: 'a', progress: 3, claimed: true }] })
    expect(lines).toEqual([])
    expect(amulet).toBe(false)
  })

  it('un effet durable rejoint la fiche, un seul par objectif', () => {
    const perk: KnGoalEffect = { kind: 'perk', perk: 'scholar' }
    const first = ok(knClaimGoalReward(sheet(), goal('a', perk)))

    expect(first.patch.goalEffects).toEqual([{ goal: 'a', effect: perk }])
    expect(knHasActivePerk({ perkKeys: [], goalEffects: first.patch.goalEffects! }, 'scholar')).toBe(true)
    expect(knActivePerks(['scavenger'], first.patch.goalEffects!)).toEqual(['scavenger', 'scholar'])
  })

  it('la Mémoire défaillante réduit l\'XP de la récompense', () => {
    const forgetful = { madness: { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, forgetfulness: 2 } } }
    const { patch, lines } = ok(knClaimGoalReward(sheet({ status: forgetful }), goal('a', { kind: 'xp', amount: 100 })))

    expect(patch.xp).toBe(180)
    expect(lines).toEqual(['+80 XP (100 moins la Mémoire défaillante)'])
  })

  it('l\'XP se donne une fois, même après une annulation suivie d\'une nouvelle récupération', () => {
    const effect: KnGoalEffect = { kind: 'xp', amount: 100 }
    const first = ok(knClaimGoalReward(sheet(), goal('a', effect)))
    expect(first.patch).toMatchObject({ xp: 200, goalPicks: [{ key: 'a', claimed: true, granted: true }] })
    expect(first.lines).toEqual(['+100 XP'])

    const reopened = knUnclaimGoalReward({ goalPicks: first.patch.goalPicks!, goalEffects: [] }, 'a')
    const again = ok(knClaimGoalReward(sheet({ goalPicks: reopened.goalPicks, xp: 200 }), goal('a', effect)))

    expect(again.patch.xp).toBeUndefined()
    expect(again.lines).toEqual([])
  })

  it('un dé de jauge s\'ajoute au maximum et à la valeur actuelle', () => {
    const { patch, lines } = ok(knClaimGoalReward(sheet(), goal('a', { kind: 'maxVital', vital: 'aether', dice: { count: 1, sides: 4, bonus: 0 } }), die(4, 3)))

    expect(patch).toMatchObject({ aetherMax: 13, aetherCurrent: 7 })
    expect(lines).toEqual(['Éther maximale +3'])
  })

  it('une amulette est signalée à l\'appelant, qui tire la Maîtrise', () => {
    expect(ok(knClaimGoalReward(sheet(), goal('a', { kind: 'amulet' }))).amulet).toBe(true)
  })

  it('une note garde le texte de la récompense comme rappel', () => {
    const { patch } = ok(knClaimGoalReward(sheet(), goal('a', { kind: 'note' })))

    expect(patch.goalEffects).toEqual([{ goal: 'a', effect: { kind: 'note' }, text: 'récompense a' }])
    expect(knGoalSources(patch.goalEffects!)).toEqual([
      { id: 'goalEffects', label: { text: 'Récompenses d\'objectifs' }, effects: [], reminders: [{ label: { text: 'récompense a' }, severity: 'info' }] },
    ])
    expect(knGoalSources([])).toEqual([])
  })

  it('annuler retire les effets durables, mais seulement si l\'objectif peut être rouvert', () => {
    const effects: KnGoalEffectEntry[] = [{ goal: 'a', effect: { kind: 'perk', perk: 'scholar' } }]
    const picks = [{ key: 'a', progress: 3, claimed: true }]
    const full = [...picks, { ...knNewGoalPick('b') }, { ...knNewGoalPick('c') }]

    expect(knUnclaimGoalReward({ goalPicks: picks, goalEffects: effects }, 'a')).toEqual({ goalPicks: [{ key: 'a', progress: 3, claimed: false }], goalEffects: [] })
    expect(knUnclaimGoalReward({ goalPicks: full, goalEffects: effects }, 'a').goalEffects).toEqual(effects)
  })
})

describe('effets durables des objectifs', () => {
  const entries = (...effects: KnGoalEffect[]): KnGoalEffectEntry[] => effects.map((effect, index) => ({ goal: `g${index}`, effect }))
  const sword: KnItem = { id: 'i1', name: 'Épée', kind: 'weapon', weight: 'normal', quantity: 1, place: 'mainHand', weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [] } }

  it('les réductions de dégâts se cumulent par type, avec celles de l\'équipement', () => {
    const goals = knGoalReductions(entries({ kind: 'reduction', damage: 'acid', amount: 1 }, { kind: 'reduction', damage: 'acid', amount: 1 }, { kind: 'reduction', damage: 'force', amount: 1 }))

    expect(goals).toEqual({ acid: 2, force: 1 })
    expect(knMergeReductions({ acid: 1, fire: 2 }, goals)).toEqual({ acid: 3, fire: 2, force: 1 })
  })

  it('un bonus d\'arme ne vaut que pour sa compétence, un dé d\'attaque pour toutes', () => {
    const goals = entries({ kind: 'weaponBonus', skill: 'bladedWeapons', amount: 1 }, { kind: 'attackDice', dice: { count: 1, sides: 4, bonus: 0 }, damage: 'psychic' })

    expect(knGoalAttackDice(goals, 'bladedWeapons')).toHaveLength(2)
    expect(knGoalAttackDice(goals, 'unarmedCombat')).toEqual([{ dice: { count: 1, sides: 4, bonus: 0 }, type: 'psychic' }])

    const [weapon, unarmed] = knAttackOptions([sword], [], goals)
    const typed = [{ count: 1, sides: 4, bonus: 0, type: 'psychic' }]

    expect(weapon).toMatchObject({ pool: 'D6+1', typed })
    expect(unarmed).toMatchObject({ id: 'unarmed', pool: 'D4', typed })
    expect(knAttackOptions([sword]).map(option => option.pool)).toEqual(['D6', 'D4'])
  })

  it('un Coup critique triple les dégâts contre le type visé seulement', () => {
    const goals = entries({ kind: 'criticalTriple', creature: 'undead' })
    const input: KnDamageInput = {
      roll: { dice: [], bonus: 0, picked: 5, total: 5 },
      damageType: 'slashing',
      criticalStrike: true,
      weakSpot: false,
      armor: 0,
      target: { vulnerable: [], resistant: [], restored: [] },
    }

    expect(knGoalCriticalTriple(goals, ['undead'])).toBe(true)
    expect(knGoalCriticalTriple(goals, ['humanoid'])).toBe(false)
    expect(knResolveDamage({ ...input, criticalTriple: true }).damage).toBe(15)
    expect(knResolveDamage({ ...input, criticalTriple: false }).damage).toBe(10)
    expect(knResolveDamage({ ...input, criticalStrike: false, criticalTriple: true }).damage).toBe(5)
  })
})

describe('format', () => {
  it('chaque sorte d\'effet se valide, et un effet inconnu est refusé', () => {
    const effects: KnGoalEffect[] = [
      { kind: 'perk', perk: 'trapBuster' },
      { kind: 'reduction', damage: 'poison', amount: 1 },
      { kind: 'weaponBonus', skill: 'shaftedWeapons', amount: 1 },
      { kind: 'attackDice', dice: { count: 1, sides: 4, bonus: 0 }, damage: 'psychic' },
      { kind: 'criticalTriple', creature: 'plant' },
      { kind: 'xp', amount: 100 },
      { kind: 'amulet' },
      { kind: 'maxVital', vital: 'aether', dice: { count: 1, sides: 4, bonus: 0 } },
      { kind: 'note' },
    ]

    for (const effect of effects) expect(knGoalEffectSchema.safeParse(effect).success).toBe(true)
    expect(knGoalEffectSchema.safeParse({ kind: 'reduction', damage: 'inconnu', amount: 1 }).success).toBe(false)
    expect(knGoalEffectSchema.safeParse({ kind: 'magie' }).success).toBe(false)
    expect(knGoalEffectEntriesSchema.safeParse(effects.map((effect, index) => ({ goal: `g${index}`, effect }))).success).toBe(true)
  })

  it('un objectif récupéré garde la trace de son gain ponctuel', () => {
    expect(knGoalPicksSchema.safeParse([{ key: 'a', progress: 1, claimed: true, granted: true }]).success).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import {
  advantageEffectSources, advantageEligibility, applyRollOverride, isUnderCondition, availableSituations, criticalDamageDiceCount, criticalFrom, factRollSources,
  halfProficiencyBonus, proficientCheckMinimum, rerollTrigger, resolveRollMode, rollD20, saveAutoFailSources,
  type D20Policy, type RollFacts, type RollSource,
} from '../../shared/rules/rolls'

// `rng` scripté : chaque face demandée est rendue dans l'ordre.
const dice = (...faces: number[]) => {
  const queue = [...faces]
  return () => (queue.shift()! - 1) / 20 + 0.001
}

const adv: RollSource = { label: 'A', mode: 'advantage' }
const dis: RollSource = { label: 'D', mode: 'disadvantage' }
const policy = (over: Partial<D20Policy> = {}): D20Policy => ({ sources: [], rerollOn: null, minimum: null, critFrom: 20, ...over })
const facts = (over: Partial<RollFacts> = {}): RollFacts => ({ conditions: [], exhaustion: 0, armorNonProficient: false, stealthArmor: false, ...over })
const labels = (sources: RollSource[]) => sources.map(s => s.label)

describe('resolveRollMode — AideDD, Caractéristiques', () => {
  it('sans source : normal', () => {
    expect(resolveRollMode([]).mode).toBe('normal')
  })

  it('plusieurs avantages ne se cumulent pas', () => {
    expect(resolveRollMode([adv, adv]).mode).toBe('advantage')
  })

  it('un avantage et un désavantage s\'annulent, même à plusieurs d\'un côté', () => {
    expect(resolveRollMode([adv, dis]).mode).toBe('normal')
    expect(resolveRollMode([dis, dis, adv]).mode).toBe('normal')
    expect(resolveRollMode([adv, adv, dis]).mode).toBe('normal')
  })

  it('garde la trace des sources, même annulées', () => {
    expect(resolveRollMode([adv, dis])).toEqual({ mode: 'normal', advantage: ['A'], disadvantage: ['D'] })
  })
})

describe('applyRollOverride', () => {
  it('auto garde les sources, normal les écarte', () => {
    expect(applyRollOverride([dis], 'auto')).toEqual([dis])
    expect(applyRollOverride([dis], 'normal')).toEqual([])
  })

  it('un avantage choisi annule un désavantage automatique', () => {
    expect(resolveRollMode(applyRollOverride([dis], 'advantage')).mode).toBe('normal')
    expect(resolveRollMode(applyRollOverride([], 'disadvantage')).mode).toBe('disadvantage')
  })
})

describe('factRollSources — états, épuisement, armure', () => {
  it('états : désavantage à l\'attaque (À terre, Aveuglé, Effrayé, Empoisonné, Entravé), avantage si Invisible', () => {
    for (const condition of ['prone', 'blinded', 'frightened', 'poisoned', 'restrained'] as const) {
      expect(resolveRollMode(factRollSources({ type: 'attack', weapon: true }, facts({ conditions: [condition] }))).mode).toBe('disadvantage')
    }
    expect(resolveRollMode(factRollSources({ type: 'attack', weapon: true }, facts({ conditions: ['invisible'] }))).mode).toBe('advantage')
  })

  it('Effrayé et Empoisonné pèsent sur les jets de caractéristique et l\'initiative, pas sur les sauvegardes', () => {
    const f = facts({ conditions: ['poisoned'] })
    expect(labels(factRollSources({ type: 'check', ability: 'wis', skill: 'perception' }, f))).toEqual(['Empoisonné'])
    expect(labels(factRollSources({ type: 'initiative' }, f))).toEqual(['Empoisonné'])
    expect(factRollSources({ type: 'save', ability: 'wis' }, f)).toEqual([])
  })

  it('Entravé : désavantage aux sauvegardes de Dextérité seulement', () => {
    const f = facts({ conditions: ['restrained'] })
    expect(labels(factRollSources({ type: 'save', ability: 'dex' }, f))).toEqual(['Entravé'])
    expect(factRollSources({ type: 'save', ability: 'str' }, f)).toEqual([])
  })

  it('épuisement : 1 → caractéristique, 3 → attaque et sauvegarde (AideDD, États)', () => {
    expect(factRollSources({ type: 'check', ability: 'str' }, facts({ exhaustion: 1 }))).toHaveLength(1)
    expect(factRollSources({ type: 'attack', weapon: true }, facts({ exhaustion: 1 }))).toEqual([])
    expect(factRollSources({ type: 'save', ability: 'con' }, facts({ exhaustion: 2 }))).toEqual([])
    expect(factRollSources({ type: 'attack', weapon: true }, facts({ exhaustion: 3 }))).toHaveLength(1)
    expect(factRollSources({ type: 'save', ability: 'con' }, facts({ exhaustion: 3 }))).toHaveLength(1)
    expect(factRollSources({ type: 'check', ability: 'con' }, facts({ exhaustion: 3 }))).toHaveLength(1)
  })

  it('armure non maîtrisée : seulement les jets basés sur la Force ou la Dextérité (AideDD, Armures)', () => {
    const f = facts({ armorNonProficient: true })
    expect(factRollSources({ type: 'attack', weapon: true }, f)).toHaveLength(1)
    expect(factRollSources({ type: 'attack', weapon: false }, f)).toEqual([])
    expect(factRollSources({ type: 'initiative' }, f)).toHaveLength(1)
    expect(factRollSources({ type: 'check', ability: 'str', skill: 'athletics' }, f)).toHaveLength(1)
    expect(factRollSources({ type: 'save', ability: 'dex' }, f)).toHaveLength(1)
    expect(factRollSources({ type: 'check', ability: 'wis', skill: 'perception' }, f)).toEqual([])
    expect(factRollSources({ type: 'save', ability: 'int' }, f)).toEqual([])
  })

  it('armure à Discrétion désavantageuse : seulement le jet de Discrétion', () => {
    const f = facts({ stealthArmor: true })
    expect(factRollSources({ type: 'check', ability: 'dex', skill: 'stealth' }, f)).toHaveLength(1)
    expect(factRollSources({ type: 'check', ability: 'dex', skill: 'acrobatics' }, f)).toEqual([])
    expect(factRollSources({ type: 'check', ability: 'dex' }, f)).toEqual([])
  })

  it('reprend les sources propres à l\'arme', () => {
    const extra: RollSource = { label: 'Arme lourde + Petite taille', mode: 'disadvantage' }
    expect(factRollSources({ type: 'attack', weapon: true, extra: [extra] }, facts())).toEqual([extra])
  })
})

describe('saveAutoFailSources', () => {
  it('Étourdi rate automatiquement Force et Dextérité, pas Sagesse', () => {
    expect(saveAutoFailSources({ type: 'save', ability: 'dex' }, ['stunned'])).toEqual(['Étourdi'])
    expect(saveAutoFailSources({ type: 'save', ability: 'wis' }, ['stunned'])).toEqual([])
    expect(saveAutoFailSources({ type: 'check', ability: 'dex' }, ['stunned'])).toEqual([])
  })
})

describe('advantageEffectSources', () => {
  const rage = { label: 'Rage', effects: [
    { type: 'advantage', value: { rollType: 'check', ability: 'str', condition: '' } },
    { type: 'advantage', value: { rollType: 'saving_throw', ability: 'str', condition: '' } },
  ] satisfies Effect[] }
  const traits = { label: 'Capacités', effects: [
    { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'frightened' } },
    { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration' } },
    { type: 'advantage', value: { rollType: 'initiative', ability: 'all', condition: '' } },
  ] satisfies Effect[] }

  it('un avantage sans condition joue pour la caractéristique visée seulement', () => {
    expect(labels(advantageEffectSources([rage], { type: 'check', ability: 'str', skill: 'athletics' }, []))).toEqual(['Rage'])
    expect(labels(advantageEffectSources([rage], { type: 'save', ability: 'str' }, []))).toEqual(['Rage'])
    expect(advantageEffectSources([rage], { type: 'check', ability: 'dex' }, [])).toEqual([])
    expect(advantageEffectSources([rage], { type: 'attack', weapon: true }, [])).toEqual([])
  })

  it('un avantage conditionnel attend que le joueur désigne la situation', () => {
    const save = { type: 'save', ability: 'wis' } as const
    expect(advantageEffectSources([traits], save, [])).toEqual([])
    expect(labels(advantageEffectSources([traits], save, ['frightened']))).toEqual(['Capacités — contre effrayé'])
  })

  it('le site d\'appel peut fixer la situation (sauvegarde de concentration)', () => {
    const concentration = { type: 'save', ability: 'con', situations: ['concentration'] } as const
    expect(labels(advantageEffectSources([traits], concentration, []))).toEqual(['Capacités — contre concentration'])
  })

  it('l\'initiative lit ses propres effets', () => {
    expect(labels(advantageEffectSources([traits], { type: 'initiative' }, []))).toEqual(['Capacités'])
  })

  it('un avantage aux jets de Dextérité vaut pour l\'initiative', () => {
    const dexterous = { label: 'Bottes', effects: [{ type: 'advantage', value: { rollType: 'check', ability: 'dex', condition: '' } }] satisfies Effect[] }
    expect(labels(advantageEffectSources([dexterous], { type: 'initiative' }, []))).toEqual(['Bottes'])
  })

  it('liste les situations désignables, sans doublon', () => {
    expect(availableSituations([rage, traits, traits])).toEqual(['frightened', 'concentration'])
  })
})

describe('avantage conditionné par l\'état et la portée', () => {
  const dangerSense = { label: 'Capacités', effects: [
    { type: 'advantage', value: { rollType: 'saving_throw', ability: 'dex', condition: 'visible_effects', unless: ['blinded', 'deafened', 'incapacitated'] } },
  ] satisfies Effect[] }
  const reckless = { label: 'Attaque téméraire', effects: [
    { type: 'advantage', value: { rollType: 'attack', ability: 'all', condition: '', scope: 'strength_melee' } },
  ] satisfies Effect[] }
  const dexSave = { type: 'save', ability: 'dex' } as const

  it('Sens du danger : joue contre un effet visible, tant que le personnage n\'est ni aveuglé, ni assourdi, ni incapable d\'agir', () => {
    expect(labels(advantageEffectSources([dangerSense], dexSave, ['visible_effects'], []))).toHaveLength(1)
    expect(advantageEffectSources([dangerSense], dexSave, ['visible_effects'], ['blinded'])).toEqual([])
    expect(advantageEffectSources([dangerSense], dexSave, ['visible_effects'], ['deafened'])).toEqual([])
    expect(advantageEffectSources([dangerSense], dexSave, ['visible_effects'], ['poisoned'])).toHaveLength(1)
  })

  it('« incapable d\'agir » couvre Étourdi, Paralysé, Inconscient et Pétrifié', () => {
    for (const condition of ['stunned', 'paralyzed', 'unconscious', 'petrified', 'incapacitated'] as const) {
      expect(isUnderCondition([condition], 'incapacitated'), condition).toBe(true)
      expect(advantageEffectSources([dangerSense], dexSave, ['visible_effects'], [condition]), condition).toEqual([])
    }
    expect(isUnderCondition(['poisoned'], 'incapacitated')).toBe(false)
    expect(isUnderCondition(['blinded'], 'blinded')).toBe(true)
  })

  it('Attaque téméraire : seulement une attaque de mêlée menée avec la Force', () => {
    const strength = { type: 'attack', weapon: true, strengthMelee: true } as const
    expect(labels(advantageEffectSources([reckless], strength, []))).toEqual(['Attaque téméraire'])
    expect(advantageEffectSources([reckless], { type: 'attack', weapon: true, strengthMelee: false }, [])).toEqual([])
    expect(advantageEffectSources([reckless], { type: 'attack', weapon: true }, [])).toEqual([])
    expect(advantageEffectSources([reckless], { type: 'attack', weapon: false }, [])).toEqual([])
    expect(advantageEffectSources([reckless], { type: 'save', ability: 'str' }, [])).toEqual([])
  })

  it('un avantage d\'attaque sans portée vaut pour toute attaque', () => {
    const any = { label: 'Bague', effects: [{ type: 'advantage', value: { rollType: 'attack', ability: 'all', condition: '' } }] satisfies Effect[] }
    expect(advantageEffectSources([any], { type: 'attack', weapon: false }, [])).toHaveLength(1)
  })
})

describe('advantageEligibility — Attaque sournoise', () => {
  it('avantage : éligible ; désavantage : refusée ; sinon, à confirmer', () => {
    expect(advantageEligibility('advantage')).toBe('eligible')
    expect(advantageEligibility('disadvantage')).toBe('blocked')
    expect(advantageEligibility('normal')).toBe('unconfirmed')
    expect(advantageEligibility(null)).toBe('unconfirmed')
  })
})

describe('effets de capacités', () => {
  it('relance : le plus haut déclencheur', () => {
    expect(rerollTrigger([])).toBeNull()
    expect(rerollTrigger([{ type: 'reroll', value: { rollType: 'd20', trigger: 1 } }])).toBe(1)
  })

  it('Savoir-faire : plancher des jets de compétence maîtrisée', () => {
    expect(proficientCheckMinimum([])).toBeNull()
    expect(proficientCheckMinimum([{ type: 'proficient_check_minimum', value: { minimum: 10 } }])).toBe(10)
  })

  it('plage de critique : 20 par défaut, la plus large l\'emporte', () => {
    expect(criticalFrom([])).toBe(20)
    expect(criticalFrom([{ type: 'critical_range', value: { from: 19 } }, { type: 'critical_range', value: { from: 18 } }])).toBe(18)
  })

  it('demi-maîtrise : arrondi inférieur (Touche-à-tout), supérieur (Athlète accompli), sans cumul', () => {
    const jack: Effect = { type: 'half_proficiency', value: { abilities: 'all', rounding: 'down' } }
    const athlete: Effect = { type: 'half_proficiency', value: { abilities: ['str', 'dex', 'con'], rounding: 'up' } }
    expect(halfProficiencyBonus([jack], 'wis', 3)).toBe(1)
    expect(halfProficiencyBonus([athlete], 'str', 3)).toBe(2)
    expect(halfProficiencyBonus([athlete], 'wis', 3)).toBe(0)
    expect(halfProficiencyBonus([jack, athlete], 'str', 3)).toBe(2)
    expect(halfProficiencyBonus([jack, athlete], 'str', 4)).toBe(2)
    expect(halfProficiencyBonus([], 'str', 4)).toBe(0)
  })
})

describe('rollD20', () => {
  it('jet normal : un seul dé', () => {
    const r = rollD20(policy(), dice(13))
    expect(r).toMatchObject({ dice: [13], kept: 13, used: 13, mode: 'normal', isCrit: false, isFumble: false })
  })

  it('avantage : deux dés, le plus haut', () => {
    expect(rollD20(policy({ sources: [adv] }), dice(4, 17))).toMatchObject({ dice: [4, 17], kept: 17, mode: 'advantage' })
  })

  it('désavantage : deux dés, le plus bas', () => {
    expect(rollD20(policy({ sources: [dis] }), dice(17, 4))).toMatchObject({ dice: [17, 4], kept: 4, mode: 'disadvantage' })
  })

  it('avantage et désavantage annulés : un seul dé', () => {
    expect(rollD20(policy({ sources: [adv, dis] }), dice(9)).dice).toEqual([9])
  })

  it('20 naturel : critique ; 1 naturel : fumble', () => {
    expect(rollD20(policy(), dice(20)).isCrit).toBe(true)
    expect(rollD20(policy(), dice(1)).isFumble).toBe(true)
  })

  it('plage de critique élargie (Champion)', () => {
    expect(rollD20(policy({ critFrom: 19 }), dice(19)).isCrit).toBe(true)
    expect(rollD20(policy({ critFrom: 19 }), dice(18)).isCrit).toBe(false)
    expect(rollD20(policy({ critFrom: 18 }), dice(18)).isCrit).toBe(true)
  })

  it('Chanceux : un 1 est relancé, le second résultat s\'applique', () => {
    const r = rollD20(policy({ rerollOn: 1 }), dice(1, 14))
    expect(r).toMatchObject({ dice: [14], kept: 14, rerolled: { from: 1, to: 14 }, isFumble: false })
  })

  it('Chanceux : le nouveau résultat s\'impose même s\'il est pire (un 1 relancé en 1)', () => {
    const r = rollD20(policy({ rerollOn: 1 }), dice(1, 1))
    expect(r).toMatchObject({ kept: 1, rerolled: { from: 1, to: 1 }, isFumble: true })
  })

  it('Chanceux : pas de relance sans 1', () => {
    expect(rollD20(policy({ rerollOn: 1 }), dice(2)).rerolled).toBeNull()
  })

  it('Chanceux avec avantage : un seul dé est relancé (AideDD)', () => {
    const r = rollD20(policy({ rerollOn: 1, sources: [adv] }), dice(1, 1, 9))
    expect(r.dice).toEqual([9, 1])
    expect(r.rerolled).toEqual({ from: 1, to: 9 })
    expect(r.kept).toBe(9)
  })

  it('Chanceux avec désavantage : on relance le 1 qui sert de résultat', () => {
    const r = rollD20(policy({ rerollOn: 1, sources: [dis] }), dice(15, 1, 12))
    expect(r.dice).toEqual([15, 12])
    expect(r.kept).toBe(12)
  })

  it('Savoir-faire : un résultat de 9 ou moins compte pour 10, sans être un fumble', () => {
    const r = rollD20(policy({ minimum: 10 }), dice(1))
    expect(r).toMatchObject({ kept: 1, used: 10, isFumble: false })
    expect(rollD20(policy({ minimum: 10 }), dice(15)).used).toBe(15)
  })

  it('Savoir-faire avec désavantage : le plancher s\'applique à chaque dé', () => {
    expect(rollD20(policy({ minimum: 10, sources: [dis] }), dice(3, 14)).used).toBe(10)
  })

  it('Chanceux puis Savoir-faire : la relance précède le plancher', () => {
    const r = rollD20(policy({ rerollOn: 1, minimum: 10 }), dice(1, 17))
    expect(r.used).toBe(17)
  })
})

describe('criticalDamageDiceCount — AideDD, Coups critiques', () => {
  it('double les dés', () => {
    expect(criticalDamageDiceCount(1)).toBe(2)
    expect(criticalDamageDiceCount(3)).toBe(6)
  })

  it('Critique brutal ajoute des dés de l\'arme, jamais aux autres dés', () => {
    expect(criticalDamageDiceCount(1, { weaponDie: true, extraWeaponDice: 2 })).toBe(4)
    expect(criticalDamageDiceCount(2, { extraWeaponDice: 2 })).toBe(4)
  })
})

import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { barbareFeatures, BRUTAL_CRITICAL_DICE, DANGER_SENSE_ADVANTAGE, FERAL_INSTINCT_ADVANTAGE, RAGE_ADVANTAGES, RECKLESS_ATTACK_META } from '../../server/db/seeds/data/barbare'
import { bardeFeatures } from '../../server/db/seeds/data/barde'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import { resolveRollMode } from '../../shared/rules/rolls'
import { baseScores, classFeature, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Ce que la fiche demande au lanceur de dés : sources d'avantage et de désavantage, relance, plancher, plage de
// critique, demi-maîtrise. Passe par useCharacterSheet pour garder tout le câblage (états, armure, capacités).

const BARBARIAN = 1
const BARD = 2
const FIGHTER = 3
const ROGUE = 4

const seedEffects = (defs: { name: string, levelRequired?: number | null, effects?: Effect[] }[], name: string, level: number) =>
  defs.find(f => f.name === name && f.levelRequired === level)!.effects ?? []

const champion = guerrierSubclasses.find(s => s.name === 'Champion')!.features

const chainMail = { armor_type: 'heavy', base_ac: 16, dex_limit: 0, strength_requirement: 13, stealth_disadvantage: true }
const leather = { armor_type: 'light', base_ac: 11, dex_limit: null, stealth_disadvantage: false }

const modeOf = (policy: { sources: Parameters<typeof resolveRollMode>[0] }) => resolveRollMode(policy.sources).mode

const rageRow = (active: boolean) => {
  const rage = barbareFeatures.find(f => f.name === 'Rage')!
  const row = classFeature(1, 'Rage', BARBARIAN, 1, [])
  return { ...row, active, feature: { ...row.feature, meta: rage.meta ?? null } } as unknown as ReturnType<typeof classFeature>
}

describe('fiche — avantage et désavantage au jet', () => {
  it('Rage active : avantage aux jets et sauvegardes de Force, pas à ceux de Dextérité', async () => {
    const s = await mount({ scores: baseScores(16, 14, 14, 10), classes: [{ classId: BARBARIAN, level: 3 }], features: [rageRow(true)] })
    const engine = s.rollEngine
    expect(modeOf(engine.policy({ type: 'check', ability: 'str', skill: 'athletics' }, []))).toBe('advantage')
    expect(modeOf(engine.policy({ type: 'save', ability: 'str' }, []))).toBe('advantage')
    expect(modeOf(engine.policy({ type: 'check', ability: 'dex', skill: 'stealth' }, []))).toBe('normal')
    expect(modeOf(engine.policy({ type: 'attack', weapon: true }, []))).toBe('normal')
  })

  it('Rage inactive, ou suspendue par une armure lourde : aucun avantage', async () => {
    const scenario = { scores: baseScores(16, 14, 14, 10), classes: [{ classId: BARBARIAN, level: 3 }] }
    const idle = await mount({ ...scenario, features: [rageRow(false)] })
    expect(modeOf(idle.rollEngine.policy({ type: 'save', ability: 'str' }, []))).toBe('normal')

    const armored = await mount({ ...scenario, features: [rageRow(true)], worn: id => [entry(id, 1, 'Cotte de mailles', 'armor', chainMail)] })
    expect(modeOf(armored.rollEngine.policy({ type: 'save', ability: 'str' }, []))).not.toBe('advantage')
  })

  it('Instinct sauvage : avantage à l\'initiative seulement', async () => {
    const s = await mount({
      scores: baseScores(10, 14, 10, 10),
      classes: [{ classId: BARBARIAN, level: 7 }],
      features: [classFeature(2, 'Instinct sauvage', BARBARIAN, 7, [FERAL_INSTINCT_ADVANTAGE])],
    })
    expect(modeOf(s.rollEngine.policy({ type: 'initiative' }, []))).toBe('advantage')
    expect(modeOf(s.rollEngine.policy({ type: 'check', ability: 'dex', skill: 'stealth' }, []))).toBe('normal')
  })

  it('Empoisonné : désavantage à l\'attaque et aux jets de caractéristique, pas aux sauvegardes', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10) })
    s.toggleCondition('poisoned')
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: true }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'check', ability: 'wis', skill: 'perception' }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'initiative' }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'con' }, []))).toBe('normal')
  })

  it('désavantage de l\'état + avantage de la Rage : les deux s\'annulent', async () => {
    const s = await mount({ scores: baseScores(16, 10, 10, 10), classes: [{ classId: BARBARIAN, level: 3 }], features: [rageRow(true)] })
    s.toggleCondition('poisoned')
    const policy = s.rollEngine.policy({ type: 'check', ability: 'str', skill: 'athletics' }, [])
    expect(resolveRollMode(policy.sources)).toMatchObject({ mode: 'normal', advantage: ['Rage'], disadvantage: ['Empoisonné'] })
  })

  it('armure non maîtrisée : désavantage Force / Dextérité seulement ; Discrétion en armure à Discrétion désavantageuse', async () => {
    const s = await mount({ scores: baseScores(14, 14, 14, 14), worn: id => [entry(id, 2, 'Cotte de mailles', 'armor', chainMail)] })
    expect(s.equippedArmorProficiencyWarning.value).not.toBeNull()
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: true }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'str' }, []))).toBe('disadvantage')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'wis' }, []))).toBe('normal')
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: false }, []))).toBe('normal')

    const light = await mount({ scores: baseScores(14, 14, 14, 14), worn: id => [entry(id, 3, 'Cuir', 'armor', leather)] })
    expect(light.armorStealthDisadvantage.value).toBe(false)
  })

  it('une arme lourde en Petite taille pèse sur son attaque, via les sources de l\'arme', async () => {
    const s = await mount({ scores: baseScores(14, 14, 14, 14) })
    const extra = [{ label: 'Arme lourde + Petite taille', mode: 'disadvantage' as const }]
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: true, extra }, []))).toBe('disadvantage')
  })

  it('un avantage conditionnel attend la situation désignée ; la sauvegarde de concentration la désigne d\'elle-même', async () => {
    const s = await mount({
      scores: baseScores(10, 10, 14, 10),
      speciesEffects: [
        { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'frightened' } },
        { type: 'advantage', value: { rollType: 'saving_throw', ability: 'con', condition: 'concentration_after_damage' } },
      ],
    })
    expect(s.rollEngine.situations.value).toEqual(['frightened', 'concentration_after_damage'])
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'wis' }, []))).toBe('normal')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'wis' }, ['frightened']))).toBe('advantage')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'con', situations: ['concentration_after_damage'] }, []))).toBe('advantage')
  })

  it('Étourdi : échec automatique signalé aux sauvegardes de Force et de Dextérité', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10) })
    s.toggleCondition('stunned')
    expect(s.rollEngine.policy({ type: 'save', ability: 'dex' }, []).autoFail).toEqual(['Étourdi'])
    expect(s.rollEngine.policy({ type: 'save', ability: 'wis' }, []).autoFail).toEqual([])
  })
})

const recklessRow = (active: boolean) => {
  const row = classFeature(11, 'Attaque téméraire', BARBARIAN, 2, [])
  return { ...row, active, feature: { ...row.feature, meta: RECKLESS_ATTACK_META } } as unknown as ReturnType<typeof classFeature>
}

describe('fiche — avantage conditionné (Attaque téméraire, Sens du danger)', () => {
  const scenario = { scores: baseScores(16, 14, 14, 10), classes: [{ classId: BARBARIAN, level: 3 }] }
  const strengthAttack = { type: 'attack', weapon: true, strengthMelee: true } as const

  it('Attaque téméraire active : avantage aux attaques de mêlée avec la Force, pas aux autres', async () => {
    const s = await mount({ ...scenario, features: [recklessRow(true)] })
    expect(modeOf(s.rollEngine.policy(strengthAttack, []))).toBe('advantage')
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: true, strengthMelee: false }, []))).toBe('normal')
    expect(modeOf(s.rollEngine.policy({ type: 'attack', weapon: false }, []))).toBe('normal')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'str' }, []))).toBe('normal')
  })

  it('Attaque téméraire inactive : aucun avantage', async () => {
    const s = await mount({ ...scenario, features: [recklessRow(false)] })
    expect(modeOf(s.rollEngine.policy(strengthAttack, []))).toBe('normal')
  })

  it('Sens du danger : avantage Dextérité contre un effet visible, perdu aveuglé, assourdi ou incapable d\'agir', async () => {
    const s = await mount({ ...scenario, features: [classFeature(12, 'Sens du danger', BARBARIAN, 2, [DANGER_SENSE_ADVANTAGE])] })
    const dexSave = { type: 'save', ability: 'dex' } as const
    expect(s.rollEngine.situations.value).toEqual(['visible_effects'])
    expect(modeOf(s.rollEngine.policy(dexSave, []))).toBe('normal')
    expect(modeOf(s.rollEngine.policy(dexSave, ['visible_effects']))).toBe('advantage')
    expect(modeOf(s.rollEngine.policy({ type: 'save', ability: 'str' }, ['visible_effects']))).toBe('normal')

    s.toggleCondition('blinded')
    expect(modeOf(s.rollEngine.policy(dexSave, ['visible_effects']))).toBe('normal')
    s.toggleCondition('blinded')
    expect(modeOf(s.rollEngine.policy(dexSave, ['visible_effects']))).toBe('advantage')
    s.toggleCondition('stunned')
    expect(resolveRollMode(s.rollEngine.policy(dexSave, ['visible_effects']).sources).advantage).toEqual([])
  })
})

describe('fiche — bonus aux dégâts des sorts', () => {
  it('additionne capacités et objets équipés', async () => {
    const s = await mount({
      scores: baseScores(10, 10, 10, 10),
      speciesEffects: [{ type: 'spell_damage_bonus', value: { amount: 1 } }],
      worn: id => [entry(id, 9, 'Bâton du mage', 'equipment', { category: 'x' }, [{ type: 'spell_damage_bonus', value: { amount: 2 } }])],
    })
    expect(s.spellDamageBonus.value).toBe(3)
  })

  it('sans effet, aucun bonus', async () => {
    expect((await mount({ scores: baseScores(10, 10, 10, 10) })).spellDamageBonus.value).toBe(0)
  })
})

describe('fiche — relance, plancher, critique', () => {
  it('Chanceux : relance du 1 à tout jet de d20', async () => {
    const s = await mount({ scores: baseScores(10, 10, 10, 10), speciesEffects: [{ type: 'reroll', value: { rollType: 'd20', trigger: 1 } }] })
    expect(s.rollEngine.policy({ type: 'attack', weapon: true }, []).rerollOn).toBe(1)
    expect(s.rollEngine.policy({ type: 'save', ability: 'wis' }, []).rerollOn).toBe(1)
    expect((await mount({ scores: baseScores(10, 10, 10, 10) })).rollEngine.policy({ type: 'initiative' }, []).rerollOn).toBeNull()
  })

  it('Savoir-faire : plancher de 10 aux compétences maîtrisées seulement', async () => {
    const s = await mount({
      scores: baseScores(10, 14, 10, 10),
      classes: [{ classId: ROGUE, level: 11 }],
      features: [classFeature(3, 'Savoir-faire', ROGUE, 11, seedEffects(roublardFeatures, 'Savoir-faire', 11))],
      skills: [{ skillKey: 'stealth', proficiencyLevel: 'expert' }],
    })
    expect(s.rollEngine.policy({ type: 'check', ability: 'dex', skill: 'stealth' }, []).minimum).toBe(10)
    expect(s.rollEngine.policy({ type: 'check', ability: 'dex', skill: 'acrobatics' }, []).minimum).toBeNull()
    expect(s.rollEngine.policy({ type: 'check', ability: 'dex' }, []).minimum).toBeNull()
    expect(s.rollEngine.policy({ type: 'initiative' }, []).minimum).toBeNull()
  })

  it('Champion : critique dès 19 (niveau 3), dès 18 (niveau 15), aux armes seulement', async () => {
    const improved = classFeature(4, 'Critique amélioré', FIGHTER, 3, seedEffects(champion, 'Critique amélioré', 3))
    const superior = classFeature(5, 'Critique supérieur', FIGHTER, 15, seedEffects(champion, 'Critique supérieur', 15))
    const lvl3 = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: FIGHTER, level: 3 }], features: [improved] })
    expect(lvl3.rollEngine.policy({ type: 'attack', weapon: true }, []).critFrom).toBe(19)
    expect(lvl3.rollEngine.policy({ type: 'attack', weapon: false }, []).critFrom).toBe(20)
    expect(lvl3.rollEngine.policy({ type: 'check', ability: 'str' }, []).critFrom).toBe(20)

    const lvl15 = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: FIGHTER, level: 15 }], features: [improved, superior] })
    expect(lvl15.rollEngine.policy({ type: 'attack', weapon: true }, []).critFrom).toBe(18)
  })

  it('Critique brutal : 1 dé au niveau 9, 2 au 13, 3 au 17, en mêlée, sans que la rage y change rien', async () => {
    const brutal = (id: number) => classFeature(id, 'Critique brutal', BARBARIAN, 9, [{ type: 'critical_extra_dice', value: { dice: BRUTAL_CRITICAL_DICE } }])
    const expected: [number, number][] = [[8, 0], [9, 1], [12, 1], [13, 2], [16, 2], [17, 3], [20, 3]]
    for (const [level, dice] of expected) {
      const s = await mount({ scores: baseScores(16, 10, 14, 10), classes: [{ classId: BARBARIAN, level }], features: [brutal(6 + level)] })
      expect(s.classTraits.value.criticalExtraDice).toBe(dice)
      expect(s.rollEngine.criticalExtraDice.value).toBe(dice)
    }
  })
})

describe('fiche — demi-maîtrise', () => {
  const jack = classFeature(7, 'Touche-à-tout', BARD, 2, seedEffects(bardeFeatures, 'Touche-à-tout', 2))

  it('Touche-à-tout (niveau 2, maîtrise +2) : +1 aux jets sans maîtrise, initiative et Perception passive comprises', async () => {
    const s = await mount({
      scores: baseScores(10, 14, 10, 14),
      classes: [{ classId: BARD, level: 2 }],
      features: [jack],
      skills: [{ skillKey: 'insight', proficiencyLevel: 'proficient' }],
    })
    expect(s.getSkillModifier('wis', 'perception')).toBe(2 + 1)
    expect(s.getSkillModifier('wis', 'insight')).toBe(2 + 2)
    expect(s.abilityCheckModifiers.value.str).toBe(0 + 1)
    expect(s.initiativeBonus.value).toBe(2 + 1)
    expect(s.passivePerception.value).toBe(10 + 2 + 1)
    expect(s.savingThrows.value.wis!.modifier).toBe(2)
  })

  it('Touche-à-tout arrondit à l\'inférieur (maîtrise +3 : +1), Athlète accompli au supérieur (+2) et ne vise que Force, Dextérité, Constitution', async () => {
    const athlete = classFeature(8, 'Athlète accompli', FIGHTER, 7, seedEffects(champion, 'Athlète accompli', 7))
    const s = await mount({ scores: baseScores(14, 14, 14, 14), classes: [{ classId: FIGHTER, level: 7 }], features: [athlete] })
    expect(s.abilityCheckModifiers.value.str).toBe(2 + 2)
    expect(s.abilityCheckModifiers.value.con).toBe(2 + 2)
    expect(s.abilityCheckModifiers.value.wis).toBe(2)
    expect(s.getSkillModifier('str', 'athletics')).toBe(2 + 2)
    expect(s.getSkillModifier('wis', 'perception')).toBe(2)

    const bard = await mount({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: BARD, level: 5 }], features: [jack] })
    expect(bard.proficiencyBonus.value).toBe(3)
    expect(bard.abilityCheckModifiers.value.str).toBe(1)
  })

  it('sans la capacité, rien ne change', async () => {
    const s = await mount({ scores: baseScores(10, 14, 10, 14), classes: [{ classId: BARD, level: 2 }] })
    expect(s.getSkillModifier('wis', 'perception')).toBe(2)
    expect(s.initiativeBonus.value).toBe(2)
  })
})

describe('fiche — avantage de la Rage seedée', () => {
  it('les avantages de la Rage couvrent les jets et sauvegardes de Force', () => {
    expect(RAGE_ADVANTAGES.map(e => `${e.value.rollType}:${e.value.ability}`)).toEqual(['check:str', 'saving_throw:str'])
  })
})

import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { TEMPORARY_EFFECT_TYPES, temporaryEffectSchema } from '../../shared/utils/temporary_effects'
import { updateCharacterSheetSchema } from '../../shared/utils/character_sheet'
import { effectLabel } from '../../app/utils/effectLabel'

const blessing = {
  id: 1,
  name: 'Bénédiction d\'Ilmater',
  active: true,
  effects: [{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }],
}

describe('effets temporaires — schéma partagé client/serveur', () => {
  it('accepte une bénédiction (+1 à tous les JS) et une malédiction (-2 CA)', () => {
    expect(temporaryEffectSchema.parse(blessing)).toEqual(blessing)
    const curse = { id: 2, name: 'Malédiction', active: false, effects: [{ type: 'armor_class_bonus', value: { amount: -2 } }] }
    expect(temporaryEffectSchema.parse(curse)).toEqual(curse)
  })

  it('accepte un simple rappel sans effet chiffré', () => {
    expect(temporaryEffectSchema.safeParse({ id: 3, name: 'Bénédiction (sort) : +1d4', active: true, effects: [] }).success).toBe(true)
  })

  it('refuse un type que la fiche n\'appliquerait pas, et un nom vide', () => {
    expect(temporaryEffectSchema.safeParse({ ...blessing, effects: [{ type: 'walking_speed', value: 3 }] }).success).toBe(false)
    expect(temporaryEffectSchema.safeParse({ ...blessing, name: '   ' }).success).toBe(false)
  })

  it('un maximum vidé dans l\'éditeur (\'\') vaut absence de maximum', () => {
    const parsed = temporaryEffectSchema.parse({
      ...blessing,
      effects: [{ type: 'ability_increase', value: { ability: 'str', amount: 2, max: '' } }],
    })
    expect(parsed.effects[0]).toEqual({ type: 'ability_increase', value: { ability: 'str', amount: 2 } })
  })

  it('passe par le PUT de la fiche', () => {
    expect(updateCharacterSheetSchema.parse({ temporaryEffects: [blessing] }).temporaryEffects).toEqual([blessing])
    expect(updateCharacterSheetSchema.safeParse({ temporaryEffects: [{ ...blessing, id: 0 }] }).success).toBe(false)
  })

  it('chaque type proposé a un libellé lisible (jamais la clé machine)', () => {
    const samples: Record<string, Effect['value']> = {
      armor_class_bonus: { amount: 1 },
      saving_throw_bonus: { ability: 'all', amount: 1 },
      ability_increase: { ability: 'str', amount: 2 },
      ability_score_set: { ability: 'str', score: 19 },
      damage_resistance: { damageType: 'fire' },
      damage_immunity: { damageType: 'fire' },
      vulnerability: { damageType: 'fire' },
      spell_save_dc_bonus: { amount: 1 },
      spell_attack_bonus: { amount: 1 },
      initiative_bonus: { amount: 1 },
      passive_skill_bonus: { skill: 'perception', amount: 1 },
    }
    expect(Object.keys(samples).sort()).toEqual([...TEMPORARY_EFFECT_TYPES].sort())
    for (const type of TEMPORARY_EFFECT_TYPES) {
      expect(effectLabel({ type, value: samples[type] } as Effect)).not.toContain(type)
    }
  })
})

describe('effectLabel — signe des bonus', () => {
  it('écrit un malus avec son signe, sans « +- »', () => {
    expect(effectLabel({ type: 'armor_class_bonus', value: { amount: -2 } })).toBe('-2 CA')
    expect(effectLabel({ type: 'spell_save_dc_bonus', value: { amount: -1 } })).toBe('-1 DD des sorts')
  })

  it('nomme la cible d\'un bonus de JS', () => {
    expect(effectLabel({ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } })).toBe('+1 JS (tous)')
    expect(effectLabel({ type: 'saving_throw_bonus', value: { ability: 'wis', amount: 1 } })).toBe('+1 JS SAG')
  })
})

import { describe, it, expect } from 'vitest'
import { armorClassBonusParts, savingThrowBonusParts, sumBonusParts, weaponBonusParts } from '../../shared/rules/effectBonuses'

// Anneau de protection : « Vous obtenez un bonus de +1 à la CA et aux jets de
// sauvegarde lorsque vous portez cet anneau. » Même formulation pour la Cape de protection.
const ring = {
  label: 'Anneau de protection',
  effects: [
    { type: 'armor_class_bonus' as const, value: { amount: 1 } },
    { type: 'saving_throw_bonus' as const, value: { ability: 'all' as const, amount: 1 } },
  ],
}

describe('effectBonuses — bonus fixes signés', () => {
  it('nomme chaque source qui apporte un bonus de CA, et seulement celles-là', () => {
    const parts = armorClassBonusParts([
      ring,
      { label: 'Malédiction', effects: [{ type: 'armor_class_bonus', value: { amount: -2 } }] },
      { label: 'Capacités', effects: [{ type: 'initiative_bonus', value: { amount: 5 } }] },
    ])
    expect(parts).toEqual([
      { label: 'Anneau de protection', amount: 1 },
      { label: 'Malédiction', amount: -2 },
    ])
    expect(sumBonusParts(parts)).toBe(-1)
  })

  it('cumule les effets d\'une même source', () => {
    const parts = armorClassBonusParts([{
      label: 'Bracelets',
      effects: [{ type: 'armor_class_bonus', value: { amount: 1 } }, { type: 'armor_class_bonus', value: { amount: 1 } }],
    }])
    expect(parts).toEqual([{ label: 'Bracelets', amount: 2 }])
  })

  it('un bonus de JS « tous » s\'applique à chaque caractéristique, un bonus ciblé à la sienne seulement', () => {
    const blessing = { label: 'Bénédiction', effects: [{ type: 'saving_throw_bonus' as const, value: { ability: 'wis' as const, amount: 2 } }] }
    expect(savingThrowBonusParts([ring, blessing], 'wis')).toEqual([
      { label: 'Anneau de protection', amount: 1 },
      { label: 'Bénédiction', amount: 2 },
    ])
    expect(savingThrowBonusParts([ring, blessing], 'str')).toEqual([{ label: 'Anneau de protection', amount: 1 }])
  })

  it('un bonus d\'arme vise toutes les armes, le corps à corps ou la distance ; attaque et dégâts restent distincts', () => {
    const bracers = {
      label: 'Bracelets d\'archerie',
      effects: [
        { type: 'weapon_damage_bonus' as const, value: { amount: 2, weapons: 'ranged' as const } },
        { type: 'weapon_attack_bonus' as const, value: { amount: 1, weapons: 'all' as const } },
      ],
    }
    const duelist = { label: 'Duelliste', effects: [{ type: 'weapon_damage_bonus' as const, value: { amount: 1, weapons: 'melee' as const } }] }

    expect(weaponBonusParts([bracers, duelist], 'damage', { isRanged: true })).toEqual([{ label: 'Bracelets d\'archerie', amount: 2 }])
    expect(weaponBonusParts([bracers, duelist], 'damage', { isRanged: false })).toEqual([{ label: 'Duelliste', amount: 1 }])
    expect(weaponBonusParts([bracers, duelist], 'attack', { isRanged: false })).toEqual([{ label: 'Bracelets d\'archerie', amount: 1 }])
    expect(weaponBonusParts([{ label: 'Anneau', effects: [{ type: 'armor_class_bonus', value: { amount: 1 } }] }], 'attack', { isRanged: true })).toEqual([])
  })

  it('une source dont les bonus s\'annulent n\'apparaît pas', () => {
    const parts = savingThrowBonusParts([{
      label: 'Neutre',
      effects: [
        { type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } },
        { type: 'saving_throw_bonus', value: { ability: 'con', amount: -1 } },
      ],
    }], 'con')
    expect(parts).toEqual([])
  })
})

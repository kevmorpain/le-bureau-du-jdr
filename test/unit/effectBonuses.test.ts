import { describe, it, expect } from 'vitest'
import { armorClassBonusParts, savingThrowBonusParts, sumBonusParts } from '../../shared/rules/effectBonuses'

// Anneau de protection (AideDD, objets magiques) : « Vous obtenez un bonus de +1 à la CA et aux jets de
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

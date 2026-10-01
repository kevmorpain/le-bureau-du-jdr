import { describe, it, expect } from 'vitest'
import { ROLL_TABLE_KEYS, rollTableEntryIndex, rollTableRangeLabel } from '../../shared/rules/rollTables'
import { rollTables } from '../../server/db/seeds/data/rollTables'
import { ensorceleurSubclasses } from '../../server/db/seeds/data/ensorceleur'
import { rulesetOf } from '../../server/db/seeds/lib/rulesetOf'

const wildMagicSurge = rollTables.find(t => t.key === 'wild_magic_surge')!

describe('rollTableEntryIndex', () => {
  it('trouve la ligne dont la plage contient le jet, bornes comprises', () => {
    expect(rollTableEntryIndex(wildMagicSurge.entries, 1)).toBe(0)
    expect(rollTableEntryIndex(wildMagicSurge.entries, 2)).toBe(0)
    expect(rollTableEntryIndex(wildMagicSurge.entries, 3)).toBe(1)
    expect(rollTableEntryIndex(wildMagicSurge.entries, 100)).toBe(49)
  })

  it('renvoie -1 hors du dé', () => {
    expect(rollTableEntryIndex(wildMagicSurge.entries, 0)).toBe(-1)
    expect(rollTableEntryIndex(wildMagicSurge.entries, 101)).toBe(-1)
  })
})

describe('rollTableRangeLabel', () => {
  it('numérote le d100 sur deux chiffres, comme la table imprimée', () => {
    expect(rollTableRangeLabel({ min: 1, max: 2, text: '' }, 100)).toBe('01-02')
    expect(rollTableRangeLabel({ min: 99, max: 100, text: '' }, 100)).toBe('99-100')
  })

  it('affiche une valeur seule quand la plage tient sur une face', () => {
    expect(rollTableRangeLabel({ min: 3, max: 3, text: '' }, 8)).toBe('3')
  })
})

// Une plage manquante laisserait un jet sans effet, un chevauchement en donnerait deux.
describe('seed des tables — couverture du dé', () => {
  it.each(rollTables.map(t => [`${t.key} (${rulesetOf(t)})`, t] as const))('%s couvre 1..dé sans trou ni chevauchement', (_, table) => {
    let next = 1
    for (const entry of table.entries) {
      expect(entry.min).toBe(next)
      expect(entry.max).toBeGreaterThanOrEqual(entry.min)
      next = entry.max + 1
    }
    expect(next - 1).toBe(table.die)
  })

  it('une table au plus par (clé, édition)', () => {
    const keys = rollTables.map(t => `${t.key}|${rulesetOf(t)}`)
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([])
  })

  it('chaque clé canonique a sa table seedée', () => {
    const seeded = new Set(rollTables.map(t => t.key))
    expect(ROLL_TABLE_KEYS.filter(k => !seeded.has(k))).toEqual([])
  })
})

// Valeurs relevées à la main sur https://www.aidedd.org/regles/classes/ensorceleur/.
describe('Pic de magie sauvage (2014)', () => {
  it('est un d100 en 50 plages de deux', () => {
    expect(wildMagicSurge.die).toBe(100)
    expect(wildMagicSurge.entries).toHaveLength(50)
  })

  it('reprend les effets de la source', () => {
    const at = (roll: number) => wildMagicSurge.entries[rollTableEntryIndex(wildMagicSurge.entries, roll)]!.text
    expect(at(8)).toBe('Vous lancez le sort boule de feu de niveau 3 centré sur vous.')
    expect(at(59)).toBe('Vous regagnez votre emplacement de sort dépensé le plus faible.')
    expect(at(100)).toBe('Vous regagnez tous vos points de sorcellerie.')
  })

  it('est consultable depuis les trois capacités de la Magie sauvage qui y renvoient', () => {
    const wildMagic = ensorceleurSubclasses.find(s => s.name === 'Magie sauvage')!
    const linked = wildMagic.features.filter(f => f.rollTable === 'wild_magic_surge').map(f => f.name)
    expect(linked).toEqual(['Pic de magie sauvage', 'Marée du chaos', 'Chaos contrôlé'])
  })
})

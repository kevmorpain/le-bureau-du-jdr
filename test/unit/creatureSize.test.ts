import { describe, it, expect } from 'vitest'
import {
  CREATURE_SIZE_LABELS,
  HEAVY_WEAPON_DISADVANTAGE_SIZES,
  creatureSizeLabel,
  hasHeavyWeaponDisadvantage,
} from '../../shared/rules/creatureSize'
import { CreatureSize } from '../../server/db/schema/character_species'
import { characterSpecies } from '../../server/db/seeds/data/character_species'

// ─────────────────────────────────────────────────────────────────────────────
// Taille de créature. Ces tests gardent la classe de bug qui vivait dans
// `useCharacterInventory` : une comparaison littérale sur des codes FRANÇAIS
// (« P », « TP ») alors que la base stocke les codes de l'enum `CreatureSize`
// (T/S/M/L/H/G) → le désavantage « arme lourde + petite taille » ne se
// déclenchait jamais. Les libellés sont désormais séparés des codes.
// ─────────────────────────────────────────────────────────────────────────────

describe('taille de créature — codes vs libellés', () => {
  it('libelle exactement les valeurs stockables en base (enum Drizzle)', () => {
    expect(Object.keys(CREATURE_SIZE_LABELS).sort()).toEqual(Object.values(CreatureSize).sort())
  })

  it('traduit un code connu, ignore le reste', () => {
    expect(creatureSizeLabel(CreatureSize.Small)).toBe('Petite')
    expect(creatureSizeLabel(CreatureSize.Medium)).toBe('Moyenne')
    // Les abréviations françaises ne sont PAS des codes de base.
    expect(creatureSizeLabel('P')).toBeNull()
    expect(creatureSizeLabel(null)).toBeNull()
  })

  it('toutes les espèces seedées portent un code de taille connu', () => {
    const unknown = characterSpecies
      .filter(s => creatureSizeLabel(s.size) === null)
      .map(s => `${s.name} → ${s.size}`)
    expect(unknown).toEqual([])
  })
})

describe('désavantage arme lourde (PHB 2014 p. 147)', () => {
  it('s\'applique aux créatures Petites et Très petites', () => {
    expect(HEAVY_WEAPON_DISADVANTAGE_SIZES).toEqual([CreatureSize.Tiny, CreatureSize.Small])
    expect(hasHeavyWeaponDisadvantage(CreatureSize.Small)).toBe(true)
    expect(hasHeavyWeaponDisadvantage(CreatureSize.Tiny)).toBe(true)
  })

  it('ne s\'applique pas aux tailles Moyenne et au-dessus, ni à une valeur absente', () => {
    expect(hasHeavyWeaponDisadvantage(CreatureSize.Medium)).toBe(false)
    expect(hasHeavyWeaponDisadvantage(CreatureSize.Large)).toBe(false)
    expect(hasHeavyWeaponDisadvantage(null)).toBe(false)
    // L'ancien code fautif : « P » n'est pas un code de base.
    expect(hasHeavyWeaponDisadvantage('P')).toBe(false)
  })
})

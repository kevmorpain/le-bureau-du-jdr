import { describe, it, expect } from 'vitest'
import { slotsForLevel, combinedSpellSlots } from '../../shared/rules/spellSlots'

// ─────────────────────────────────────────────────────────────────────────────
// Contrat d'équivalence des tables d'emplacements (D12) — la source unique de
// shared/rules/spellSlots.ts doit rendre EXACTEMENT les valeurs que les copies
// (index.post / level-up) produisaient. Valeurs PHB 2014 vérifiées à la main.
// ─────────────────────────────────────────────────────────────────────────────

describe('slotsForLevel — lanceur complet', () => {
  it('niveau 1 : 2 emplacements de niveau 1', () => {
    expect(slotsForLevel('full', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 5 : 4/3/2', () => {
    expect(slotsForLevel('full', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 20 : jusqu\'au niveau 9', () => {
    expect(slotsForLevel('full', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
  })
})

describe('slotsForLevel — demi-lanceur', () => {
  it('niveau 1 : aucun emplacement', () => {
    expect(slotsForLevel('half', 1)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 2 : 2 de niveau 1', () => {
    expect(slotsForLevel('half', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 5 : 4/2', () => {
    expect(slotsForLevel('half', 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
  })
})

describe('slotsForLevel — magie de pacte (Occultiste)', () => {
  it('niveau 1 : 1 emplacement de niveau 1', () => {
    expect(slotsForLevel('pact', 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 2 : 2 emplacements de niveau 1', () => {
    expect(slotsForLevel('pact', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 3 : 2 emplacements de niveau 2', () => {
    expect(slotsForLevel('pact', 3)).toEqual([0, 2, 0, 0, 0, 0, 0, 0, 0])
  })
  it('niveau 11 : 3 emplacements de niveau 5', () => {
    expect(slotsForLevel('pact', 11)).toEqual([0, 0, 0, 0, 3, 0, 0, 0, 0])
  })
  it('niveau 17 : 4 emplacements de niveau 5', () => {
    expect(slotsForLevel('pact', 17)).toEqual([0, 0, 0, 0, 4, 0, 0, 0, 0])
  })
})

describe('combinedSpellSlots — multiclassage', () => {
  it('lanceur complet seul : identique à slotsForLevel(full)', () => {
    const { regular, pact } = combinedSpellSlots([{ casterType: 'full', level: 5 }])
    expect(regular).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
    expect(pact).toBeNull()
  })

  it('full 5 + demi-lanceur 4 : niveau de lanceur combiné = 5 + floor(4/2) = 7', () => {
    const { regular } = combinedSpellSlots([
      { casterType: 'full', level: 5 },
      { casterType: 'half', level: 4 },
    ])
    expect(regular).toEqual(slotsForLevel('full', 7))
  })

  it('un demi-lanceur de niveau 1 ne contribue rien (incantation à partir du niveau 2)', () => {
    const { regular } = combinedSpellSlots([
      { casterType: 'full', level: 3 },
      { casterType: 'half', level: 1 },
    ])
    expect(regular).toEqual(slotsForLevel('full', 3))
  })

  it('la magie de pacte reste séparée (ne se combine pas au lanceur complet)', () => {
    const { regular, pact } = combinedSpellSlots([
      { casterType: 'full', level: 5 },
      { casterType: 'pact', level: 5 },
    ])
    expect(regular).toEqual(slotsForLevel('full', 5))
    expect(pact).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]) // occultiste 5 → 2 emplacements de niveau 3
  })

  it('classe non lanceuse : aucune contribution', () => {
    const { regular, pact } = combinedSpellSlots([{ casterType: 'none', level: 10 }])
    expect(regular).toBeNull()
    expect(pact).toBeNull()
  })
})

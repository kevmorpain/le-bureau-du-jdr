import { describe, it, expect } from 'vitest'
import { slotsForLevel, combinedSpellSlots, maxSpellLevelForLevel } from '../../shared/rules/spellSlots'

// Contrat d'équivalence des tables d'emplacements (D12) — la source unique de
// shared/rules/spellSlots.ts doit rendre EXACTEMENT les valeurs que les copies
// (index.post / level-up) produisaient. Valeurs PHB 2014 vérifiées à la main.

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

describe('maxSpellLevelForLevel', () => {
  it('lanceur complet : niv.1 → 1, niv.5 → 3, niv.20 → 9', () => {
    expect(maxSpellLevelForLevel('full', 1)).toBe(1)
    expect(maxSpellLevelForLevel('full', 5)).toBe(3)
    expect(maxSpellLevelForLevel('full', 20)).toBe(9)
  })
  it('demi-lanceur : niv.1 → 0, niv.5 → 2', () => {
    expect(maxSpellLevelForLevel('half', 1)).toBe(0)
    expect(maxSpellLevelForLevel('half', 5)).toBe(2)
  })
  it('magie de pacte : niv.3 → 2, niv.11 → 5', () => {
    expect(maxSpellLevelForLevel('pact', 3)).toBe(2)
    expect(maxSpellLevelForLevel('pact', 11)).toBe(5)
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

describe('slotsForLevel — lanceur du tiers (Chevalier occulte, Escroc arcanique ; AideDD)', () => {
  it('niveaux 1 et 2 : aucun emplacement, incantation au niveau 3', () => {
    expect(slotsForLevel('third', 2)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 3)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('les paliers de la table', () => {
    expect(slotsForLevel('third', 4)).toEqual([3, 0, 0, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 7)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 10)).toEqual([4, 3, 0, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 13)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 16)).toEqual([4, 3, 3, 0, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 19)).toEqual([4, 3, 3, 1, 0, 0, 0, 0, 0])
    expect(slotsForLevel('third', 20)).toEqual([4, 3, 3, 1, 0, 0, 0, 0, 0])
  })

  it('niveau maximal de sort : 1 au niveau 3, 2 au 7, 4 au 19', () => {
    expect(maxSpellLevelForLevel('third', 3)).toBe(1)
    expect(maxSpellLevelForLevel('third', 7)).toBe(2)
    expect(maxSpellLevelForLevel('third', 19)).toBe(4)
  })
})

describe('combinedSpellSlots — une seule classe lanceuse (AideDD : « utilisez les règles de votre classe »)', () => {
  it('un Paladin seul lit sa table : niveau 5 → 4/2, et non la table multiclassée du niveau 2', () => {
    expect(combinedSpellSlots([{ casterType: 'half', level: 5 }]).regular).toEqual(slotsForLevel('half', 5))
    expect(combinedSpellSlots([{ casterType: 'half', level: 5 }]).regular).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
  })

  it('même chose pour un Rôdeur, et à côté d\'une classe qui n\'incante pas', () => {
    expect(combinedSpellSlots([{ casterType: 'half', level: 9 }, { casterType: 'none', level: 3 }]).regular).toEqual(slotsForLevel('half', 9))
  })

  it('un Chevalier occulte seul lit la table du tiers', () => {
    expect(combinedSpellSlots([{ casterType: 'third', level: 7 }, { casterType: 'none', level: 0 }]).regular).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0])
  })

  it('un demi-lanceur de niveau 1 ne compte pas : le lanceur complet reste seul', () => {
    expect(combinedSpellSlots([{ casterType: 'full', level: 3 }, { casterType: 'half', level: 1 }]).regular).toEqual(slotsForLevel('full', 3))
  })
})

describe('combinedSpellSlots — lanceur du tiers multiclassé', () => {
  it('lanceur complet 5 + tiers 6 : 5 + floor(6/3) = 7', () => {
    const { regular } = combinedSpellSlots([{ casterType: 'full', level: 5 }, { casterType: 'third', level: 6 }])
    expect(regular).toEqual(slotsForLevel('full', 7))
  })

  it('tiers 5 + demi 4 : floor(5/3) + floor(4/2) = 3', () => {
    const { regular } = combinedSpellSlots([{ casterType: 'third', level: 5 }, { casterType: 'half', level: 4 }])
    expect(regular).toEqual(slotsForLevel('full', 3))
  })

  it('une sous-classe du tiers de niveau 2 ne contribue rien', () => {
    const { regular } = combinedSpellSlots([{ casterType: 'full', level: 3 }, { casterType: 'third', level: 2 }])
    expect(regular).toEqual(slotsForLevel('full', 3))
  })
})

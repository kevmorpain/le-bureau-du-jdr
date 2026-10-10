import { describe, it, expect } from 'vitest'
import {
  KN_MAX_OWNED_AMULETS,
  emptyKnAmulets,
  knAddAmulet,
  knAmuletMastery,
  knAmuletsSchema,
  knEquipAmulet,
  knLockAmuletTier,
  knMasteryEntries,
  knRandomMasteryKey,
  knRemoveAmulet,
  knUnequipAmulet,
  knUnlockAmuletTier,
  type KnAmulets,
} from '../../shared/ker-nethalas/amulets'
import { updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import { knAbilityPointsSpent, knAbilityPointsUnspent, knUnlockMastery } from '../../shared/ker-nethalas/masteries'

const trained = [{ key: 'alpha', tiers: 2 }, { key: 'beta', tiers: 1 }]
const amulets = (over: Partial<KnAmulets> = {}): KnAmulets => ({ ...emptyKnAmulets(), ...over })

describe('amulettes du survivant', () => {
  it('une amulette est possédée, une seule est portée, avec zéro à cinq paliers', () => {
    expect(knAmuletsSchema.safeParse(emptyKnAmulets()).success).toBe(true)
    expect(knAmuletsSchema.safeParse(amulets({ owned: ['gamma', 'delta'], equipped: 'delta', tiers: 5 })).success).toBe(true)
    expect(knAmuletsSchema.safeParse(amulets({ owned: ['gamma'], equipped: 'delta' })).success).toBe(false)
    expect(knAmuletsSchema.safeParse(amulets({ tiers: 6 })).success).toBe(false)
    expect(knAmuletsSchema.safeParse(amulets({ owned: ['Gamma Delta'] })).success).toBe(false)
  })

  it('accepte deux amulettes de la même Maîtrise, et la borne au nombre d\'emplacements', () => {
    expect(knAmuletsSchema.safeParse(amulets({ owned: ['gamma', 'gamma'] })).success).toBe(true)
    expect(knAmuletsSchema.safeParse(amulets({ owned: Array.from({ length: KN_MAX_OWNED_AMULETS + 1 }, () => 'gamma') })).success).toBe(false)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ amulets: amulets({ owned: ['gamma'], equipped: 'gamma', tiers: 2 }) }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ amulets: amulets({ owned: [], equipped: 'gamma' }) }).success).toBe(false)
  })
})

describe('Maîtrise apportée par l\'amulette portée', () => {
  it('est celle de l\'amulette portée', () => {
    expect(knAmuletMastery(amulets({ owned: ['gamma'], equipped: 'gamma' }), trained)).toBe('gamma')
    expect(knAmuletMastery(emptyKnAmulets(), trained)).toBeNull()
  })

  it('n\'apporte rien quand la Maîtrise est déjà apprise', () => {
    expect(knAmuletMastery(amulets({ owned: ['alpha'], equipped: 'alpha' }), trained)).toBeNull()
  })
})

describe('Maîtrises dont le survivant a l\'usage', () => {
  it('les apprises, puis celle de l\'amulette portée avec ses propres paliers', () => {
    expect(knMasteryEntries(trained, amulets({ owned: ['gamma'], equipped: 'gamma', tiers: 2 }))).toEqual([
      { key: 'alpha', tiers: 2, amulet: false },
      { key: 'beta', tiers: 1, amulet: false },
      { key: 'gamma', tiers: 2, amulet: true },
    ])
  })

  it('sans amulette utile, seulement les apprises', () => {
    expect(knMasteryEntries(trained, emptyKnAmulets())).toHaveLength(2)
    expect(knMasteryEntries(trained, amulets({ owned: ['alpha'], equipped: 'alpha' }))).toHaveLength(2)
  })
})

describe('ajouter, porter et retirer', () => {
  it('une amulette qui arrive est portée d\'office si l\'emplacement est libre et qu\'elle apporte quelque chose', () => {
    expect(knAddAmulet(emptyKnAmulets(), 'gamma', trained)).toEqual(amulets({ owned: ['gamma'], equipped: 'gamma' }))
  })

  it('reste dans le sac si une autre est déjà portée, ou si sa Maîtrise est déjà apprise', () => {
    const worn = amulets({ owned: ['gamma'], equipped: 'gamma' })

    expect(knAddAmulet(worn, 'delta', trained)).toEqual(amulets({ owned: ['gamma', 'delta'], equipped: 'gamma' }))
    expect(knAddAmulet(emptyKnAmulets(), 'alpha', trained)).toEqual(amulets({ owned: ['alpha'], equipped: null }))
  })

  it('n\'ajoute plus rien quand les emplacements sont pleins', () => {
    const full = amulets({ owned: Array.from({ length: KN_MAX_OWNED_AMULETS }, () => 'gamma'), equipped: 'gamma' })

    expect(knAddAmulet(full, 'delta', trained)).toEqual(full)
  })

  it('porter une amulette garde les paliers débloqués, et ne vaut que pour une amulette possédée', () => {
    const state = amulets({ owned: ['gamma', 'delta'], equipped: 'gamma', tiers: 3 })

    expect(knEquipAmulet(state, 'delta')).toEqual({ ...state, equipped: 'delta' })
    expect(knEquipAmulet(state, 'omega')).toEqual(state)
    expect(knUnequipAmulet(state)).toEqual({ ...state, equipped: null })
  })

  it('retirer un exemplaire ne retire la Maîtrise portée que s\'il n\'en reste aucun', () => {
    expect(knRemoveAmulet(amulets({ owned: ['gamma', 'gamma'], equipped: 'gamma' }), 'gamma'))
      .toEqual(amulets({ owned: ['gamma'], equipped: 'gamma' }))
    expect(knRemoveAmulet(amulets({ owned: ['gamma', 'delta'], equipped: 'gamma', tiers: 2 }), 'gamma'))
      .toEqual(amulets({ owned: ['delta'], equipped: null, tiers: 2 }))
    expect(knRemoveAmulet(amulets({ owned: ['gamma'], equipped: 'gamma' }), 'omega'))
      .toEqual(amulets({ owned: ['gamma'], equipped: 'gamma' }))
  })

  it('ne modifie pas l\'état d\'origine', () => {
    const original = amulets({ owned: ['gamma', 'delta'], equipped: 'gamma', tiers: 1 })
    knAddAmulet(original, 'omega', trained)
    knEquipAmulet(original, 'delta')
    knRemoveAmulet(original, 'gamma')
    knUnlockAmuletTier(original, trained, 9)
    knLockAmuletTier(original)

    expect(original).toEqual(amulets({ owned: ['gamma', 'delta'], equipped: 'gamma', tiers: 1 }))
  })
})

describe('paliers de la Maîtrise d\'une amulette', () => {
  const worn = amulets({ owned: ['gamma'], equipped: 'gamma' })

  it('se débloquent un à un et coûtent des points d\'Aptitude', () => {
    const unlocked = knUnlockAmuletTier(worn, trained, 6)

    expect(unlocked.tiers).toBe(1)
    expect(knAbilityPointsSpent(trained, unlocked.tiers)).toBe(4)
    expect(knAbilityPointsUnspent(6, trained, unlocked.tiers)).toBe(3)
  })

  it('ne se débloquent pas sans point à dépenser, sans amulette utile, ni au-delà du palier 5', () => {
    expect(knUnlockAmuletTier(worn, trained, 2)).toEqual(worn)
    expect(knUnlockAmuletTier(emptyKnAmulets(), trained, 9)).toEqual(emptyKnAmulets())
    expect(knUnlockAmuletTier(amulets({ owned: ['alpha'], equipped: 'alpha' }), trained, 9).tiers).toBe(0)
    expect(knUnlockAmuletTier({ ...worn, tiers: 5 }, [], 9).tiers).toBe(5)
  })

  it('se reprennent jusqu\'à zéro, l\'amulette restant portée', () => {
    expect(knLockAmuletTier({ ...worn, tiers: 2 }).tiers).toBe(1)
    expect(knLockAmuletTier(worn)).toEqual(worn)
  })

  it('privent d\'autant les Maîtrises apprises, qui ne peuvent plus se débloquer sans point', () => {
    const spent = { ...worn, tiers: 3 }

    expect(knUnlockMastery(trained, 'alpha', 5, spent.tiers)).toEqual(trained)
    expect(knUnlockMastery(trained, 'alpha', 6, spent.tiers)).toContainEqual({ key: 'alpha', tiers: 3 })
  })
})

describe('table « Maîtrise aléatoire »', () => {
  const keys = ['a', 'b', 'c', 'd']

  it('un D20 sur les Maîtrises dans l\'ordre, ici autant de faces que de Maîtrises', () => {
    expect(knRandomMasteryKey(keys, () => 0)).toBe('a')
    expect(knRandomMasteryKey(keys, () => 0.3)).toBe('b')
    expect(knRandomMasteryKey(keys, () => 0.999)).toBe('d')
  })

  it('ne tire rien sans Maîtrise', () => {
    expect(knRandomMasteryKey([])).toBeNull()
  })
})

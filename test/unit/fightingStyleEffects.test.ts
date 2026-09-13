import { describe, it, expect } from 'vitest'
import {
  defenseAcBonus,
  archeryAttackBonus,
  duelingDamageBonus,
  twoWeaponOffhandUsesAbilityMod,
} from '../../shared/rules/fightingStyleEffects'

// Application des bonus statiques de style de combat (F2 tranche 3). Logique pure → testée en
// isolation ; la fiche (`useCharacterInventory`) ne fait que fournir le contexte d'arme/armure.

const S = (...k: string[]) => new Set(k)

describe('fightingStyleEffects — bonus statiques', () => {
  it('Défense : +1 CA seulement avec armure ET style « defense »', () => {
    expect(defenseAcBonus(S('defense'), true)).toBe(1)
    expect(defenseAcBonus(S('defense'), false)).toBe(0) // sans armure de corps
    expect(defenseAcBonus(S('archery'), true)).toBe(0) // autre style
    expect(defenseAcBonus(S(), true)).toBe(0)
  })

  it('Archerie : +2 attaque seulement pour une arme à distance', () => {
    expect(archeryAttackBonus(S('archery'), true)).toBe(2)
    expect(archeryAttackBonus(S('archery'), false)).toBe(0) // arme de mêlée
    expect(archeryAttackBonus(S('defense'), true)).toBe(0)
  })

  it('Duel : +2 dégâts à une main de mêlée, sans autre arme', () => {
    const base = { isMelee: true, isTwoHanded: false, usingTwoHanded: false, equippedWeaponCount: 1 }
    expect(duelingDamageBonus(S('dueling'), base)).toBe(2)
    // Arme polyvalente maniée à une main → compte.
    expect(duelingDamageBonus(S('dueling'), { ...base, usingTwoHanded: false })).toBe(2)
    // À distance → non.
    expect(duelingDamageBonus(S('dueling'), { ...base, isMelee: false })).toBe(0)
    // À deux mains (arme two_handed) → non.
    expect(duelingDamageBonus(S('dueling'), { ...base, isTwoHanded: true })).toBe(0)
    // Polyvalente maniée à deux mains → non.
    expect(duelingDamageBonus(S('dueling'), { ...base, usingTwoHanded: true })).toBe(0)
    // Une autre arme équipée (dual-wield) → non.
    expect(duelingDamageBonus(S('dueling'), { ...base, equippedWeaponCount: 2 })).toBe(0)
    // Sans le style → non.
    expect(duelingDamageBonus(S('archery'), base)).toBe(0)
  })

  it('Combat à deux armes : la main secondaire utilise le modificateur de caractéristique', () => {
    expect(twoWeaponOffhandUsesAbilityMod(S('two_weapon'))).toBe(true)
    expect(twoWeaponOffhandUsesAbilityMod(S('dueling'))).toBe(false)
    expect(twoWeaponOffhandUsesAbilityMod(S())).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import {
  baseCastLevels,
  baseSlotLevel,
  diceRange,
  parseDiceNotation,
  resolveAtLevel,
  resolveAttackCount,
  resolveDamageDie,
  resolveHealDie,
  slotScalingEntries,
  upcastRows,
} from '../../shared/rules/spellScaling'
import type { ScalableSpell } from '../../shared/rules/spellScaling'
import { DamageType } from '../../server/db/schema/spells'

// Projectile magique — le cas de U10 : l'affichage restait à 3d4+3 pendant que le jet roulait 5d4+5.
const magicMissile: ScalableSpell = {
  level: 1,
  damages: [{
    damage_type: DamageType.Force,
    damage_at_slot_level: { 1: '3d4+3', 2: '4d4+4', 3: '5d4+5', 4: '6d4+6', 5: '7d4+7' },
  }],
}

// Arme spirituelle — progression creuse : un palier un niveau sur deux.
const spiritualWeapon: ScalableSpell = {
  level: 2,
  damages: [{
    damage_type: DamageType.Force,
    damage_at_slot_level: { 2: '1d8', 4: '2d8', 6: '3d8', 8: '4d8' },
    isSpellcastingModifierAdded: true,
  }],
}

// Décharge occulte — tour de magie : progression par niveau de PERSONNAGE, insensible à l'emplacement.
const eldritchBlast: ScalableSpell = {
  level: 0,
  damages: [{
    damage_type: DamageType.Force,
    damage_at_character_level: { 1: '1d10', 5: '2d10', 11: '3d10', 17: '4d10' },
  }],
  multiAttack: { label: 'Rayon', count_at_character_level: { 1: 1, 5: 2, 11: 3, 17: 4 } },
}

const cureWounds: ScalableSpell = {
  level: 1,
  heal: {
    heal_type: 'hit_points',
    heal_at_slot_level: { 1: '1d8', 2: '2d8', 3: '3d8' },
    isSpellcastingModifierAdded: true,
  },
}

describe('resolveAtLevel — progression creuse', () => {
  it('prend le palier le plus haut atteint, pas la correspondance exacte', () => {
    const table = { 2: '1d8', 4: '2d8', 6: '3d8' }
    expect(resolveAtLevel(table, 2)).toBe('1d8')
    expect(resolveAtLevel(table, 3)).toBe('1d8')
    expect(resolveAtLevel(table, 5)).toBe('2d8')
    expect(resolveAtLevel(table, 9)).toBe('3d8')
  })

  it('renvoie undefined sous le premier palier (et non le premier palier)', () => {
    expect(resolveAtLevel({ 2: '1d8' }, 1)).toBeUndefined()
  })

  it('tolère les clés chaînes (JSON relu depuis la base) comme numériques (seeds)', () => {
    expect(resolveAtLevel({ '1': '1d6', '3': '2d6' }, 4)).toBe('2d6')
  })

  it('accepte une table absente', () => {
    expect(resolveAtLevel(null, 5)).toBeUndefined()
    expect(resolveAtLevel(undefined, 5)).toBeUndefined()
  })
})

describe('resolveDamageDie / resolveHealDie — le bon axe de niveau', () => {
  it('suit le niveau d\'emplacement pour une progression par emplacement', () => {
    const entry = magicMissile.damages![0]!
    expect(resolveDamageDie(entry, { characterLevel: 20, slotLevel: 1 })).toBe('3d4+3')
    expect(resolveDamageDie(entry, { characterLevel: 1, slotLevel: 3 })).toBe('5d4+5')
  })

  it('ignore le niveau d\'emplacement pour une progression par niveau de personnage', () => {
    const entry = eldritchBlast.damages![0]!
    expect(resolveDamageDie(entry, { characterLevel: 5, slotLevel: 9 })).toBe('2d10')
    expect(resolveDamageDie(entry, { characterLevel: 17, slotLevel: 1 })).toBe('4d10')
  })

  it('résout le soin au niveau d\'emplacement dépensé', () => {
    expect(resolveHealDie(cureWounds.heal!, { characterLevel: 1, slotLevel: 3 })).toBe('3d8')
  })
})

describe('resolveAttackCount', () => {
  it('renvoie le nombre de rayons au niveau du personnage', () => {
    expect(resolveAttackCount(eldritchBlast.multiAttack, { characterLevel: 11, slotLevel: 1 }))
      .toEqual({ count: 3, label: 'Rayon' })
  })

  it('renvoie null sous 2 attaques (rien à distinguer d\'un jet simple)', () => {
    expect(resolveAttackCount(eldritchBlast.multiAttack, { characterLevel: 4, slotLevel: 1 })).toBeNull()
  })

  it('renvoie null sans table multi-attaque', () => {
    expect(resolveAttackCount(null, { characterLevel: 20, slotLevel: 9 })).toBeNull()
    expect(resolveAttackCount({ label: 'Trait' }, { characterLevel: 20, slotLevel: 9 })).toBeNull()
  })
})

describe('parseDiceNotation / diceRange', () => {
  it('découpe une notation simple', () => {
    expect(parseDiceNotation('3d6')).toEqual({ count: 3, sides: 6, flat: 0 })
  })

  it('découpe un bonus fixe porté par la table (Projectile magique, Trait magique)', () => {
    expect(parseDiceNotation('5d4+5')).toEqual({ count: 5, sides: 4, flat: 5 })
  })

  it('découpe une valeur plate (Aide : « 5 » PV)', () => {
    expect(parseDiceNotation('5')).toEqual({ count: 0, sides: 0, flat: 5 })
  })

  it('renvoie null sur une notation inconnue', () => {
    expect(parseDiceNotation('quelques dés')).toBeNull()
    expect(diceRange('quelques dés')).toBeNull()
  })

  it('calcule la fourchette bonus fixe compris', () => {
    expect(diceRange('5d4+5')).toEqual({ min: 10, max: 25 })
    expect(diceRange('2d8', 3)).toEqual({ min: 5, max: 19 })
    expect(diceRange('5')).toEqual({ min: 5, max: 5 })
  })
})

describe('slotScalingEntries — ce que donne un emplacement donné', () => {
  it('rend les dégâts au niveau demandé', () => {
    expect(slotScalingEntries(magicMissile, 3)).toEqual([
      { kind: 'damage', damageType: 'force', label: undefined, die: '5d4+5' },
    ])
  })

  it('rend le soin au niveau demandé', () => {
    expect(slotScalingEntries(cureWounds, 2)).toEqual([
      { kind: 'heal', healType: 'hit_points', die: '2d8' },
    ])
  })

  it('ignore les progressions par niveau de personnage', () => {
    expect(slotScalingEntries(eldritchBlast, 9)).toEqual([])
  })
})

describe('upcastRows — encart « Aux niveaux supérieurs »', () => {
  it('liste un palier par niveau où la valeur change', () => {
    expect(upcastRows(magicMissile).map(r => [r.level, (r.entries[0] as { die: string }).die])).toEqual([
      [2, '4d4+4'], [3, '5d4+5'], [4, '6d4+6'], [5, '7d4+7'],
    ])
  })

  it('n\'affiche pas les niveaux intermédiaires qui ne changent rien (progression creuse)', () => {
    expect(upcastRows(spiritualWeapon).map(r => r.level)).toEqual([4, 6, 8])
  })

  it('est vide pour un sort qui ne monte pas en puissance', () => {
    expect(upcastRows({ level: 1, damages: [{ damage_type: DamageType.Necrotic, damage_at_slot_level: { 1: '1d6' } }] }))
      .toEqual([])
  })

  it('est vide pour un tour de magie (aucun emplacement dépensé)', () => {
    expect(upcastRows(eldritchBlast)).toEqual([])
  })

  it('remonte aussi une attaque supplémentaire gagnée par emplacement', () => {
    const rows = upcastRows({
      level: 2,
      multiAttack: { label: 'Rayon', count_at_slot_level: { 2: 2, 5: 3 } },
    })
    expect(rows).toEqual([{ level: 5, entries: [{ kind: 'attacks', label: 'Rayon', count: 3 }] }])
  })
})

describe('baseSlotLevel / baseCastLevels', () => {
  it('plancher à 1 pour un tour de magie (niveau 0)', () => {
    expect(baseSlotLevel({ level: 0 })).toBe(1)
    expect(baseCastLevels({ level: 0 }, 7)).toEqual({ characterLevel: 7, slotLevel: 1 })
  })

  it('niveau du sort sinon', () => {
    expect(baseCastLevels({ level: 3 }, 7)).toEqual({ characterLevel: 7, slotLevel: 3 })
  })
})

import { describe, it, expect } from 'vitest'
import { bestUnarmoredDefense } from '../../shared/rules/armorClass'
import { armorSpeedPenalty, computeWalkingSpeed, speedBonusParts } from '../../shared/rules/speed'
import type { WornArmor } from '../../shared/rules/speed'
import type { Effect } from '../../server/db/schema/effects'
import { fixed } from '../../shared/utils/formula'
import { BARBARIAN_QUICK_MOVEMENT, BARBARIAN_UNARMORED_DEFENSE } from '../../server/db/seeds/data/barbare'
import { MONK_UNARMORED_DEFENSE, MONK_UNARMORED_MOVEMENT } from '../../server/db/seeds/data/moine'
import { DRACONIC_RESILIENCE } from '../../server/db/seeds/data/ensorceleur'
import { featsData } from '../../server/db/seeds/data/feats'

const context = (class_level: number) => ({
  level: class_level, class_level, prof_bonus: 2, str_mod: 0, dex_mod: 0, con_mod: 0, int_mod: 0, wis_mod: 0, cha_mod: 0,
})
const naked: WornArmor = { heavy: false, body: false, shield: false }

describe('CA sans armure — meilleure source (AideDD : Barbare, Moine, Résistance draconique)', () => {
  const barbarian: Effect[] = [{ type: 'unarmored_defense', value: BARBARIAN_UNARMORED_DEFENSE }]
  const monk: Effect[] = [{ type: 'unarmored_defense', value: MONK_UNARMORED_DEFENSE }]
  const mods = { dex: 2, con: 3, wis: 4 }

  it('sans capacité : 10 + DEX', () => {
    expect(bestUnarmoredDefense([], mods, false)).toMatchObject({ base: 10, abilities: ['dex'], total: 12 })
  })

  it('Barbare : 10 + DEX + CON, bouclier permis', () => {
    expect(bestUnarmoredDefense(barbarian, mods, false).total).toBe(15)
    expect(bestUnarmoredDefense(barbarian, mods, true).total).toBe(15)
  })

  it('Moine : 10 + DEX + SAG, suspendue par un bouclier', () => {
    expect(bestUnarmoredDefense(monk, mods, false).total).toBe(16)
    expect(bestUnarmoredDefense(monk, mods, true)).toMatchObject({ base: 10, abilities: ['dex'], total: 12 })
  })

  it('Résistance draconique : 13 + DEX', () => {
    expect(bestUnarmoredDefense([{ type: 'unarmored_defense', value: DRACONIC_RESILIENCE }], mods, false)).toMatchObject({ base: 13, total: 15 })
  })

  it('plusieurs sources : la meilleure l\'emporte, jamais la somme', () => {
    expect(bestUnarmoredDefense([...barbarian, ...monk], mods, false).total).toBe(16)
  })

  it('une capacité plus faible que 10 + DEX ne fait pas baisser la CA', () => {
    expect(bestUnarmoredDefense(barbarian, { dex: 2, con: -1 }, false).total).toBe(12)
  })
})

describe('bonus de vitesse', () => {
  const part = (effects: Effect[], level: number, worn: WornArmor) =>
    speedBonusParts([{ label: 'Capacité', effects, context: context(level) }], worn)

  it('Déplacement rapide du Barbare : +3 m sauf en armure lourde (armure intermédiaire permise)', () => {
    const effects: Effect[] = [{ type: 'speed_bonus', value: BARBARIAN_QUICK_MOVEMENT }]
    expect(part(effects, 5, naked)).toEqual([{ label: 'Capacité', amount: 3 }])
    expect(part(effects, 5, { heavy: false, body: true, shield: true })).toEqual([{ label: 'Capacité', amount: 3 }])
    expect(part(effects, 5, { heavy: true, body: true, shield: false })).toEqual([])
  })

  it('Déplacement sans armure du Moine : paliers 2/6/10/14/18 (AideDD), rien avec armure ou bouclier', () => {
    const effects: Effect[] = [{ type: 'speed_bonus', value: MONK_UNARMORED_MOVEMENT }]
    const at = (level: number) => part(effects, level, naked)[0]?.amount ?? 0
    expect([1, 2, 5, 6, 9, 10, 13, 14, 17, 18, 20].map(at)).toEqual([0, 3, 3, 4.5, 4.5, 6, 6, 7.5, 7.5, 9, 9])
    expect(part(effects, 10, { heavy: false, body: false, shield: true })).toEqual([])
    expect(part(effects, 10, { heavy: false, body: true, shield: false })).toEqual([])
  })

  it('un bonus sans condition (Mobile, objet) s\'applique toujours, un malus se retranche', () => {
    expect(part([{ type: 'speed_bonus', value: { amount: fixed(3) } }], 1, { heavy: true, body: true, shield: true })).toEqual([{ label: 'Capacité', amount: 3 }])
    expect(part([{ type: 'speed_bonus', value: { amount: fixed(-3) } }], 1, naked)).toEqual([{ label: 'Capacité', amount: -3 }])
  })

  it('la formule d\'une capacité se lit au niveau de SA classe', () => {
    const effects: Effect[] = [{ type: 'speed_bonus', value: MONK_UNARMORED_MOVEMENT }]
    const sources = [
      { label: 'Moine 6', effects, context: context(6) },
      { label: 'Moine 2', effects, context: context(2) },
    ]
    expect(speedBonusParts(sources, naked)).toEqual([{ label: 'Moine 6', amount: 4.5 }, { label: 'Moine 2', amount: 3 }])
  })
})

describe('walking_speed = vitesse de base', () => {
  it('aucun don du seed ne l\'emploie : un bonus de vitesse est un speed_bonus (la fiche n\'additionne pas les vitesses de base)', () => {
    const types = featsData.flatMap(f => f.effects.map(e => e.type))
    expect(types).not.toContain('walking_speed')
    expect(types).toContain('speed_bonus')
  })
})

describe('pénalité d\'armure (AideDD, Armures : colonne Force)', () => {
  const chainMail = { name: 'Cotte de mailles', armorType: 'heavy', strengthRequirement: 13 }
  const dwarf: Effect[] = [{ type: 'equipment_penalty', value: { penalty: 'speed', armor_type: 'heavy', modifier: 'none', override: true } }]

  it('Force insuffisante : -3 m', () => {
    expect(armorSpeedPenalty(chainMail, 12, [])).toMatchObject({ amount: 3, source: 'Cotte de mailles' })
  })

  it('Force suffisante (égale à la valeur) : aucune pénalité', () => {
    expect(armorSpeedPenalty(chainMail, 13, [])).toBeNull()
  })

  it('armure sans colonne Force (broigne, armure intermédiaire) : aucune pénalité', () => {
    expect(armorSpeedPenalty({ name: 'Broigne', armorType: 'heavy' }, 3, [])).toBeNull()
    expect(armorSpeedPenalty(null, 3, [])).toBeNull()
  })

  it('Nain : vitesse non réduite par l\'armure lourde (E7)', () => {
    expect(armorSpeedPenalty(chainMail, 8, dwarf)).toBeNull()
  })

  it('la neutralisation vise l\'armure lourde, pas un autre type', () => {
    expect(armorSpeedPenalty({ name: 'Cuirasse', armorType: 'medium', strengthRequirement: 13 }, 8, dwarf)).not.toBeNull()
  })

  it('vitesse finale : base + bonus - pénalité, jamais négative', () => {
    expect(computeWalkingSpeed(9, [{ label: 'Mobile', amount: 3 }], armorSpeedPenalty(chainMail, 12, []))).toBe(9)
    expect(computeWalkingSpeed(1.5, [], armorSpeedPenalty(chainMail, 12, []))).toBe(0)
  })
})

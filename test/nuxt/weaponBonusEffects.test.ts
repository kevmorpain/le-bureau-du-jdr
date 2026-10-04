import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { baseScores, classFeature, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Bonus fixes aux jets d'attaque et de dégâts d'arme portés par une capacité, un objet ou un effet temporaire
// (Bracelets d'archerie : +2 aux dégâts des armes à distance, lien requis), distincts du `magicBonus` de l'arme.
// Un effet `advantage` à condition libre se lit dans les défenses.

const longbow = { weapon_category: 'martial_ranged', weapon_properties: ['two_handed'], damage_dice: '1d8', damage_type: 'piercing', range: { normal: 45, long: 180 } }
const longsword = { weapon_category: 'martial_melee', weapon_properties: ['versatile'], damage_dice: '1d8', versatile_damage: '1d10', damage_type: 'slashing' }

const bracers: Effect[] = [{ type: 'weapon_damage_bonus', value: { amount: 2, weapons: 'ranged' } }]
const weapons = (id: number) => [
  entry(id, 1, 'Arc long', 'weapon', longbow),
  entry(id, 2, 'Épée longue', 'weapon', longsword),
]

describe('fiche — bonus d\'attaque et de dégâts d\'arme', () => {
  const scores = baseScores(10, 14, 10, 10)

  it('sans effet, rien ne change : DEX +2 à l\'arc, FOR +0 à l\'épée', async () => {
    const s = await mount({ scores, worn: weapons })
    const bow = s.equippedWeaponStats.value.find(w => w.name === 'Arc long')!
    expect([bow.attackBonus, bow.damageBonus, bow.attackParts, bow.damageParts]).toEqual([2, 2, [], []])
  })

  it('un objet lié à bonus de dégâts à distance ne touche que les armes à distance', async () => {
    const s = await mount({
      scores,
      worn: id => [
        ...weapons(id),
        entry(id, 3, 'Bracelets d\'archerie', 'equipment', {}, bracers, { attuned: true, requiresAttunement: true }),
      ],
    })
    const bow = s.equippedWeaponStats.value.find(w => w.name === 'Arc long')!
    const sword = s.equippedWeaponStats.value.find(w => w.name === 'Épée longue')!
    expect(bow.damageBonus).toBe(4)
    expect(bow.damageParts).toEqual([{ label: 'Bracelets d\'archerie', amount: 2 }])
    expect(bow.attackBonus).toBe(2)
    expect(sword.damageBonus).toBe(0)
    expect(sword.damageParts).toEqual([])
  })

  it('sans lien, l\'objet qui en exige un ne donne rien', async () => {
    const s = await mount({
      scores,
      worn: id => [
        ...weapons(id),
        entry(id, 3, 'Bracelets d\'archerie', 'equipment', {}, bracers, { attuned: false, requiresAttunement: true }),
      ],
    })
    expect(s.equippedWeaponStats.value.find(w => w.name === 'Arc long')!.damageBonus).toBe(2)
  })

  it('une capacité ou un effet temporaire s\'ajoutent à l\'attaque de toutes les armes, un malus se retranche', async () => {
    const s = await mount({
      scores,
      features: [classFeature(1, 'Don', 0, 1, [{ type: 'weapon_attack_bonus', value: { amount: 1, weapons: 'all' } }], 'feat')],
      temporaryEffects: [
        { id: 1, name: 'Malédiction', active: true, effects: [{ type: 'weapon_attack_bonus', value: { amount: -2, weapons: 'melee' } }] },
        { id: 2, name: 'Inactif', active: false, effects: [{ type: 'weapon_attack_bonus', value: { amount: 5, weapons: 'all' } }] },
      ],
      worn: weapons,
    })
    const bow = s.equippedWeaponStats.value.find(w => w.name === 'Arc long')!
    const sword = s.equippedWeaponStats.value.find(w => w.name === 'Épée longue')!
    expect(bow.attackBonus).toBe(2 + 1)
    expect(sword.attackBonus).toBe(0 + 1 - 2)
    expect(sword.attackParts).toEqual([{ label: 'Capacités', amount: 1 }, { label: 'Malédiction', amount: -2 }])
  })

  it('l\'avantage à condition libre d\'un objet apparaît dans les défenses, jet de caractéristique compris', async () => {
    const s = await mount({
      scores,
      worn: id => [entry(id, 4, 'Amulette', 'equipment', {}, [
        { type: 'advantage', value: { rollType: 'saving_throw', ability: 'wis', condition: 'contre l\'effroi' } },
        { type: 'advantage', value: { rollType: 'check', ability: 'all', condition: 'dans le noir' } },
        { type: 'advantage', value: { rollType: 'check', ability: 'all', condition: '' } },
      ])],
    })
    expect(s.defenseEntries.value.map(d => d.label)).toEqual(['contre l\'effroi (JdS)', 'dans le noir (JdC)'])
  })
})

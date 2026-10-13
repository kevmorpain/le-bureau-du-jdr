import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { KN_CREATURE_TYPES } from '../../shared/ker-nethalas/catalog/creatureTypes'
import { KN_DAMAGE_TYPES } from '../../shared/ker-nethalas/catalog/damageTypes'
import { knItemSchema, type KnItem } from '../../shared/ker-nethalas/inventory'
import type { KnCatalogItem } from '../../shared/ker-nethalas/items'
import { knApplyLoot, knRollLoot, type KnLootContent } from '../../shared/ker-nethalas/loot'
import {
  knDamageTypeAt,
  knEnemyTypeAt,
  knIdentifyMagic,
  knInstantiateProperty,
  knMagicContentSchema,
  knMagicTypeAt,
  knPropertyCount,
  knRarityAt,
  type KnMagicContent,
  type KnMagicEntry,
  type KnMagicLabels,
} from '../../shared/ker-nethalas/magic'
import { knMagicSchema, type KnMagic } from '../../shared/ker-nethalas/magicSchema'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
const sequence = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]!
}
// Le résultat voulu d'un dé à `sides` faces.
const die = (sides: number, result: number) => (result - 0.5) / sides

const labels: KnMagicLabels = {
  damage: Object.fromEntries(KN_DAMAGE_TYPES.map(type => [type, `dégâts ${type}`])) as KnMagicLabels['damage'],
  enemy: Object.fromEntries(KN_CREATURE_TYPES.map(type => [type, `adversaire ${type}`])) as KnMagicLabels['enemy'],
}

const entry = (min: number, max: number, over: Partial<KnMagicEntry> = {}): KnMagicEntry => ({ min, max, text: `entrée ${min}`, ...over })

const full = (entries: KnMagicEntry[]) => ({ die: 20 as const, entries })

describe('tables du livre', () => {
  it('le D8 du type, le D10 de la rareté, le D20 des dégâts et le D8 des adversaires', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(knMagicTypeAt)).toEqual(['weapon', 'armor', 'belt', 'boots', 'gloves', 'amulet', 'ring', 'ring'])
    expect([1, 5, 6, 8, 9, 10].map(roll => knRarityAt(roll))).toEqual(['uncommon', 'uncommon', 'rare', 'rare', 'epic', 'epic'])
    expect(['uncommon', 'rare', 'epic'].map(rarity => knPropertyCount(rarity as 'uncommon'))).toEqual([1, 2, 3])
    expect(knEnemyTypeAt(1)).toBe('animal')
    expect(knEnemyTypeAt(8)).toBe('construct')
  })

  it('le D20 des dégâts couvre les quatorze types, les trois physiques et trois autres sur deux faces', () => {
    const counts = new Map<string, number>()
    for (let roll = 1; roll <= 20; roll++) counts.set(knDamageTypeAt(roll), (counts.get(knDamageTypeAt(roll)) ?? 0) + 1)

    expect(counts.size).toBe(14)
    expect([...counts].filter(([, count]) => count === 2).map(([type]) => type).sort()).toEqual(['arcane', 'bludgeoning', 'force', 'necrotic', 'piercing', 'slashing'])
    expect(knDamageTypeAt(1)).toBe('acid')
    expect(knDamageTypeAt(20)).toBe('slashing')
  })
})

describe('propriété d\'un objet magique', () => {
  it('un montant selon la rareté, rempli dans le texte et dans la mécanique', () => {
    const endurance = entry(1, 2, {
      text: 'Augmente votre Endurance de {n}.',
      amount: { byRarity: [5, 10, 15] },
      mech: [{ k: 'modifier', targets: ['endurance'], amount: 'n' }],
    })

    expect(knInstantiateProperty(endurance, 'rare', labels)).toEqual({ text: 'Augmente votre Endurance de 10.', mech: [{ k: 'modifier', targets: ['endurance'], amount: 10 }] })
    expect(knInstantiateProperty(endurance, 'epic', labels).mech).toEqual([{ k: 'modifier', targets: ['endurance'], amount: 15 }])
  })

  it('un montant tiré aux dés, une seule fois', () => {
    const aether = entry(15, 15, { text: 'Augmente votre Éther maximum de {n}.', amount: { dice: d(1, 10) }, mech: [{ k: 'maxVital', vital: 'aether', amount: 'n' }] })

    expect(knInstantiateProperty(aether, 'uncommon', labels, () => die(10, 7))).toMatchObject({ text: 'Augmente votre Éther maximum de 7.', mech: [{ amount: 7 }] })
  })

  it('un type de dégâts tiré : D20 sur la table, dans le texte et dans la mécanique', () => {
    const reduction = entry(1, 1, {
      text: 'Réduit les dégâts {damage} de {n}.',
      roll: 'damage',
      amount: { byRarity: [1, 2, 3] },
      mech: [{ k: 'reduce', damage: 'rolled', amount: 'n' }],
    })

    expect(knInstantiateProperty(reduction, 'epic', labels, () => die(20, 20))).toEqual({
      text: 'Réduit les dégâts dégâts slashing de 3.',
      mech: [{ k: 'reduce', damage: 'slashing', amount: 3 }],
    })
  })

  it('un type d\'adversaire tiré, et un dé de dégâts du type tiré', () => {
    const vs = entry(8, 8, { text: 'Plus de dégâts contre {enemy}.', roll: 'enemy', amount: { byRarity: [1, 2, 3] }, mech: [{ k: 'damageVs', enemy: 'rolled', amount: 'n' }] })
    const extra = entry(1, 1, { text: 'D4 de {damage}.', roll: 'damage', mech: [{ k: 'damage', dice: d(1, 4), type: 'rolled' }] })

    expect(knInstantiateProperty(vs, 'rare', labels, () => die(8, 6)).mech).toEqual([{ k: 'damageVs', enemy: 'undead', amount: 2 }])
    expect(knInstantiateProperty(extra, 'rare', labels, () => die(20, 9)).mech).toEqual([{ k: 'damage', dice: d(1, 4), type: 'fire' }])
  })

  it('un soin par usage limité porte son bonus selon la rareté, et une compétence à choisir est signalée', () => {
    const heal = entry(16, 16, {
      text: 'Soigne D10+{n} Blessures.',
      amount: { byRarity: [2, 3, 4] },
      mech: [{ k: 'use', limit: 'campRest', label: 'Soigner D10+{n}', heal: { count: 1, sides: 10, bonus: 'n' } }],
    })
    const skill = entry(13, 13, { text: 'Une compétence au choix +20.', choose: 'skill', mech: [{ k: 'modifier', targets: [], amount: 20 }] })

    expect(knInstantiateProperty(heal, 'epic', labels).mech).toEqual([{ k: 'use', limit: 'campRest', label: 'Soigner D10+4', heal: { count: 1, sides: 10, bonus: 4 } }])
    expect(knInstantiateProperty(skill, 'rare', labels)).toMatchObject({ choose: 'skill' })
  })
})

describe('harmonisation', () => {
  const content: KnMagicContent = {
    tables: {
      ring: full([entry(1, 10, { text: 'dix premiers' }), entry(11, 20, { text: 'dix derniers' })]),
      weapon: undefined,
      armor: undefined,
      belt: undefined,
      boots: undefined,
      gloves: undefined,
    },
    peculiarities: { die: 100, entries: [{ min: 1, max: 50, text: 'Il est humide.' }, { min: 51, max: 100, text: 'Il scintille.' }] },
  }
  const unknown: KnMagic = { table: 'ring', identified: false, properties: [], peculiarities: [] }

  it('la rareté dit combien de propriétés se tirent, chacune sur le D20 de la table du type', () => {
    // D10 = 9 (épique), puis D20 = 3, 15, 20
    const result = knIdentifyMagic(unknown, content, labels, {}, sequence(die(10, 9), die(20, 3), die(20, 15), die(20, 20)))

    expect('magic' in result && result.magic).toMatchObject({ identified: true, rarity: 'epic', peculiarities: [] })
    expect('magic' in result && result.magic.properties.map(property => property.text)).toEqual(['dix premiers', 'dix derniers', 'dix derniers'])
    expect('rolls' in result && result.rolls).toEqual({ rarity: 9, properties: [3, 15, 20], peculiarities: [] })
  })

  it('une rareté commune ne tire qu\'une propriété ; la peculiarité se tire en plus, si on la veut', () => {
    const one = knIdentifyMagic(unknown, content, labels, { peculiarity: true }, sequence(die(10, 2), die(20, 4), die(100, 80)))
    const none = knIdentifyMagic(unknown, content, labels, {}, sequence(die(10, 2), die(20, 4)))

    expect('magic' in one && one.magic).toMatchObject({ rarity: 'uncommon', properties: [{ text: 'dix premiers' }], peculiarities: ['Il scintille.'] })
    expect('magic' in none && none.magic.peculiarities).toEqual([])
  })

  it('un résultat « tirez deux fois » donne deux autres peculiarités, sans en redemander', () => {
    const twice: KnMagicContent = {
      ...content,
      peculiarities: { die: 100, entries: [{ min: 1, max: 40, text: 'Il est humide.' }, { min: 41, max: 80, text: 'Il scintille.' }, { min: 81, max: 100, text: 'Tirez deux fois.', meta: 'twice' }] },
    }
    // D10, D20, puis D100 = 90 (deux fois), 95 (deux fois encore : ignoré), 10, 60
    const result = knIdentifyMagic(unknown, twice, labels, { peculiarity: true }, sequence(die(10, 2), die(20, 4), die(100, 90), die(100, 95), die(100, 10), die(100, 60)))

    expect('magic' in result && result.magic.peculiarities).toEqual(['Il est humide.', 'Il scintille.'])
  })

  it('rend la table qui manque plutôt que de tirer à vide', () => {
    expect(knIdentifyMagic({ ...unknown, table: 'belt' }, content, labels)).toEqual({ missing: 'belt' })
  })

  it('le jeu de données refuse une table qui ne couvre pas son dé', () => {
    expect(knMagicContentSchema.safeParse({ tables: { ring: full([entry(1, 10)]) } }).success).toBe(false)
    expect(knMagicContentSchema.safeParse({ tables: { ring: full([entry(1, 20)]) } }).success).toBe(true)
    expect(knMagicContentSchema.safeParse({ tables: { ring: full([entry(1, 20, { mech: [{ k: 'modifier', targets: ['endurance'], amount: 'n' }] })]) } }).success).toBe(true)
    expect(knMagicContentSchema.safeParse({ tables: { ring: full([entry(1, 20, { mech: [{ k: 'modifier', targets: ['luck'], amount: 1 }] } as never)]) } }).success).toBe(false)
  })

  it('un objet figé par l\'harmonisation passe le schéma de l\'inventaire', () => {
    const result = knIdentifyMagic(unknown, content, labels, {}, sequence(die(10, 1), die(20, 1)))
    const item: KnItem = { id: 'i1', name: 'Anneau', kind: 'ring', weight: 'light', quantity: 1, place: 'bag', ...('magic' in result ? { magic: result.magic } : {}) }

    expect(knItemSchema.safeParse(item).success).toBe(true)
    expect(knMagicSchema.safeParse(unknown).success).toBe(true)
  })
})

describe('butin magique', () => {
  const content: KnLootContent = {
    valuable: { die: 20, entries: [{ min: 1, max: 20, text: 'Objet magique', drop: { kind: 'magic' } }] },
    weapons: {
      die: 100,
      entries: [
        { min: 1, max: 50, text: 'Épée factice', drop: { kind: 'item', ref: 'fakeSword' } },
        { min: 51, max: 100, text: 'Arme magique', drop: { kind: 'magic', item: 'weapon' } },
      ],
    },
    armor: { die: 10, entries: [{ min: 1, max: 10, text: 'Maille', drop: { kind: 'item', ref: 'fakeMail' } }] },
  }
  const catalog: KnCatalogItem[] = [
    { key: 'fakeSword', name: 'Épée factice', kind: 'weapon', weight: 'normal', value: 20, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [] } },
    { key: 'fakeMail', name: 'Maille factice', kind: 'torso', weight: 'normal', value: 150, protection: 2, integrity: 8 },
  ]
  const start = { inventory: [] as KnItem[], provisions: emptyKnProvisions() }
  const rolled = (...values: number[]) => {
    const result = knRollLoot(content, 'valuable', sequence(...values))
    if ('missing' in result) throw new Error('table manquante')
    return result
  }

  it('le type se tire au D8 ; une arme prend pour base un objet ordinaire, en relançant sur l\'arme magique', () => {
    // D20 = 1 (valeur), D8 = 1 (arme), puis D100 = 80 (arme magique, relancée) et 10 (épée)
    const result = rolled(die(20, 1), die(8, 1), die(100, 80), die(100, 10))

    expect(result.magic).toEqual({ type: 'weapon', baseRef: 'fakeSword' })
    expect(rolled(die(20, 1), die(8, 2)).magic).toEqual({ type: 'armor', baseRef: 'fakeMail' })
  })

  it('l\'objet arrive non harmonisé, en version ordinaire trouvée : une arme garde ses statistiques, une armure son Intégrité d\'un cran en moins', () => {
    const sword = knApplyLoot(start, rolled(die(20, 1), die(8, 1), die(100, 10)), catalog).state.inventory[0]!
    const mail = knApplyLoot(start, rolled(die(20, 1), die(8, 2)), catalog).state.inventory[0]!

    expect(sword).toMatchObject({ name: 'Épée factice', ref: 'fakeSword', weapon: { skill: 'bladedWeapons' }, magic: { table: 'weapon', identified: false, properties: [] } })
    expect(mail).toMatchObject({ name: 'Maille factice', integrity: { max: 8, current: 6 }, magic: { table: 'armor', identified: false } })
    expect(knItemSchema.safeParse(sword).success).toBe(true)
  })

  it('une ceinture, des bottes, des gants ou un anneau n\'ont pas de base : un objet ordinaire du bon type', () => {
    const belt = knApplyLoot(start, rolled(die(20, 1), die(8, 3)), catalog).state.inventory[0]!
    const ring = knApplyLoot(start, rolled(die(20, 1), die(8, 8)), catalog).state.inventory[0]!

    expect(belt).toMatchObject({ name: 'Ceinture', kind: 'belt', magic: { table: 'belt' } })
    expect(ring).toMatchObject({ name: 'Anneau', kind: 'ring', magic: { table: 'ring' } })
  })

  it('une amulette n\'entre pas dans l\'inventaire : c\'est une Maîtrise à tirer', () => {
    const applied = knApplyLoot(start, rolled(die(20, 1), die(8, 6)), catalog)

    expect(applied).toMatchObject({ amulet: true, lines: [] })
    expect(applied.state.inventory).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { KN_HIT_LOCATION_TABLES, KN_HIT_LOCATION_TABLE_KEYS, knHitLocation, knHitLocationsOf } from '../../shared/ker-nethalas/catalog/hitLocations'
import { KN_CREATURE_TYPE_RULES, KN_CREATURE_TYPES } from '../../shared/ker-nethalas/catalog/creatureTypes'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import {
  knArmorAt,
  knBestiaryContentSchema,
  knCreatureAtLevel,
  knCreatureSchema,
  knEncounterTable,
  knFindCreature,
} from '../../shared/ker-nethalas/creatures'
import { emptyKnRun, knCurrentDomain, knCurrentVisit, knRecordCreature, knRecordOverseer, knRunSchema, knStartVisit } from '../../shared/ker-nethalas/run'
import { KN_EXPLORATION_TABLES, knRollTableSchema } from '../../shared/ker-nethalas/tables'
import { fakeCreature } from '../fixtures/knCreatures'

describe('tables de localisation', () => {
  it('chaque table couvre le D20 sans trou ni recouvrement', () => {
    for (const table of KN_HIT_LOCATION_TABLE_KEYS) {
      let expected = 1
      for (const [from, to] of KN_HIT_LOCATION_TABLES[table]) {
        expect(from, table).toBe(expected)
        expected = to + 1
      }
      expect(expected, table).toBe(21)
    }
  })

  it('lit une localisation selon le jet et la table', () => {
    expect([knHitLocation('humanoid', 1), knHitLocation('humanoid', 10), knHitLocation('humanoid', 20)]).toEqual(['rightLeg', 'chest', 'head'])
    expect(knHitLocation('serpentoid', 17)).toBe('body')
    expect(knHitLocation('serpentoid', 18)).toBe('head')
    expect(() => knHitLocation('humanoid', 21)).toThrow(RangeError)
  })

  it('liste les localisations d\'une table une fois chacune', () => {
    expect(knHitLocationsOf('serpentoid')).toEqual(['body', 'head'])
    expect(knHitLocationsOf('humanoid')).toHaveLength(7)
  })
})

describe('règles des types de créature', () => {
  it('chaque type a ses règles, et un Mort-vivant est vulnérable au Sacré', () => {
    expect(Object.keys(KN_CREATURE_TYPE_RULES).sort()).toEqual([...KN_CREATURE_TYPES].sort())
    expect(KN_CREATURE_TYPE_RULES.undead.vulnerable).toEqual(['holy'])
    expect(KN_CREATURE_TYPE_RULES.undead.restored).toEqual(['necrotic'])
    expect(KN_CREATURE_TYPE_RULES.elemental.restoredByAffinity).toBe(true)
  })
})

describe('fiche d\'une créature', () => {
  it('accepte une fiche complète', () => {
    expect(knCreatureSchema.safeParse(fakeCreature()).success).toBe(true)
  })

  it('refuse un point faible hors de la table de localisation', () => {
    expect(knCreatureSchema.safeParse(fakeCreature({ hitLocation: { table: 'serpentoid', weakSpot: 'chest' } })).success).toBe(false)
    expect(knCreatureSchema.safeParse(fakeCreature({ hitLocation: undefined })).success).toBe(true)
  })

  it('les actions couvrent le D6 sans trou', () => {
    const action = (min: number, max: number) => ({ min, max, name: 'A', text: 't' })

    expect(knCreatureSchema.safeParse(fakeCreature({ actions: [action(1, 2), action(3, 6)] })).success).toBe(true)
    expect(knCreatureSchema.safeParse(fakeCreature({ actions: [action(1, 2), action(4, 6)] })).success).toBe(false)
    expect(knCreatureSchema.safeParse(fakeCreature({ actions: [action(1, 5)] })).success).toBe(false)
  })

  it('un trait à valeur en porte une, les autres non', () => {
    expect(knCreatureSchema.safeParse(fakeCreature({ traits: [{ key: 'penetrating' }] })).success).toBe(false)
    expect(knCreatureSchema.safeParse(fakeCreature({ traits: [{ key: 'alert', value: 1 }] })).success).toBe(false)
    expect(knCreatureSchema.safeParse(fakeCreature({ traits: [{ key: 'ruthlessness', value: 1 }, { key: 'savage' }] })).success).toBe(true)
  })

  it('refuse un type, un trait ou une localisation inconnus', () => {
    expect(knCreatureSchema.safeParse({ ...fakeCreature(), types: ['dragon'] }).success).toBe(false)
    expect(knCreatureSchema.safeParse({ ...fakeCreature(), traits: [{ key: 'flying' }] }).success).toBe(false)
    expect(knCreatureSchema.safeParse(fakeCreature({ armor: [{ points: 1, locations: ['tail' as never] }] })).success).toBe(false)
  })

  it('le bestiaire refuse deux fiches de même clé', () => {
    expect(knBestiaryContentSchema.safeParse([fakeCreature(), fakeCreature({ key: 'other' })]).success).toBe(true)
    expect(knBestiaryContentSchema.safeParse([fakeCreature(), fakeCreature()]).success).toBe(false)
    expect(knBestiaryContentSchema.safeParse([]).success).toBe(false)
  })

  it('retrouve une fiche par sa clé', () => {
    const bestiary = [fakeCreature(), fakeCreature({ key: 'other', name: 'Autre' })]

    expect(knFindCreature(bestiary, 'other')?.name).toBe('Autre')
    expect(knFindCreature(bestiary, 'missing')).toBeUndefined()
    expect(knFindCreature(null, 'other')).toBeUndefined()
    expect(knFindCreature(bestiary, undefined)).toBeUndefined()
  })
})

describe('adaptation au niveau', () => {
  const creature = fakeCreature()

  it('la Santé suit le niveau du survivant : base + par niveau', () => {
    expect(knCreatureAtLevel(creature, 1).health).toBe(12)
    expect(knCreatureAtLevel(creature, 3).health).toBe(20)
  })

  it('« après le niveau 5 » s\'applique à partir du niveau 6', () => {
    expect(knCreatureAtLevel(creature, 5).health).toBe(8 + 4 * 5)
    expect(knCreatureAtLevel(creature, 6).health).toBe(8 + 4 * 6 + 5)
  })

  it('les paliers dépassés s\'ajoutent tous', () => {
    const level11 = knCreatureAtLevel(creature, 11)

    expect(level11.health).toBe(8 + 44 + 5)
    expect(level11.combatSkill).toBe(60)
    expect(level11.damageBonuses).toEqual([{ count: 1, sides: 6, bonus: 0 }, { count: 1, sides: 8, bonus: 0 }])
    expect(level11.armor).toHaveLength(2)
  })

  it('une créature à Santé fixe ne grossit pas avec le niveau', () => {
    const fixed = fakeCreature({ health: { base: 30 }, levelAdaptation: [] })

    expect([knCreatureAtLevel(fixed, 1).health, knCreatureAtLevel(fixed, 12).health]).toEqual([30, 30])
  })

  it('l\'armure d\'un palier s\'ajoute sur toutes les localisations sauf celles exclues', () => {
    const { armor } = knCreatureAtLevel(creature, 6)

    expect(knArmorAt(armor, 'chest')).toBe(2)
    expect(knArmorAt(armor, 'head')).toBe(1)
    expect(knArmorAt(knCreatureAtLevel(creature, 1).armor, 'head')).toBe(0)
  })
})

describe('tirage de la rencontre', () => {
  it('un D6 choisit la table : 1-3 A, 4-6 B', () => {
    expect([1, 3, 4, 6].map(knEncounterTable)).toEqual(['A', 'A', 'B', 'B'])
  })

  it('les tables de rencontre et d\'Overseer sont des jeux de données du bon dé', () => {
    expect(KN_EXPLORATION_TABLES).toMatchObject({ encountersA: { die: 20 }, encountersB: { die: 20 }, overseers: { die: 10 } })
    for (const name of ['encountersA', 'encountersB', 'overseers', 'bestiary']) {
      expect(Object.keys(KN_CONTENT_SCHEMAS), name).toContain(name)
      expect(KN_CONTENT_NAME_RE.test(name), name).toBe(true)
    }
  })

  it('une entrée de table désigne une fiche par sa clé', () => {
    const table = { die: 10, entries: [{ min: 1, max: 10, text: 'Nom', ref: 'fakeBeast' }] }

    expect(knRollTableSchema(10).safeParse(table).success).toBe(true)
    expect(knRollTableSchema(10).safeParse({ die: 10, entries: [{ min: 1, max: 10, text: 'Nom', ref: 'Pas une clé' }] }).success).toBe(false)
  })
})

describe('créatures et Overseer dans le run', () => {
  const room = () => knStartVisit(emptyKnRun(), 'room')
  const visit = (run: ReturnType<typeof room>) => knCurrentVisit(run)!

  it('garde chaque tirage de créature, dans l\'ordre, jusqu\'à la limite', () => {
    let run = knRecordCreature(room(), 2, 7)
    run = knRecordCreature(run, 5, 20)

    expect(visit(run).creatures).toEqual([{ d6: 2, d20: 7 }, { d6: 5, d20: 20 }])
    for (let i = 0; i < 6; i++) run = knRecordCreature(run, 1, 1)
    expect(visit(run).creatures).toHaveLength(4)
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('pas de créature tirée dans une zone déjà explorée', () => {
    const revisit = knStartVisit(emptyKnRun(), 'revisit')

    expect(knRecordCreature(revisit, 1, 1)).toEqual(revisit)
    expect(knRecordCreature(emptyKnRun(), 1, 1)).toEqual(emptyKnRun())
  })

  it('l\'Overseer du Domaine se tire une seule fois', () => {
    const run = knRecordOverseer(emptyKnRun(), 4)

    expect(knCurrentDomain(run).overseer).toEqual({ roll: 4 })
    expect(knCurrentDomain(knRecordOverseer(run, 9)).overseer).toEqual({ roll: 4 })
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('refuse un tirage hors des dés', () => {
    const bad = { ...room(), domains: [{ ...room().domains[0]!, overseer: { roll: 11 } }] }

    expect(knRunSchema.safeParse(bad).success).toBe(false)
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { learnedSpellsError, type LearnedSpellsInput } from '../../server/utils/spellLearning'
import { replayMigrations } from '../fixtures/migrations'

// Sorts appris (création et level-up) : bornes du PHB 2014 vérifiées par le serveur, sans lui faire
// confiance sur la liste de classe, le niveau de sort ni le nombre.

const WIZARD = 1
const CLERIC = 2
const FIGHTER = 3
const WIZARD_5_5 = 4

const SPELL = { fireBolt: 10, light: 11, mageHand: 12, magicMissile: 20, shield: 21, sleep: 22, fireball: 30, cureWounds: 40, bless: 41 }

type Cls = LearnedSpellsInput['cls']
const wizard: Cls = { id: WIZARD, name: 'Magicien', ruleset: '5', spellcastingType: 'full' }
const cleric: Cls = { id: CLERIC, name: 'Clerc', ruleset: '5', spellcastingType: 'full' }
const fighter: Cls = { id: FIGHTER, name: 'Guerrier', ruleset: '5', spellcastingType: 'none' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

const check = (over: Partial<LearnedSpellsInput> & Pick<LearnedSpellsInput, 'cls' | 'spellIds'>) =>
  learnedSpellsError(db, { fromLevel: 2, toLevel: 3, alreadyKnownIds: [], ...over })

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.magicSchools).values({ id: 1, name: 'Évocation' })
  await db.insert(schema.classes).values([
    { id: WIZARD, name: 'Magicien', hitDice: '1d6', spellcastingType: 'full' },
    { id: CLERIC, name: 'Clerc', hitDice: '1d8', spellcastingType: 'full' },
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
    { id: WIZARD_5_5, name: 'Magicien', hitDice: '1d6', spellcastingType: 'full', ruleset: '5.5' },
  ])
  const spell = (id: number, name: string, level: number) =>
    ({ id, name, level, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 })
  await db.insert(schema.spells).values([
    spell(SPELL.fireBolt, 'Trait de feu', 0), spell(SPELL.light, 'Lumière', 0), spell(SPELL.mageHand, 'Main de mage', 0),
    spell(SPELL.magicMissile, 'Projectile magique', 1), spell(SPELL.shield, 'Bouclier', 1), spell(SPELL.sleep, 'Sommeil', 1),
    spell(SPELL.fireball, 'Boule de feu', 3),
    spell(SPELL.cureWounds, 'Soins', 1), spell(SPELL.bless, 'Bénédiction', 1),
  ])
  await db.insert(schema.spellClasses).values([
    ...[SPELL.fireBolt, SPELL.light, SPELL.mageHand, SPELL.magicMissile, SPELL.shield, SPELL.sleep, SPELL.fireball].map(spellId => ({ spellId, classId: WIZARD })),
    ...[SPELL.light, SPELL.cureWounds, SPELL.bless].map(spellId => ({ spellId, classId: CLERIC })),
  ])
}, 60000)

describe('learnedSpellsError — level-up d\'un lanceur à grimoire (Magicien 2 → 3)', () => {
  it('deux sorts de grimoire de niveau 1 et rien d\'autre : accepté', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.magicMissile, SPELL.shield] })).toBeNull()
  })

  it('aucun choix : rien à valider', async () => {
    expect(await check({ cls: wizard, spellIds: [] })).toBeNull()
  })

  it('un troisième sort : trop de sorts', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.magicMissile, SPELL.shield, SPELL.sleep] })).toMatch(/Trop de sorts \(3 pour 2/)
  })

  it('un sort mineur alors que le niveau 3 n\'en accorde pas : trop de sorts mineurs', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.fireBolt] })).toMatch(/Trop de sorts mineurs/)
  })

  it('le sort mineur du niveau 4 : accepté, avec ses deux sorts de grimoire', async () => {
    expect(await check({ cls: wizard, fromLevel: 3, toLevel: 4, spellIds: [SPELL.fireBolt, SPELL.magicMissile, SPELL.shield] })).toBeNull()
  })

  it('un sort de niveau 3 au niveau 3 de Magicien (emplacements de niveau 2 au plus) : refusé', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.fireball] })).toMatch(/dépasse le niveau 2/)
  })

  it('un sort hors de la liste de la classe : refusé', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.cureWounds] })).toMatch(/n'est pas dans la liste de la classe Magicien/)
  })

  it('un sort déjà sur la fiche : refusé', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.magicMissile], alreadyKnownIds: [SPELL.magicMissile] })).toMatch(/déjà sur la fiche/)
  })

  it('le même sort deux fois : refusé', async () => {
    expect(await check({ cls: wizard, spellIds: [SPELL.magicMissile, SPELL.magicMissile] })).toMatch(/plusieurs fois/)
  })

  it('un sort inconnu de la base : refusé', async () => {
    expect(await check({ cls: wizard, spellIds: [9999] })).toMatch(/introuvable/)
  })
})

describe('learnedSpellsError — multiclassage vers une classe (niveau 0 → 1)', () => {
  it('Magicien 1 : un grimoire de six sorts de niveau 1 au plus, trois sorts mineurs', async () => {
    const six = [SPELL.magicMissile, SPELL.shield, SPELL.sleep]
    expect(await check({ cls: wizard, fromLevel: 0, toLevel: 1, spellIds: [SPELL.fireBolt, SPELL.light, SPELL.mageHand, ...six] })).toBeNull()
  })

  it('Magicien 1 : un sort de niveau 2 est hors de portée du niveau 1 de la classe', async () => {
    expect(await check({ cls: wizard, fromLevel: 0, toLevel: 1, spellIds: [SPELL.fireball] })).toMatch(/dépasse le niveau 1/)
  })
})

describe('learnedSpellsError — lanceur qui prépare (Clerc)', () => {
  it('au level-up, il n\'apprend aucun sort de niveau 1+ (il les prépare)', async () => {
    expect(await check({ cls: cleric, spellIds: [SPELL.cureWounds] })).toMatch(/Trop de sorts \(1 pour 0/)
  })

  it('à la création, le builder range ses sorts préparés dans la liste : accepté', async () => {
    expect(await check({ cls: cleric, fromLevel: 0, toLevel: 1, atCreation: true, spellIds: [SPELL.light, SPELL.cureWounds, SPELL.bless] })).toBeNull()
  })

  it('à la création, la liste de classe et le niveau de sort restent contrôlés', async () => {
    expect(await check({ cls: cleric, fromLevel: 0, toLevel: 1, atCreation: true, spellIds: [SPELL.magicMissile] })).toMatch(/n'est pas dans la liste/)
  })
})

describe('learnedSpellsError — classes hors champ', () => {
  it('une classe sans incantation n\'apprend aucun sort', async () => {
    await db.insert(schema.spellClasses).values({ spellId: SPELL.shield, classId: FIGHTER })
    expect(await check({ cls: fighter, spellIds: [SPELL.shield] })).toMatch(/Trop de sorts/)
  })

  it('une classe 5.5 n\'est pas contrôlée : les tables sont celles de 2014', async () => {
    expect(await check({ cls: { ...wizard, id: WIZARD_5_5, ruleset: '5.5' }, spellIds: [SPELL.fireball] })).toBeNull()
  })
})

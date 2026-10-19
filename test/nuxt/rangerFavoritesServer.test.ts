import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { deriveLabelPicks } from '../../server/utils/labelPicks'
import { rodeurFeatures } from '../../server/db/seeds/data/rodeur'
import { replayMigrations } from '../fixtures/migrations'

// Ennemis jurés et terrains favoris du Rôdeur : choisis à la création, complétés aux niveaux où ils grandissent.

const RANGER = 1
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let enemyProgressionId = 0
let terrainProgressionId = 0
let enemyOwnerId = 0

const createInput = (level: number, choicePicks: Array<{ progressionId: number, value: string }>) => createCharacterSchema.parse({
  name: 'Rôdeur', hpBase: level, classId: RANGER, level, speciesId: 1,
  abilityScores: { str: 15, dex: 14, con: 13 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  choicePicks,
})
const levelUpInput = (choicePicks: Array<{ progressionId: number, value: string }>) =>
  levelUpSchema.parse({ classId: RANGER, isMulticlass: false, hpDie: 5, choicePicks })
const enemy = (value: string) => ({ progressionId: enemyProgressionId, value })
const terrain = (value: string) => ({ progressionId: terrainProgressionId, value })
const labelsOf = async (sheetId: number) => (await deriveLabelPicks(db, sheetId)).map(p => `${p.featureId === enemyOwnerId ? 'ennemi' : 'terrain'}:${p.value}`)

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: RANGER, name: 'Rôdeur', hitDice: '1d10', spellcastingType: 'half' })

  // Les capacités du Rôdeur et leurs points de choix, tels que le seed les déclare.
  for (const def of rodeurFeatures.filter(f => f.progression)) {
    const [owner] = await db.insert(schema.features).values({
      name: def.name, featureType: def.featureType, classId: RANGER, levelRequired: def.levelRequired,
    }).returning()
    const [prog] = await db.insert(schema.progression).values({
      featureId: owner.id, kind: def.progression!.kind, count: def.progression!.count, optionSource: def.progression!.optionSource, replaceable: false,
    }).returning()
    if (def.progression!.kind === 'favored_enemy') {
      enemyProgressionId = prog.id
      enemyOwnerId = owner.id
    }
    if (def.progression!.kind === 'terrain') terrainProgressionId = prog.id
  }
})

describe('création d\'un Rôdeur', () => {
  it('niveau 6 : deux ennemis et deux terrains, enregistrés et lus avec leur capacité', async () => {
    const { id } = await createCharacter(db, createInput(6, [enemy('Dragons'), enemy('Bêtes'), terrain('Forêt'), terrain('Montagne')]), OWNER)

    expect(await labelsOf(id)).toEqual(['ennemi:Dragons', 'ennemi:Bêtes', 'terrain:Forêt', 'terrain:Montagne'])
    const rows = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, id))
    expect(rows).toHaveLength(4)
  })

  it('refuse un ennemi de trop, une valeur hors liste et un doublon', async () => {
    await expect(createCharacter(db, createInput(5, [enemy('Dragons'), enemy('Bêtes')]), OWNER)).rejects.toThrow(/Trop de choix/)
    await expect(createCharacter(db, createInput(1, [enemy('Licornes')]), OWNER)).rejects.toThrow(/n'est pas une option/)
    await expect(createCharacter(db, createInput(6, [enemy('Dragons'), enemy('Dragons')]), OWNER)).rejects.toThrow(/deux fois/)
  })
})

describe('montée de niveau d\'un Rôdeur', () => {
  it('5 → 6 : un ennemi et un terrain de plus, qui s\'ajoutent aux premiers', async () => {
    const { id } = await createCharacter(db, createInput(5, [enemy('Dragons'), terrain('Forêt')]), OWNER)

    await characterLevelUp(db, id, levelUpInput([enemy('Fées'), terrain('Marais')]))

    expect(await labelsOf(id)).toEqual(['ennemi:Dragons', 'terrain:Forêt', 'ennemi:Fées', 'terrain:Marais'])
  })

  it('refuse de reprendre un ennemi déjà choisi, et un choix que le niveau ne donne pas', async () => {
    const { id } = await createCharacter(db, createInput(5, [enemy('Dragons'), terrain('Forêt')]), OWNER)

    await expect(characterLevelUp(db, id, levelUpInput([enemy('Dragons'), terrain('Marais')]))).rejects.toThrow(/déjà choisi/)
    await expect(characterLevelUp(db, id, levelUpInput([enemy('Fées'), enemy('Bêtes'), terrain('Marais')]))).rejects.toThrow(/Trop de choix/)
  })

  it('6 → 7 : aucun choix de plus', async () => {
    const { id } = await createCharacter(db, createInput(6, [enemy('Dragons'), enemy('Bêtes'), terrain('Forêt'), terrain('Montagne')]), OWNER)

    await expect(characterLevelUp(db, id, levelUpInput([enemy('Fées')]))).rejects.toThrow(/n'est pas proposé/)
    await characterLevelUp(db, id, levelUpInput([]))
    expect(await labelsOf(id)).toHaveLength(4)
  })
})

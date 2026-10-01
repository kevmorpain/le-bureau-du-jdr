import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { deleteBackgroundChoicePicks, deriveChoiceProficiencies } from '../../server/utils/choicePicks'
import { seedBackgroundProficiencies } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { DUPLICATE_REPLACEMENT_CHOICES } from '../../server/db/seeds/lib/seedDuplicateReplacement'
import { DUPLICATE_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/data/proficiencyCarriers'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'

// Remplacement d'une maîtrise reçue de deux sources fixes (AideDD, Historiques) : point de choix général dont
// le nombre dû vient du personnage. Migration 0110 + validation à la création + purge au changement d'historique.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0110_duplicate_proficiency_replacement.sql'
const OWNER = 1
const ROGUE = 1
const FIGHTER = 2

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let humanId: number
let halfOrcId: number
const backgroundId: Record<string, number> = {}
let skillReplacement: number
let toolReplacement: number

const create = (classId: number, speciesId: number, background: string, choicePicks: unknown[]) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'X', maxHp: 10, classId, level: 1, speciesId, backgroundId: backgroundId[background],
    abilityScores: { str: 10 }, classSkills: [], backgroundSkills: [], spellIds: [], choicePicks,
  }), OWNER)

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  client = createClient({ url: ':memory:' })
  for (const file of (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()) {
    for (const statement of splitSqlQueries(await readFile(MIGRATIONS_DIR + file, 'utf8'))) await client.execute(statement)
  }
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'Testeur' })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values([
    { id: ROGUE, name: 'Roublard', hitDice: '1d8', spellcastingType: 'none' },
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
  ])
  const rogueCarrier = await db.insert(schema.features).values({ name: 'Maîtrises de la classe', featureType: 'proficiency_grant', classId: ROGUE, levelRequired: 1 }).returning().get()
  const thievesTools = await db.insert(schema.effects).values({ type: 'tool_proficiency', value: 'Outils de voleur' }).returning().get()
  await db.insert(schema.featureEffects).values({ featureId: rogueCarrier.id, effectId: thievesTools.id })

  humanId = (await db.insert(schema.characterSpecies).values({ name: 'Humain', size: CreatureSize.Medium, speed: 9 }).returning().get()).id
  halfOrcId = (await db.insert(schema.characterSpecies).values({ name: 'Demi-orc', size: CreatureSize.Medium, speed: 9 }).returning().get()).id
  const menacing = await db.insert(schema.features).values({ name: 'Menaçant', featureType: 'species_trait' }).returning().get()
  await db.insert(schema.speciesFeatures).values({ speciesId: halfOrcId, featureId: menacing.id })
  const intimidation = await db.insert(schema.effects).values({ type: 'skill_proficiency', value: { skill: 'intimidation' } }).returning().get()
  await db.insert(schema.featureEffects).values({ featureId: menacing.id, effectId: intimidation.id })

  const seeded = backgroundsData.filter(b => ['Criminel', 'Soldat', 'Sage'].includes(b.name))
  for (const bg of seeded) backgroundId[bg.name] = (await db.insert(schema.backgrounds).values({ name: bg.name }).returning().get()).id
  await seedBackgroundProficiencies(db, seeded)

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
  const progressions = await client.execute({
    sql: 'SELECT p.id, p.kind FROM progression p JOIN features f ON f.id = p.feature_id WHERE f.name = ?',
    args: [DUPLICATE_PROFICIENCY_CARRIER_NAME],
  })
  skillReplacement = Number(progressions.rows.find(r => r.kind === 'skill')!.id)
  toolReplacement = Number(progressions.rows.find(r => r.kind === 'tool')!.id)
})

describe('migration 0110 — porteur du remplacement', () => {
  it('un seul porteur, sans propriétaire, et les progressions du seed, même rejouée', async () => {
    const carriers = await client.execute({ sql: 'SELECT id, feature_type, class_id FROM features WHERE name = ?', args: [DUPLICATE_PROFICIENCY_CARRIER_NAME] })
    expect(carriers.rows).toHaveLength(1)
    expect(carriers.rows[0]).toMatchObject({ feature_type: 'choice_carrier', class_id: null })
    const res = await client.execute({ sql: 'SELECT kind, count, option_source FROM progression WHERE feature_id = ? ORDER BY kind', args: [Number(carriers.rows[0]!.id)] })
    expect(res.rows.map(r => ({ kind: r.kind, count: JSON.parse(String(r.count)), optionSource: JSON.parse(String(r.option_source)) })))
      .toEqual([...DUPLICATE_REPLACEMENT_CHOICES].sort((a, b) => a.kind.localeCompare(b.kind)))
  })
})

describe('remplacement à la création', () => {
  it('Roublard Criminel : un outil de remplacement, dérivé en maîtrise', async () => {
    const { id } = await create(ROGUE, humanId, 'Criminel', [{ progressionId: toolReplacement, value: 'Kit de déguisement' }])
    expect((await deriveChoiceProficiencies(db, id)).map(e => e.value)).toEqual(['Kit de déguisement'])
  })

  it('Roublard Criminel : un seul doublon, donc un seul remplacement', async () => {
    await expect(create(ROGUE, humanId, 'Criminel', ['Kit de déguisement', 'Outils de navigateur'].map(value => ({ progressionId: toolReplacement, value }))))
      .rejects.toThrow(/Trop de choix/)
  })

  it('Demi-orc Soldat : Intimidation en double → une compétence de remplacement', async () => {
    const { id } = await create(FIGHTER, halfOrcId, 'Soldat', [{ progressionId: skillReplacement, value: 'perception' }])
    expect(await deriveChoiceProficiencies(db, id)).toEqual([{ type: 'skill_proficiency', value: { skill: 'perception' } }])
  })

  it('sans doublon, aucun remplacement n\'est proposé', async () => {
    await expect(create(FIGHTER, humanId, 'Criminel', [{ progressionId: toolReplacement, value: 'Kit de déguisement' }]))
      .rejects.toThrow(CharacterValidationError)
    await expect(create(ROGUE, humanId, 'Sage', [{ progressionId: toolReplacement, value: 'Kit de déguisement' }]))
      .rejects.toThrow(CharacterValidationError)
  })

  it('changer d\'historique retire le remplacement, qui en dépendait', async () => {
    const { id } = await create(ROGUE, humanId, 'Criminel', [{ progressionId: toolReplacement, value: 'Kit de déguisement' }])
    await deleteBackgroundChoicePicks(db, id)
    const picks = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, id))
    expect(picks).toEqual([])
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { dwarf } from '../../server/db/seeds/data/dwarf'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0156 : Ténacité naine gagne son effet (+1 PV par niveau) sans changer le maximum affiché des fiches existantes.

const MIGRATION = '0156_dwarven_toughness.sql'
const SHEET = { legacySheet: 1, lineageSheet: 2, mountainSheet: 3, otherSheet: 4 }

let client: Client
const featureIds: Record<string, number> = {}

const hpBaseOf = async (sheetId: number) =>
  Number((await client.execute({ sql: 'SELECT hp_base FROM character_sheets WHERE id = ?', args: [sheetId] })).rows[0]!.hp_base)

const effectsOf = async (featureId: number) =>
  (await client.execute({ sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?', args: [featureId] })).rows
    .map(r => `${r.type}:${r.value}`)

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  const orm = drizzle(client, { schema, casing: 'snake_case' })

  const legacy = await orm.insert(schema.characterSpecies).values({ name: 'Nain des collines', size: CreatureSize.Medium, speed: 7.5 }).returning().get()
  const mountainLegacy = await orm.insert(schema.characterSpecies).values({ name: 'Nain des montagnes', size: CreatureSize.Medium, speed: 7.5 }).returning().get()
  const base = await orm.insert(schema.characterSpecies).values({ name: 'Nain', size: CreatureSize.Medium, speed: 7.5 }).returning().get()
  const hill = await orm.insert(schema.speciesLineages).values({ speciesId: base.id, name: 'Nain des collines' }).returning().get()
  const mountain = await orm.insert(schema.speciesLineages).values({ speciesId: base.id, name: 'Nain des montagnes' }).returning().get()

  const legacyTrait = await orm.insert(schema.features).values({ name: 'Ténacité naine', featureType: 'species_trait' }).returning().get()
  await orm.insert(schema.speciesFeatures).values({ speciesId: legacy.id, featureId: legacyTrait.id })
  const lineageTrait = await orm.insert(schema.features).values({ name: 'Ténacité naine', featureType: 'lineage_feature', lineageId: hill.id }).returning().get()
  const mountainTrait = await orm.insert(schema.features).values({ name: 'Formation au port des armures naines', featureType: 'lineage_feature', lineageId: mountain.id }).returning().get()
  Object.assign(featureIds, { legacyTrait: legacyTrait.id, lineageTrait: lineageTrait.id, mountainTrait: mountainTrait.id })

  await client.execute('PRAGMA foreign_keys = OFF')
  const sheet = (id: number, speciesId: number, hpBase: number) =>
    client.execute({ sql: 'INSERT INTO character_sheets (id, name, species_id, hp_base) VALUES (?, ?, ?, ?)', args: [id, `Fiche ${id}`, speciesId, hpBase] })
  await sheet(SHEET.legacySheet, legacy.id, 40)
  await sheet(SHEET.lineageSheet, base.id, 25)
  await sheet(SHEET.mountainSheet, base.id, 30)
  await sheet(SHEET.otherSheet, mountainLegacy.id, 12)
  const levels: [number, number][] = [[SHEET.legacySheet, 5], [SHEET.lineageSheet, 3], [SHEET.mountainSheet, 4], [SHEET.otherSheet, 2]]
  for (const [sheetId, level] of levels) {
    await client.execute({ sql: 'INSERT INTO character_classes (character_sheet_id, class_id, level, is_main) VALUES (?, 1, ?, 1)', args: [sheetId, level] })
  }
  await client.execute({ sql: 'INSERT INTO character_choices (character_sheet_id, progression_id, selected_lineage_id) VALUES (?, 1, ?)', args: [SHEET.lineageSheet, hill.id] })
  await client.execute({ sql: 'INSERT INTO character_choices (character_sheet_id, progression_id, selected_lineage_id) VALUES (?, 1, ?)', args: [SHEET.mountainSheet, mountain.id] })

  await applyMigration(client, MIGRATION)
})

describe('migration 0156 — Ténacité naine', () => {
  it('donne +1 PV par niveau au trait de l\'ancienne espèce et à celui de la lignée', async () => {
    expect(await effectsOf(featureIds.legacyTrait!)).toEqual(['hp_per_level:{"amount":1}'])
    expect(await effectsOf(featureIds.lineageTrait!)).toEqual(['hp_per_level:{"amount":1}'])
  })

  it('ne touche pas au Nain des montagnes', async () => {
    expect(await effectsOf(featureIds.mountainTrait!)).toEqual([])
  })

  it('retranche le niveau total du hp_base des Nains des collines, pour que leur maximum affiché reste le même', async () => {
    expect(await hpBaseOf(SHEET.legacySheet)).toBe(40 - 5)
    expect(await hpBaseOf(SHEET.lineageSheet)).toBe(25 - 3)
  })

  it('laisse les autres fiches intactes', async () => {
    expect(await hpBaseOf(SHEET.mountainSheet)).toBe(30)
    expect(await hpBaseOf(SHEET.otherSheet)).toBe(12)
  })

  it('rejouée, ne retranche rien de plus et ne double pas l\'effet', async () => {
    await applyMigration(client, MIGRATION)
    expect(await hpBaseOf(SHEET.legacySheet)).toBe(35)
    expect(await hpBaseOf(SHEET.lineageSheet)).toBe(22)
    expect(await effectsOf(featureIds.lineageTrait!)).toHaveLength(1)
    const rows = await client.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'hp_per_level\' AND value = \'{"amount":1}\'')
    expect(Number(rows.rows[0]!.c)).toBe(1)
  })

  it('ne retranche jamais sous zéro', async () => {
    const c = createClient({ url: ':memory:' })
    await replayMigrations(c, { before: MIGRATION })
    const o = drizzle(c, { schema, casing: 'snake_case' })
    const sp = await o.insert(schema.characterSpecies).values({ name: 'Nain des collines', size: CreatureSize.Medium, speed: 7.5 }).returning().get()
    const f = await o.insert(schema.features).values({ name: 'Ténacité naine', featureType: 'species_trait' }).returning().get()
    await o.insert(schema.speciesFeatures).values({ speciesId: sp.id, featureId: f.id })
    await c.execute('PRAGMA foreign_keys = OFF')
    await c.execute({ sql: 'INSERT INTO character_sheets (id, name, species_id, hp_base) VALUES (1, \'Basse\', ?, 2)', args: [sp.id] })
    await c.execute('INSERT INTO character_classes (character_sheet_id, class_id, level, is_main) VALUES (1, 1, 5, 1)')
    await applyMigration(c, MIGRATION)
    expect(Number((await c.execute('SELECT hp_base FROM character_sheets WHERE id = 1')).rows[0]!.hp_base)).toBe(0)
  })

  it('sur une base vierge, ne pose aucun effet', async () => {
    const c = createClient({ url: ':memory:' })
    await replayMigrations(c)
    const rows = await c.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'hp_per_level\'')
    expect(Number(rows.rows[0]!.c)).toBe(0)
  })
})

describe('seeds — Ténacité naine', () => {
  const perLevel = [{ type: 'hp_per_level', value: { amount: 1 } }]

  it('la lignée du Nain des collines et l\'ancienne espèce portent le même effet', () => {
    const lineageTrait = dwarf.lineages.find(l => l.name === 'Nain des collines')!.traits.find(t => t.name === 'Ténacité naine')!
    const legacyTrait = characterSpecies.find(s => s.name === 'Nain des collines')!.traits.find(t => t.name === 'Ténacité naine')!
    expect(lineageTrait.effects).toEqual(perLevel)
    expect(legacyTrait.effects).toEqual(perLevel)
  })
})

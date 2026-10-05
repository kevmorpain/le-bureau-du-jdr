import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { seedRollTables } from '../../server/db/seeds/lib/seedRollTables'
import { rollTables } from '../../server/db/seeds/data/rollTables'
import { spells } from '../../server/db/seeds/data/spells'
import type { Db } from '../../server/utils/db'
import { applyMigration, readMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0128 : crée les tables de sort et lie les sorts, sans re-seed. Les deux chemins doivent produire les mêmes
// données, même rejouée, et le seed qui suit ne doit plus rien avoir à corriger.

const MIGRATION = '0128_spell_roll_tables.sql'
const STALE = 'ancienne valeur'
const linked = spells.filter(s => s.rollTable)

let client: Client
let homonym55: number

const rowOf = async (name: string) => (await client.execute({ sql: 'SELECT * FROM spells WHERE name = ? AND ruleset = ?', args: [name, '5'] })).rows[0]!
const tableOf = async (id: number) => (await client.execute({ sql: 'SELECT * FROM roll_tables WHERE id = ?', args: [id] })).rows[0]!

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  let id = 1
  for (const s of linked) {
    await client.execute({
      sql: 'INSERT INTO spells (id, name, level, casting_time, range, duration, school_id, description, ruleset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id++, s.name, s.level, s.castingTime, s.range, s.duration, s.schoolId, STALE, '5'],
    })
  }
  homonym55 = id
  await client.execute({
    sql: 'INSERT INTO spells (id, name, level, casting_time, range, duration, school_id, description, ruleset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [homonym55, linked[0]!.name, 4, '1 action', 27, '1 minute', 4, STALE, '5.5'],
  })

  await applyMigration(client, MIGRATION)
  // Les ALTER TABLE ne se rejouent pas ; le reste, si.
  const rest = (await readMigration(MIGRATION)).split('\n').filter(l => !l.startsWith('ALTER TABLE')).join('\n')
  await client.executeMultiple(rest)
})

describe('migration 0128 — tables de sort', () => {
  it('couvre Confusion et Espièglerie de nathair', () => {
    expect(linked.map(s => s.rollTable)).toEqual(['confusion', 'nathair_mischief'])
  })

  for (const spell of linked) {
    it(`${spell.name} : lien, table et description exactement ceux du seed, même rejouée`, async () => {
      const row = await rowOf(spell.name)
      expect(row.description).toBe(spell.description)
      const table = await tableOf(Number(row.roll_table_id))
      const def = rollTables.find(t => t.key === spell.rollTable)!
      expect({ key: table.key, ruleset: table.ruleset, name: table.name, die: Number(table.die), entries: JSON.parse(String(table.entries)) })
        .toEqual({ key: def.key, ruleset: '5', name: def.name, die: def.die, entries: def.entries })
    })
  }

  it('une table n\'est créée qu\'une fois malgré le rejeu', async () => {
    const res = await client.execute('SELECT count(*) AS c FROM roll_tables')
    expect(Number(res.rows[0]!.c)).toBe(linked.length)
  })

  it('n\'touche pas l\'homonyme de l\'édition 2024', async () => {
    const res = await client.execute({ sql: 'SELECT description, roll_table_id FROM spells WHERE id = ?', args: [homonym55] })
    expect(res.rows[0]).toMatchObject({ description: STALE, roll_table_id: null })
  })

  it('le seed des tables qui suit ne corrige rien des tables posées par la migration', async () => {
    const orm = drizzle(client, { schema, casing: 'snake_case' }) as unknown as Db
    const result = await seedRollTables(orm)
    expect(result.updated).toBe(0)
    expect(result.inserted).toBe(rollTables.length - linked.length)
  })

  it('une base vierge (sort absent) ne reçoit rien : le seed s\'en charge', async () => {
    const empty = createClient({ url: ':memory:' })
    await replayMigrations(empty)
    const res = await empty.execute('SELECT count(*) AS c FROM roll_tables')
    expect(Number(res.rows[0]!.c)).toBe(0)
  })
})

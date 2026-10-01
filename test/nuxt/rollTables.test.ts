import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import * as schema from '../../server/db/schema'
import { seedRollTables } from '../../server/db/seeds/lib/seedRollTables'
import { rollTables, type RollTableDef } from '../../server/db/seeds/data/rollTables'
import { loadRollTable } from '../../server/utils/catalogSources'
import type { Db } from '../../server/utils/db'
import RollTablePanel from '../../app/components/character_sheet/RollTablePanel.vue'
import { replayMigrations } from '../fixtures/migrations'

let orm: Db

beforeEach(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })
})

describe('seedRollTables', () => {
  it('insère les tables, puis ne fait rien à la relance', async () => {
    expect(await seedRollTables(orm)).toEqual({ inserted: rollTables.length, updated: 0, skipped: 0 })
    expect(await seedRollTables(orm)).toEqual({ inserted: 0, updated: 0, skipped: rollTables.length })
  })

  it('resynchronise une table corrigée dans le seed', async () => {
    const original: RollTableDef = { key: 'wild_magic_surge', name: 'Pic', die: 2, entries: [{ min: 1, max: 2, text: 'avant' }] }
    await seedRollTables(orm, [original])
    const fixed = { ...original, entries: [{ min: 1, max: 2, text: 'après' }] }
    expect(await seedRollTables(orm, [fixed])).toEqual({ inserted: 0, updated: 1, skipped: 0 })

    const [row] = await orm.select().from(schema.rollTables)
    expect(await loadRollTable(orm, row!.id)).toEqual({ name: 'Pic', die: 2, entries: [{ min: 1, max: 2, text: 'après' }] })
  })

  it('distingue une table 2024 homonyme au lieu d\'écraser la 2014', async () => {
    const base: RollTableDef = { key: 'wild_magic_surge', name: 'Pic', die: 2, entries: [{ min: 1, max: 2, text: '2014' }] }
    const result = await seedRollTables(orm, [base, { ...base, ruleset: '5.5', entries: [{ min: 1, max: 2, text: '2024' }] }])
    expect(result.inserted).toBe(2)
  })
})

describe('loadRollTable', () => {
  it('renvoie null pour un id inconnu', async () => {
    expect(await loadRollTable(orm, 999)).toBeNull()
  })
})

describe('RollTablePanel', () => {
  const table = {
    name: 'Table test',
    die: 4,
    entries: [
      { min: 1, max: 2, text: 'Effet bas' },
      { min: 3, max: 4, text: 'Effet haut' },
    ],
  }

  afterEach(() => vi.restoreAllMocks())

  const current = (wrapper: Awaited<ReturnType<typeof mountSuspended>>) =>
    wrapper.findAll('li').filter(li => li.attributes('aria-current') === 'true').map(li => li.text())

  it('surligne la ligne du jet, puis garde le jet précédent pour Chaos contrôlé', async () => {
    const wrapper = await mountSuspended(RollTablePanel, { props: { table } })
    expect(current(wrapper)).toEqual([])

    vi.spyOn(Math, 'random').mockReturnValue(0.6) // ceil(0.6 × 4) = 3
    await wrapper.find('button').trigger('click')
    expect(current(wrapper)).toEqual(['3-4Effet haut'])

    vi.spyOn(Math, 'random').mockReturnValue(0.1) // ceil(0.1 × 4) = 1
    await wrapper.find('button').trigger('click')
    expect(current(wrapper)).toEqual(['1-2Effet bas'])
    expect(wrapper.findAll('li')[1]!.classes()).toContain('bg-elevated')
  })
})

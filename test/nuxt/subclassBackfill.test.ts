import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Backfill du choix de sous-classe (0093) sur base PEUPLÉE — migrations.test.ts ne rejoue la chaîne
// que sur base vierge. L'owner `choice_carrier` et sa progression doivent être créés, et un 2ᵉ passage
// ne rien dupliquer.

const FIGHTER = 2

let client: Client
let orm: ReturnType<typeof drizzle>

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // Base « déployée » : la classe + ses sous-classes existent (le backfill ne crée QUE le point
  // de choix). subclass_level = 3 (Guerrier, contrat CLASS_IDENTITY).
  await orm.insert(schema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', subclassLevel: 3 })
  await orm.insert(schema.subclasses).values([
    { id: 10, classId: FIGHTER, name: 'Champion' },
    { id: 11, classId: FIGHTER, name: 'Maître de guerre' },
  ])
})

async function apply0093() {
  await applyMigration(client, '0093_subclass_choice_carriers.sql')
}

describe('migration 0093 — backfill du choix de sous-classe (base peuplée)', () => {
  it('crée l\'owner `choice_carrier` au niveau d\'accès + sa progression `subclass`', async () => {
    await apply0093()

    const owners = await orm.select().from(schema.features)
      .where(and(eq(schema.features.classId, FIGHTER), eq(schema.features.name, 'Archétype martial')))
    expect(owners).toHaveLength(1)
    expect(owners[0]!.featureType).toBe('choice_carrier') // invisible (option B)
    expect(owners[0]!.levelRequired).toBe(3) // = classes.subclass_level

    const progs = await orm.select().from(schema.progression).where(eq(schema.progression.featureId, owners[0]!.id))
    expect(progs).toHaveLength(1)
    expect(progs[0]!.kind).toBe('subclass')
    expect(progs[0]!.optionSource).toEqual({ type: 'subclasses' })
    expect(progs[0]!.count).toEqual({ op: 'fixed', value: 1 })
  })

  it('idempotent : un 2ᵉ passage ne duplique ni l\'owner ni la progression', async () => {
    await apply0093()

    const owners = await orm.select().from(schema.features)
      .where(and(eq(schema.features.classId, FIGHTER), eq(schema.features.name, 'Archétype martial')))
    expect(owners).toHaveLength(1)
    const progs = await orm.select().from(schema.progression).where(eq(schema.progression.featureId, owners[0]!.id))
    expect(progs).toHaveLength(1)
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { baseSpells } from '../../server/db/seeds/data/spells'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

const MIGRATION = '0184_spell_casting_time_fixes.sql'

const FIXED = ['Mot de guérison', 'Invocation de fée']
const HAND_CORRECTED = { name: 'Invocation de fée', castingTime: '10 minutes' }

const seedOf = (name: string) => baseSpells.find(s => s.name === name)!

const insert = (client: Client, name: string, castingTime: string, ruleset = '5') => client.execute({
  sql: 'INSERT INTO spells (name, level, casting_time, range, duration, school_id, ruleset) VALUES (?, 1, ?, 18, \'Instantanée\', 5, ?)',
  args: [name, castingTime, ruleset],
})

const castingTimeOf = async (client: Client, name: string, ruleset = '5') => {
  const res = await client.execute({ sql: 'SELECT casting_time FROM spells WHERE name = ? AND ruleset = ?', args: [name, ruleset] })
  return res.rows[0]?.casting_time
}

describe('migration 0184 — temps d\'incantation de Mot de guérison et d\'Invocation de fée', () => {
  let client: Client

  beforeAll(async () => {
    client = createClient({ url: ':memory:' })
    await replayMigrations(client, { before: MIGRATION })
    await client.execute('PRAGMA foreign_keys = OFF')
    for (const name of FIXED) await insert(client, name, '1 action')
    await insert(client, 'Mot de guérison', '1 action', '5.5')
    for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
  })

  for (const name of FIXED) {
    it(`${name} : prend le temps d'incantation du seed, même rejouée`, async () => {
      expect(await castingTimeOf(client, name)).toBe(seedOf(name).castingTime)
    })
  }

  it('les valeurs du seed sont celles d\'AideDD', () => {
    expect(seedOf('Mot de guérison').castingTime).toBe('1 action bonus')
    expect(seedOf('Invocation de fée').castingTime).toBe('1 minute')
  })

  it('l\'homonyme de l\'édition 2024 ne bouge pas', async () => {
    expect(await castingTimeOf(client, 'Mot de guérison', '5.5')).toBe('1 action')
  })

  it('une valeur corrigée à la main ne bouge pas', async () => {
    const hand = createClient({ url: ':memory:' })
    await replayMigrations(hand, { before: MIGRATION })
    await hand.execute('PRAGMA foreign_keys = OFF')
    await insert(hand, HAND_CORRECTED.name, HAND_CORRECTED.castingTime)
    await applyMigration(hand, MIGRATION)
    expect(await castingTimeOf(hand, HAND_CORRECTED.name)).toBe(HAND_CORRECTED.castingTime)
  })
})

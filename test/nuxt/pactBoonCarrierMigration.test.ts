import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { PACT_BOON_NAMES } from '../../shared/rules/pactBoon'
import { WARLOCK_PACT_BOON_OPTIONS } from '../fixtures/warlockProgression'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0148 : « Faveur de pacte » devient un porteur invisible et chaque Occultiste existant reçoit la ligne
// de son pacte, comme le seed et la création le font.

const MIGRATION = '0148_pact_boon_choice_carrier.sql'

const WARLOCK = 1
const FIGHTER = 2
const CARRIER = 100
const OPTIONS = { chain: 110, blade: 111, tome: 112 }
const STYLE_CARRIER = 120

let client: Client

const featureIdsOf = async (sheetId: number) => {
  const res = await client.execute({ sql: 'SELECT feature_id FROM character_features WHERE character_sheet_id = ? ORDER BY feature_id', args: [sheetId] })
  return res.rows.map(r => Number(r.feature_id))
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${WARLOCK}, 'Occultiste', '1d8'), (${FIGHTER}, 'Guerrier', '1d10')`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES
    (${CARRIER}, 'Faveur de pacte', 'class_feature', ${WARLOCK}, 3),
    (${STYLE_CARRIER}, 'Style de combat', 'choice_carrier', ${FIGHTER}, 1)`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required, tag) VALUES
    (${OPTIONS.chain}, '${PACT_BOON_NAMES.chain}', 'class_feature', ${WARLOCK}, 3, 'pact_boon'),
    (${OPTIONS.blade}, '${PACT_BOON_NAMES.blade}', 'class_feature', ${WARLOCK}, 3, 'pact_boon'),
    (${OPTIONS.tome}, '${PACT_BOON_NAMES.tome}', 'class_feature', ${WARLOCK}, 3, 'pact_boon')`)
  // 1 : pacte de la Lame, ligne du porteur ; 2 : pacte du Tome déjà matérialisé ; 3 : pas encore de pacte ; 4 : Guerrier
  await client.execute(`INSERT INTO character_classes (character_sheet_id, class_id, level, is_main, pact_boon) VALUES
    (1, ${WARLOCK}, 3, 1, 'blade'), (2, ${WARLOCK}, 5, 1, 'tome'), (3, ${WARLOCK}, 2, 1, NULL), (4, ${FIGHTER}, 3, 1, NULL)`)
  await client.execute(`INSERT INTO character_features (character_sheet_id, feature_id, current_uses) VALUES
    (1, ${CARRIER}, 0), (2, ${OPTIONS.tome}, 0), (3, ${STYLE_CARRIER}, 0), (4, ${STYLE_CARRIER}, 0)`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0148 — Faveur de pacte', () => {
  it('requalifie le porteur en choice_carrier', async () => {
    const res = await client.execute(`SELECT feature_type FROM features WHERE id = ${CARRIER}`)
    expect(res.rows[0]!.feature_type).toBe('choice_carrier')
  })

  it('remplace la ligne du porteur par celle du pacte choisi, sans doublon ni toucher aux autres lignes', async () => {
    expect(await featureIdsOf(1)).toEqual([OPTIONS.blade])
    expect(await featureIdsOf(2)).toEqual([OPTIONS.tome])
    expect(await featureIdsOf(3)).toEqual([STYLE_CARRIER])
    expect(await featureIdsOf(4)).toEqual([STYLE_CARRIER])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute('SELECT COUNT(*) AS n FROM character_features')
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})

describe('PACT_BOON_NAMES', () => {
  it('nomme les trois pactes du contrat, dans l\'ordre', () => {
    expect(Object.values(PACT_BOON_NAMES)).toEqual(WARLOCK_PACT_BOON_OPTIONS.map(o => o.name))
  })
})

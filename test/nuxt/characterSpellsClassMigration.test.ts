import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0113 : rattrape la classe des sorts existants (`character_spells.class_id`).

const MIGRATION = '0113_character_spells_class.sql'

let client: Client

async function classOf(sheetId: number, spellId: number): Promise<number | null> {
  const res = await client.execute({ sql: 'SELECT class_id FROM character_spells WHERE character_sheet_id = ? AND spell_id = ?', args: [sheetId, spellId] })
  const value = res.rows[0]!.class_id
  return value == null ? null : Number(value)
}

const WIZARD = 1
const FIGHTER = 2
const WARLOCK = 3
const CLERIC = 4

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  const run = (sql: string) => client.execute(sql)
  // Le rattrapage ne lit que les classes : pas la peine de seeder espèces et sorts pour les clés étrangères.
  await run('PRAGMA foreign_keys = OFF')

  await run(`INSERT INTO classes (id, name, hit_dice, spellcasting_ability, spellcasting_type) VALUES
    (${WIZARD}, 'Magicien', '1d6', 'int', 'full'),
    (${FIGHTER}, 'Guerrier', '1d10', NULL, 'none'),
    (${WARLOCK}, 'Occultiste', '1d8', 'cha', 'pact'),
    (${CLERIC}, 'Clerc', '1d8', 'wis', 'full')`)
  await run(`INSERT INTO subclasses (id, class_id, name, spellcasting_ability) VALUES (1, ${FIGHTER}, 'Chevalier occulte', 'int')`)
  // Fiche 1 : un seul lanceur. 2 : Chevalier occulte (lanceur par sa sous-classe). 3 : multiclasse lanceur.
  // 4 : Occultiste multiclassé Clerc. 5 : aucun lanceur.
  for (let id = 1; id <= 5; id++) await run(`INSERT INTO character_sheets (id, name, species_id) VALUES (${id}, 'Fiche ${id}', 1)`)
  await run(`INSERT INTO character_classes (character_sheet_id, class_id, level, is_main, subclass_id) VALUES
    (1, ${WIZARD}, 3, 1, NULL),
    (2, ${FIGHTER}, 5, 1, 1),
    (3, ${WIZARD}, 3, 1, NULL), (3, ${CLERIC}, 2, 0, NULL),
    (4, ${CLERIC}, 3, 1, NULL), (4, ${WARLOCK}, 2, 0, NULL),
    (5, ${FIGHTER}, 4, 1, NULL)`)
  await run(`INSERT INTO character_spells (character_sheet_id, spell_id, is_known, is_prepared, source) VALUES
    (1, 1, 1, 0, NULL), (1, 2, 1, 0, 'species'), (1, 3, 1, 0, 'feat'),
    (2, 1, 1, 0, NULL),
    (3, 1, 1, 0, NULL),
    (4, 1, 1, 0, NULL), (4, 2, 1, 0, 'pact_tome'), (4, 3, 1, 0, 'arcanum_6'),
    (5, 1, 1, 0, NULL)`)

  await applyMigration(client, MIGRATION)
})

describe('migration 0113 — classe des sorts existants', () => {
  it('un seul lanceur : ses sorts sans source lui reviennent, pas ceux d\'espèce ni de don', async () => {
    expect(await classOf(1, 1)).toBe(WIZARD)
    expect(await classOf(1, 2)).toBeNull()
    expect(await classOf(1, 3)).toBeNull()
  })

  it('sous-classe lanceuse sur une classe sans incantation : la classe de la sous-classe', async () => {
    expect(await classOf(2, 1)).toBe(FIGHTER)
  })

  it('multiclasse lanceur : indéterminable, reste NULL', async () => {
    expect(await classOf(3, 1)).toBeNull()
  })

  it('sorts d\'Occultiste : l\'Occultiste, même multiclassé ; le sort sans source reste ambigu', async () => {
    expect(await classOf(4, 2)).toBe(WARLOCK)
    expect(await classOf(4, 3)).toBe(WARLOCK)
    expect(await classOf(4, 1)).toBeNull()
  })

  it('aucun lanceur : NULL', async () => {
    expect(await classOf(5, 1)).toBeNull()
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { slotsForLevel } from '../../shared/rules/spellSlots'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0116 : les Chevaliers occultes et Escrocs arcaniques déjà sur une fiche n'ont aucun emplacement (leur classe
// n'incantait pas) ; on les leur donne, sans toucher aux emplacements existants ni aux fiches multiclassées lanceuses.

const MIGRATION = '0116_third_caster_slots.sql'

const FIGHTER = 1
const ROGUE = 2
const PALADIN = 3
const KNIGHT = 10
const TRICKSTER = 11
const CHAMPION = 12

let client: Client

const slotsOf = async (sheetId: number) => {
  const res = await client.execute({ sql: 'SELECT slot_level, slot_type, total, used FROM character_spell_slots WHERE character_sheet_id = ? ORDER BY slot_level', args: [sheetId] })
  return res.rows.map(r => ({ level: Number(r.slot_level), type: String(r.slot_type), total: Number(r.total), used: Number(r.used) }))
}
const expected = (classLevel: number) => slotsForLevel('third', classLevel)
  .flatMap((total, i) => total > 0 ? [{ level: i + 1, type: 'spellcasting', total, used: 0 }] : [])

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${FIGHTER}, 'Guerrier', '1d10'), (${ROGUE}, 'Roublard', '1d8')`)
  await client.execute(`INSERT INTO classes (id, name, hit_dice, spellcasting_ability, spellcasting_type) VALUES (${PALADIN}, 'Paladin', '1d10', 'cha', 'half')`)
  await client.execute(`INSERT INTO subclasses (id, class_id, name, spellcasting_ability) VALUES
    (${KNIGHT}, ${FIGHTER}, 'Chevalier occulte', 'int'), (${TRICKSTER}, ${ROGUE}, 'Escroc arcanique', 'int'), (${CHAMPION}, ${FIGHTER}, 'Champion', NULL)`)
  for (let id = 1; id <= 7; id++) await client.execute(`INSERT INTO character_sheets (id, name, species_id) VALUES (${id}, 'Fiche ${id}', 1)`)
  await client.execute(`INSERT INTO character_classes (character_sheet_id, class_id, level, is_main, subclass_id) VALUES
    (1, ${FIGHTER}, 3, 1, ${KNIGHT}),
    (2, ${FIGHTER}, 7, 1, ${KNIGHT}),
    (3, ${ROGUE}, 10, 1, ${TRICKSTER}),
    (4, ${FIGHTER}, 5, 1, ${KNIGHT}),
    (5, ${FIGHTER}, 5, 1, ${KNIGHT}), (5, ${PALADIN}, 3, 0, NULL),
    (6, ${FIGHTER}, 5, 1, ${CHAMPION}),
    (7, ${FIGHTER}, 2, 1, NULL)`)
  await client.execute(`INSERT INTO character_spell_slots (character_sheet_id, slot_level, slot_type, total, used) VALUES (4, 1, 'spellcasting', 9, 4)`)

  await applyMigration(client, MIGRATION)
})

describe('migration 0116 — emplacements du lanceur du tiers', () => {
  it('Chevalier occulte 3 : deux emplacements de niveau 1', async () => {
    expect(await slotsOf(1)).toEqual(expected(3))
    expect(await slotsOf(1)).toEqual([{ level: 1, type: 'spellcasting', total: 2, used: 0 }])
  })

  it('Chevalier occulte 7 et Escroc arcanique 10 : la table du tiers de leur niveau', async () => {
    expect(await slotsOf(2)).toEqual(expected(7))
    expect(await slotsOf(3)).toEqual(expected(10))
  })

  it('une fiche qui a déjà des emplacements n\'est pas touchée', async () => {
    expect(await slotsOf(4)).toEqual([{ level: 1, type: 'spellcasting', total: 9, used: 4 }])
  })

  it('multiclassage avec une autre classe lanceuse : laissé au prochain level-up', async () => {
    expect(await slotsOf(5)).toEqual([])
  })

  it('un Guerrier d\'une autre sous-classe, ou sans sous-classe : aucun emplacement', async () => {
    expect(await slotsOf(6)).toEqual([])
    expect(await slotsOf(7)).toEqual([])
  })

  it('un niveau 3 à 20 donne bien la table du tiers', async () => {
    const levels = Array.from({ length: 18 }, (_, i) => i + 3)
    for (const level of levels) expect(expected(level).length).toBeGreaterThan(0)
  })
})

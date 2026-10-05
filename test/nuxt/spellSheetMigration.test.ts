import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { spells } from '../../server/db/seeds/data/spells'
import { applyMigration, readMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0127 : pose sur les sorts déployés ce que le seed déclare (type d'attaque, zone, coût de composante,
// composantes corrigées, descriptions structurées). Les deux chemins doivent produire les mêmes données, même rejouée.

const MIGRATION = '0127_spell_sheet.sql'
const STALE = 'ancienne valeur'

// Composantes matérielles dont le seed divergeait d'AideDD (mauvais objet, « au moins » perdu, « consommée » omise).
const FIXED_MATERIAL = ['Identification', 'Création de mort-vivant', 'Vision suprême', 'Changement de plan']

// Leur description finale est celle de la migration 0128 (tables de sort).
const OWNED_BY_LATER_MIGRATION = ['Confusion', 'Espièglerie de nathair']

// Une description restructurée porte du balisage ; les autres tenaient sur une ligne et n'ont pas bougé.
const isStructured = (description: string | null | undefined) => /\n\n|\*\*|\n- |\n\d\. /.test(description ?? '')

let client: Client
let homonym55: number

const rowOf = async (name: string) => {
  const res = await client.execute({ sql: 'SELECT * FROM spells WHERE name = ? AND ruleset = ?', args: [name, '5'] })
  return res.rows[0]!
}
const json = (v: unknown) => (v == null ? null : JSON.parse(String(v)))

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  let id = 1
  for (const s of spells) {
    await client.execute({
      sql: 'INSERT INTO spells (id, name, level, casting_time, range, duration, school_id, description, material, ruleset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id++, s.name, s.level, s.castingTime, s.range, s.duration, s.schoolId, STALE, FIXED_MATERIAL.includes(s.name) ? STALE : (s.material ?? null), '5'],
    })
  }
  homonym55 = id
  await client.execute({
    sql: 'INSERT INTO spells (id, name, level, casting_time, range, duration, school_id, description, ruleset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [homonym55, 'Boule de feu', 3, '1 action', 45, 'instantanée', 5, STALE, '5.5'],
  })

  await applyMigration(client, MIGRATION)
  // Les ALTER TABLE ne se rejouent pas ; les UPDATE, si.
  const updatesOnly = (await readMigration(MIGRATION)).split('\n').filter(l => !l.startsWith('ALTER TABLE')).join('\n')
  await client.executeMultiple(updatesOnly)
})

describe('migration 0127 — fiche de sort', () => {
  for (const s of spells) {
    it(`${s.name} : exactement les données du seed, même rejouée`, async () => {
      const row = await rowOf(s.name)
      expect(row.attack_type ?? null).toBe(s.attackType ?? null)
      expect(json(row.area_of_effect)).toEqual(s.areaOfEffect ?? null)
      expect(json(row.material_cost)).toEqual(s.materialCost ?? null)
      expect(row.material ?? null).toBe(s.material ?? null)
      if (isStructured(s.description) && !OWNED_BY_LATER_MIGRATION.includes(s.name)) expect(row.description).toBe(s.description)
    })
  }

  it('couvre les sorts d\'attaque, de zone et à composante chiffrée', () => {
    expect(spells.filter(s => s.attackType).length).toBe(10)
    expect(spells.filter(s => s.areaOfEffect).length).toBe(18)
    expect(spells.filter(s => s.materialCost).length).toBe(17)
  })

  it('n\'touche pas l\'homonyme de l\'édition 2024', async () => {
    const res = await client.execute({ sql: 'SELECT description, attack_type, area_of_effect, material_cost FROM spells WHERE id = ?', args: [homonym55] })
    expect(res.rows[0]).toMatchObject({ description: STALE, attack_type: null, area_of_effect: null, material_cost: null })
  })
})

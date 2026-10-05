import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { spells } from '../../server/db/seeds/data/spells'
import { applyMigration, readMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0129 : pose sur les sorts déployés la durée structurée que le seed déclare. Les deux chemins doivent
// produire les mêmes données, même rejouée ; un texte inconnu (sort saisi à la main) reste « special ».

const MIGRATION = '0129_spell_duration.sql'

let client: Client

const rowOf = async (name: string) => {
  const res = await client.execute({ sql: 'SELECT duration, duration_unit, duration_value FROM spells WHERE name = ?', args: [name] })
  return res.rows[0]!
}

// Ces sorts à concentration avaient un texte de durée sans « Concentration, jusqu'à ».
const BARE_TEXT = new Map([
  ['Assistance', '1 minute'], ['Bénédiction', '1 minute'], ['Immobilisation de personne', '1 minute'],
  ['Bouclier de la foi', '10 minutes'], ['Détection de la magie', '10 minutes'], ['Détection du mal et du bien', '10 minutes'],
  ['Protection contre le mal et le bien', '10 minutes'], ['Localisation d\'objet', '10 minutes'], ['Détection du poison et des maladies', '10 minutes'],
  ['Suggestion', '8 heures'],
])

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  let id = 1
  const insert = (name: string, duration: string, concentration = false) => client.execute({
    sql: 'INSERT INTO spells (id, name, level, casting_time, range, duration, concentration, school_id, ruleset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [id++, name, 1, '1 action', 9, duration, concentration ? 1 : 0, 1, '5'],
  })
  // Le déployé : le texte nu des dix sorts concernés, tel qu'il était avant la migration.
  for (const s of spells) await insert(s.name, BARE_TEXT.get(s.name) ?? s.duration, !!s.concentration)
  await insert('Saisi — minuscule', 'instantanée')
  await insert('Saisi — masculin', 'Instantané')
  await insert('Saisi — texte libre', 'Jusqu\'au prochain lever du soleil')
  await insert('Saisi — forme inconnue', '2 minutes')

  await applyMigration(client, MIGRATION)
  // Les ALTER TABLE ne se rejouent pas ; les UPDATE, si.
  const updatesOnly = (await readMigration(MIGRATION)).split('\n').filter(l => !l.startsWith('ALTER TABLE')).join('\n')
  await client.executeMultiple(updatesOnly)
})

describe('migration 0129 — durée structurée des sorts', () => {
  for (const s of spells) {
    it(`${s.name} : exactement la structure du seed, même rejouée`, async () => {
      const row = await rowOf(s.name)
      expect(row.duration_unit).toBe(s.durationUnit)
      expect(row.duration_value ?? null).toBe(s.durationValue ?? null)
      expect(row.duration, 'texte affiché').toBe(s.duration)
    })
  }

  it('un sort instantané saisi à la main est reconnu, quelle que soit la casse ou l\'accord', async () => {
    expect((await rowOf('Saisi — minuscule')).duration_unit).toBe('instant')
    expect((await rowOf('Saisi — masculin')).duration_unit).toBe('instant')
  })

  it('un texte hors des formes connues reste « special », sans quantité', async () => {
    for (const name of ['Saisi — texte libre', 'Saisi — forme inconnue']) {
      const row = await rowOf(name)
      expect(row.duration_unit).toBe('special')
      expect(row.duration_value).toBeNull()
    }
  })
})

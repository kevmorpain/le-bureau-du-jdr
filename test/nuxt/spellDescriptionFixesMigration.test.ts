import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { spellsLevelHorsSocle0 } from '../../server/db/seeds/data/spells_hors_socle_niveau_0'
import { spellsLevelHorsSocle2 } from '../../server/db/seeds/data/spells_hors_socle_niveau_2'
import { spellsLevelHorsSocle3 } from '../../server/db/seeds/data/spells_hors_socle_niveau_3'
import { spellsLevelHorsSocle6 } from '../../server/db/seeds/data/spells_hors_socle_niveau_6'
import { applyMigration, readMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0181 : remplace la description de six sorts hors socle tant que leur passage fautif y figure.

const MIGRATION = '0181_spell_description_fixes.sql'

const seeds = [...spellsLevelHorsSocle0, ...spellsLevelHorsSocle2, ...spellsLevelHorsSocle3, ...spellsLevelHorsSocle6]
const seedOf = (name: string) => seeds.find(s => s.name === name)!

const FIXES = [
  { name: 'Saute de vent', stale: 'Une brève explosion d\'air déplace', fresh: 'en l\'éloignant de vous' },
  { name: 'Pierre magique', stale: 'Un autre lanceur ajoute', fresh: 'Une autre créature ajoute' },
  { name: 'Lame d\'ombres', stale: 'Vous attaquez avec avantage une cible', fresh: 'Quand vous attaquez avec l\'épée' },
  { name: 'Épine mentale', stale: 'Vous plantez une épine', fresh: 'Vous atteignez l\'esprit' },
  { name: 'Serviteur miniature', stale: 'Vous touchez un objet non magique, qui', fresh: 'objet non magique de taille TP' },
  { name: 'Bosquet des druides', stale: 'que choisit le lanceur du sort', fresh: 'au choix du lanceur de la dissipation' },
]

const HAND_CORRECTED = 'Bosquet des druides'
const HAND_TEXT = 'Description corrigée à la main.'
const HOMONYM = FIXES.find(f => f.name === 'Lame d\'ombres')!

const insert = (client: Client, name: string, description: string, ruleset = '5') => client.execute({
  sql: 'INSERT INTO spells (name, level, casting_time, range, duration, school_id, ruleset, description) VALUES (?, 2, \'1 action\', 9, \'Instantanée\', 5, ?, ?)',
  args: [name, ruleset, description],
})

const descriptionOf = async (client: Client, name: string, ruleset = '5') => {
  const res = await client.execute({ sql: 'SELECT description FROM spells WHERE name = ? AND ruleset = ?', args: [name, ruleset] })
  return res.rows[0]?.description
}

let client: Client

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  for (const { name, stale } of FIXES) await insert(client, name, name === HAND_CORRECTED ? HAND_TEXT : `Début. ${stale} fin.`)
  await insert(client, HOMONYM.name, `Version 5.5. ${HOMONYM.stale} fin.`, '5.5')
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0181 — corrections de descriptions de sorts hors socle', () => {
  for (const { name } of FIXES.filter(f => f.name !== HAND_CORRECTED)) {
    it(`${name} : prend exactement la description du seed, même rejouée`, async () => {
      expect(await descriptionOf(client, name)).toBe(seedOf(name).description)
    })
  }

  it('une description déjà corrigée à la main ne bouge pas', async () => {
    expect(await descriptionOf(client, HAND_CORRECTED)).toBe(HAND_TEXT)
  })

  it('l\'homonyme de l\'édition 2024 ne bouge pas', async () => {
    expect(await descriptionOf(client, HOMONYM.name, '5.5')).toContain('Version 5.5.')
  })

  it('une base vierge ne reçoit aucun sort', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute('SELECT COUNT(*) AS n FROM spells')
    expect(Number(res.rows[0]!.n)).toBe(0)
  })

  it('couvre les six sorts, et le seed porte le texte corrigé sans le passage fautif', async () => {
    const sql = await readMigration(MIGRATION)
    for (const { name, stale, fresh } of FIXES) {
      expect(sql, name).toContain(`WHERE name = '${name.replace(/'/g, '\'\'')}'`)
      const description = seedOf(name).description!
      expect(description, name).toContain(fresh)
      expect(description, name).not.toContain(stale)
    }
  })
})

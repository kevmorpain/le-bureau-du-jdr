import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { migrationFiles, readMigration } from '../fixtures/migrations'

// La prod et le CI appliquent les migrations en incrémental (table `_hub_migrations`,
// filtrée sur le NOM du fichier), donc une migration qui ne sait pas s'appliquer sur
// une base vierge y passe inaperçue — jusqu'au jour où on veut reconstruire une base
// locale de zéro. Ce test rejoue toute la chaîne sur une base neuve.
//
// Même chemin que `wrangler d1 migrations apply` : chaque fichier, suivi de l'INSERT de
// suivi, part en un seul bloc.

describe('chaîne de migrations sur base vierge', () => {
  it('applique toutes les migrations de bout en bout', async () => {
    const files = await migrationFiles()
    expect(files.length).toBeGreaterThan(0)

    const db = createClient({ url: ':memory:' })
    // D1 applique les contraintes de clé étrangère : on veut les mêmes échecs ici
    // (une migration de données qui référence une ligne non seedée doit casser le test).
    await db.execute('PRAGMA foreign_keys = ON')
    await db.execute(
      'CREATE TABLE IF NOT EXISTS _hub_migrations ('
      + 'id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE,'
      + ' applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)',
    )

    for (const file of files) {
      const sql = await readMigration(file) + `\nINSERT INTO _hub_migrations (name) values ('${file}');`
      try {
        await db.executeMultiple(sql)
      } catch (error) {
        throw new Error(`${file} échoue sur base vierge : ${(error as Error).message}`)
      }
    }

    const applied = await db.execute('select count(*) as c from _hub_migrations')
    expect(applied.rows[0]!.c).toBe(files.length)
  })
})

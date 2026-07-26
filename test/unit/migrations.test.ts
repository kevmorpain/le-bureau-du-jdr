import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'

// La prod et le CI appliquent les migrations en incrémental (table `_hub_migrations`,
// filtrée sur le NOM du fichier), donc une migration qui ne sait pas s'appliquer sur
// une base vierge y passe inaperçue — jusqu'au jour où on veut reconstruire une base
// locale de zéro. Ce test rejoue toute la chaîne sur une base neuve.
//
// Fidélité au runtime : `hub: { db: 'sqlite' }` utilise le driver **libsql** en dev
// (cf. @nuxthub/core dist/db/lib/client.mjs), et NuxtHub exécute les migrations
// statement par statement après découpage par `splitSqlQueries`. On réutilise les
// deux ici pour tester exactement le même chemin.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)

async function loadSplitter(): Promise<(sql: string) => string[]> {
  try {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    return mod.splitSqlQueries
  } catch (error) {
    throw new Error(
      `Impossible de charger splitSqlQueries depuis @nuxthub/core (${NUXTHUB_UTILS.pathname}). `
      + 'Le chemin interne du paquet a probablement changé : mettre à jour NUXTHUB_UTILS. '
      + `Cause : ${(error as Error).message}`,
    )
  }
}

describe('chaîne de migrations sur base vierge', () => {
  it('applique toutes les migrations de bout en bout', async () => {
    const splitSqlQueries = await loadSplitter()

    const files = (await readdir(MIGRATIONS_DIR))
      .filter(f => f.endsWith('.sql'))
      .sort() // NuxtHub applique dans l'ordre alphabétique des noms de fichiers

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
      const name = file.replace(/\.sql$/, '')
      const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
        + `\nINSERT INTO _hub_migrations (name) values ('${name}');`

      const statements = splitSqlQueries(sql)
      for (const [i, statement] of statements.entries()) {
        try {
          await db.execute(statement)
        } catch (error) {
          throw new Error(
            `${file} échoue sur base vierge (statement ${i + 1}/${statements.length}) : `
            + `${(error as Error).message}\n--- SQL ---\n${statement.slice(0, 600)}`,
          )
        }
      }
    }

    const applied = await db.execute('select count(*) as c from _hub_migrations')
    expect(applied.rows[0]!.c).toBe(files.length)
  })
})

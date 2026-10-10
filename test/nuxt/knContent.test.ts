import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { z } from 'zod'
import * as schema from '../../server/db/schema'
import { getKnContent, listKnContent, saveKnContent } from '../../server/utils/knContent'
import {
  KN_CONTENT_MAX_BYTES,
  KN_CONTENT_NAME_RE,
  KN_CONTENT_SCHEMAS,
  type KnContentRegistry,
} from '../../shared/ker-nethalas/content'
import { replayMigrations } from '../fixtures/migrations'

// Jeux de données factices : le contenu du livre n'entre jamais dans les tests ni dans le dépôt.
const registry: KnContentRegistry = {
  colors: z.array(z.object({ id: z.number().int(), label: z.string().min(1) })),
  words: z.object({ list: z.array(z.string()) }),
}

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client)
  db = drizzle(client, { schema })
})

beforeEach(async () => {
  await client.execute('DELETE FROM kn_content')
})

describe('contenu du livre chargé hors du dépôt', () => {
  it('enregistre un jeu de données valide et le relit à l\'identique', async () => {
    const data = [{ id: 1, label: 'rouge' }, { id: 2, label: 'bleu' }]

    const saved = await saveKnContent(db, 'colors', data, registry)

    expect(saved).toMatchObject({ status: 'saved', name: 'colors' })
    expect(await getKnContent(db, 'colors', registry)).toEqual(data)
  })

  it('remplace le jeu de données et date la mise à jour', async () => {
    await saveKnContent(db, 'words', { list: ['a'] }, registry)
    const second = await saveKnContent(db, 'words', { list: ['a', 'b'] }, registry)

    expect(await getKnContent(db, 'words', registry)).toEqual({ list: ['a', 'b'] })
    const { rows } = await client.execute(`SELECT count(*) AS n, max(updated_at) AS at FROM kn_content WHERE name = 'words'`)
    expect(rows[0]).toMatchObject({ n: 1 })
    expect(second).toMatchObject({ status: 'saved', updatedAt: rows[0]!.at })
  })

  it('refuse un jeu de données qui ne respecte pas son schéma, sans rien écrire, et dit où', async () => {
    const result = await saveKnContent(db, 'colors', [{ id: 1, label: '' }, { id: 'x', label: 'vert' }], registry)

    expect(result.status).toBe('invalid')
    if (result.status === 'invalid') {
      expect(result.issues.map(issue => issue.path)).toEqual(expect.arrayContaining(['0.label', '1.id']))
    }
    expect(await getKnContent(db, 'colors', registry)).toBeNull()
    expect((await client.execute('SELECT count(*) AS n FROM kn_content')).rows[0]).toMatchObject({ n: 0 })
  })

  it('limite à 20 le nombre d\'erreurs renvoyées', async () => {
    const result = await saveKnContent(db, 'colors', Array.from({ length: 50 }, () => ({ id: 'x', label: '' })), registry)

    expect(result.status === 'invalid' && result.issues.length).toBe(20)
  })

  it('refuse un nom inconnu ou mal formé, y compris celui d\'un chemin', async () => {
    for (const name of ['absent', '', 'Colors', 'colors/../x', '__proto__', 'constructor', 'toString']) {
      expect(await saveKnContent(db, name, [], registry), name).toEqual({ status: 'unknown' })
      expect(await getKnContent(db, name, registry), name).toBeNull()
    }
  })

  it('refuse un jeu de données plus gros que ce qu\'une ligne D1 accepte', async () => {
    const huge = { list: ['x'.repeat(KN_CONTENT_MAX_BYTES)] }
    const result = await saveKnContent(db, 'words', huge, registry)

    expect(result.status).toBe('tooLarge')
    expect(await getKnContent(db, 'words', registry)).toBeNull()
  })

  it('traite comme absent un jeu de données chargé que le schéma refuse désormais, et le signale', async () => {
    await saveKnContent(db, 'colors', [{ id: 1, label: 'rouge' }], registry)
    const stricter: KnContentRegistry = { colors: z.array(z.object({ id: z.number(), label: z.string(), hex: z.string() })) }

    expect(await getKnContent(db, 'colors', stricter)).toBeNull()
    expect(await listKnContent(db, stricter)).toEqual([expect.objectContaining({ name: 'colors', loaded: true, valid: false })])
  })

  it('liste l\'état de chaque jeu de données du registre : absent, chargé, valide', async () => {
    await saveKnContent(db, 'words', { list: ['a'] }, registry)

    const list = await listKnContent(db, registry)

    expect(list).toEqual([
      { name: 'colors', loaded: false, valid: false, updatedAt: null },
      { name: 'words', loaded: true, valid: true, updatedAt: expect.any(String) },
    ])
  })

  it('est sans effet quand le registre réel est vide : aucune donnée du livre dans le dépôt', async () => {
    expect(Object.keys(KN_CONTENT_SCHEMAS).every(name => KN_CONTENT_NAME_RE.test(name))).toBe(true)
    expect(await getKnContent(db, 'masteries')).toBeNull()
    expect(await listKnContent(db)).toHaveLength(Object.keys(KN_CONTENT_SCHEMAS).length)
  })
})

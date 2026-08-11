import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { seedBackgroundProficiencies } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { deriveBackgroundProficiencies } from '../../server/utils/backgroundProficiencyDerivation'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { fixedProficiencies } from '../../shared/rules/backgroundProficiencies'

// Volet B, étape 2 — le seed des porteurs de maîtrises d'historique + la dérivation, bout en bout.
// On rejoue la chaîne de migrations sur libsql, on insère les historiques, on lance
// `seedBackgroundProficiencies` (injecté), puis on vérifie que la fiche DÉRIVE exactement les
// maîtrises FIXES (== ce que createCharacter matérialise en grants aujourd'hui = filet d'équivalence),
// que les historiques sans fixe n'ont pas de porteur, et l'idempotence du seed.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const bgIdByName = new Map<string, number>()

/** Historiques ayant ≥1 maîtrise fixe (outils/langues) → doivent avoir un porteur. */
const withFixed = backgroundsData.filter(b =>
  fixedProficiencies(b.toolProficiencies).length + fixedProficiencies(b.languageProficiencies).length > 0)

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  // Les historiques doivent exister avant le seed des porteurs (comme en prod).
  for (const bg of backgroundsData) {
    const row = await orm.insert(srcSchema.backgrounds).values({
      name: bg.name,
      description: bg.description,
      skillProficiencies: bg.skillProficiencies,
      toolProficiencies: bg.toolProficiencies,
      languageProficiencies: bg.languageProficiencies,
      featureName: bg.featureName,
      featureDescription: bg.featureDescription,
      characterSheetId: null,
    }).returning().get()
    bgIdByName.set(bg.name, row.id)
  }
})

describe('seedBackgroundProficiencies — structure', () => {
  it('crée un porteur pour chaque historique à maîtrise fixe, et aucun sinon', async () => {
    const report = await seedBackgroundProficiencies(orm, backgroundsData)
    expect(report.carriersInserted).toBe(withFixed.length)
    // 1 effet lié par entrée fixe (outils + langues) sur l'ensemble des historiques.
    const expectedEffects = backgroundsData.reduce((n, b) =>
      n + fixedProficiencies(b.toolProficiencies).length + fixedProficiencies(b.languageProficiencies).length, 0)
    expect(report.effectsLinked).toBe(expectedEffects)
  })

  it('le porteur est une feature proficiency_grant (jamais matérialisée ni affichée)', async () => {
    const carriers = await orm.select({ type: srcSchema.features.featureType })
      .from(srcSchema.features)
      .innerJoin(srcSchema.backgroundFeatures, eq(srcSchema.backgroundFeatures.featureId, srcSchema.features.id))
    expect(carriers.length).toBe(withFixed.length)
    expect(carriers.every((c: { type: string }) => c.type === 'proficiency_grant')).toBe(true)
  })
})

describe('deriveBackgroundProficiencies — équivalence dérivé == fixe', () => {
  for (const bg of backgroundsData) {
    it(`${bg.name} : dérive exactement ses maîtrises fixes`, async () => {
      const effects = await deriveBackgroundProficiencies(orm, bgIdByName.get(bg.name)!)
      const derivedTools = effects.filter(e => e.type === 'tool_proficiency').map(e => e.value).sort()
      const derivedLangs = effects.filter(e => e.type === 'language_proficiency').map(e => e.value).sort()
      expect(derivedTools).toEqual([...fixedProficiencies(bg.toolProficiencies)].sort())
      expect(derivedLangs).toEqual([...fixedProficiencies(bg.languageProficiencies)].sort())
    })
  }

  it('rend [] pour un historique sans porteur (backgroundId inconnu)', async () => {
    expect(await deriveBackgroundProficiencies(orm, 999999)).toEqual([])
  })

  it('rend [] pour backgroundId null (historique custom / absent)', async () => {
    expect(await deriveBackgroundProficiencies(orm, null)).toEqual([])
  })
})

describe('seedBackgroundProficiencies — idempotence', () => {
  it('un second passage ne crée ni porteur ni lien, et la dérivation est inchangée', async () => {
    const report = await seedBackgroundProficiencies(orm, backgroundsData)
    expect(report).toEqual({ carriersInserted: 0, effectsLinked: 0 })

    // Exemple : Marin garde ses 2 outils fixes après re-seed.
    const marin = await deriveBackgroundProficiencies(orm, bgIdByName.get('Marin')!)
    expect(marin.filter(e => e.type === 'tool_proficiency').map(e => e.value).sort())
      .toEqual(['Outils de navigateur', 'Véhicules aquatiques'])
  })
})

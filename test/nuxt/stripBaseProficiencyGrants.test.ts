import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'

// Volet B, étape 3 — LOGIQUE de la migration de strip `0092_strip_base_proficiency_grants`.
// On rejoue les migrations sur libsql (0092 tourne à vide → no-op, prouve la validité SQL), on
// coupe les FK, on bâtit un scénario (base classe/historique + tokens EN legacy + manuels FR +
// choisis + revoke + fiche sans porteur), on RÉ-EXÉCUTE le DELETE de 0092, puis on vérifie que
// seuls les grants de BASE (dérivables) et les tokens EN morts partent, les vrais deltas restant.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
let sheet1 = 0
let sheet2 = 0

/** Ensemble `type:value:action` des overrides restants d'une fiche après strip. */
async function remaining(sheetId: number): Promise<string[]> {
  const rows = await orm
    .select({ type: srcSchema.characterProficiencyOverrides.proficiencyType, value: srcSchema.characterProficiencyOverrides.value, action: srcSchema.characterProficiencyOverrides.action })
    .from(srcSchema.characterProficiencyOverrides)
    .where(eq(srcSchema.characterProficiencyOverrides.characterSheetId, sheetId))
  return rows.map((r: { type: string, value: string, action: string }) => `${r.type}:${r.value}:${r.action}`).sort()
}

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
  // Test de LOGIQUE : couper les FK APRÈS le replay (le driver libsql les applique, et une
  // migration recreate-table remet foreign_keys=ON) pour insérer un scénario minimal.
  await client.execute('PRAGMA foreign_keys = OFF')
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const addEffect = async (carrierId: number, type: string, value: string) => {
    const eff = await orm.insert(srcSchema.effects).values({ type, value }).returning().get()
    await orm.insert(srcSchema.featureEffects).values({ featureId: carrierId, effectId: eff.id })
  }

  // ── Classe A (avec porteur) : simple_weapons + Épée longue (FR) + light ──
  const clsA = await orm.insert(srcSchema.classes).values({ name: 'Barde', hitDice: '1d8' }).returning().get()
  const carrierA = await orm.insert(srcSchema.features)
    .values({ name: 'Maîtrises de la classe', featureType: 'proficiency_grant', classId: clsA.id, levelRequired: 1 })
    .returning().get()
  await addEffect(carrierA.id, 'weapon_proficiency', 'simple_weapons')
  await addEffect(carrierA.id, 'weapon_proficiency', 'Épée longue')
  await addEffect(carrierA.id, 'proficiency', 'light')

  // ── Classe B (SANS porteur) → auto-protection ──
  const clsB = await orm.insert(srcSchema.classes).values({ name: 'Homebrew', hitDice: '1d10' }).returning().get()

  // ── Historique (avec porteur) : outil fixe « Outils de voleur » ──
  const bg = await orm.insert(srcSchema.backgrounds).values({ name: 'Criminel' }).returning().get()
  const carrierBg = await orm.insert(srcSchema.features)
    .values({ name: 'Maîtrises historique', featureType: 'proficiency_grant', levelRequired: 1 })
    .returning().get()
  await orm.insert(srcSchema.backgroundFeatures).values({ backgroundId: bg.id, featureId: carrierBg.id })
  await addEffect(carrierBg.id, 'tool_proficiency', 'Outils de voleur')

  // ── Fiche 1 : classe A + historique ──
  const s1 = await orm.insert(srcSchema.characterSheets).values({ name: 'S1', speciesId: 1, backgroundId: bg.id }).returning().get()
  sheet1 = s1.id
  await orm.insert(srcSchema.characterClasses).values({ characterSheetId: sheet1, classId: clsA.id, level: 3, isMain: true })
  await orm.insert(srcSchema.characterProficiencyOverrides).values([
    { characterSheetId: sheet1, proficiencyType: 'weapon', value: 'simple_weapons', action: 'grant' }, // STRIP (porteur)
    { characterSheetId: sheet1, proficiencyType: 'weapon', value: 'Épée longue', action: 'grant' }, // STRIP (porteur, FR précise)
    { characterSheetId: sheet1, proficiencyType: 'weapon', value: 'longsword', action: 'grant' }, // STRIP (token EN legacy mort)
    { characterSheetId: sheet1, proficiencyType: 'weapon', value: 'Fouet', action: 'grant' }, // KEEP (manuel FR)
    { characterSheetId: sheet1, proficiencyType: 'armor', value: 'light', action: 'grant' }, // STRIP (porteur)
    { characterSheetId: sheet1, proficiencyType: 'armor', value: 'heavy', action: 'grant' }, // KEEP (manuel)
    { characterSheetId: sheet1, proficiencyType: 'tool', value: 'Outils de voleur', action: 'grant' }, // STRIP (porteur histo)
    { characterSheetId: sheet1, proficiencyType: 'tool', value: 'Outils de forgeron', action: 'grant' }, // KEEP (choisi)
    { characterSheetId: sheet1, proficiencyType: 'language', value: 'Elfique', action: 'grant' }, // KEEP (choisie)
    { characterSheetId: sheet1, proficiencyType: 'weapon', value: 'martial_weapons', action: 'revoke' }, // KEEP (revoke)
  ])

  // ── Fiche 2 : classe B SANS porteur ──
  const s2 = await orm.insert(srcSchema.characterSheets).values({ name: 'S2', speciesId: 1 }).returning().get()
  sheet2 = s2.id
  await orm.insert(srcSchema.characterClasses).values({ characterSheetId: sheet2, classId: clsB.id, level: 1, isMain: true })
  await orm.insert(srcSchema.characterProficiencyOverrides).values([
    { characterSheetId: sheet2, proficiencyType: 'weapon', value: 'martial_weapons', action: 'grant' }, // KEEP (pas de porteur, pas legacy)
    { characterSheetId: sheet2, proficiencyType: 'weapon', value: 'longsword', action: 'grant' }, // STRIP (token EN legacy, inconditionnel)
  ])

  // Ré-exécute le DELETE de la migration 0092 sur le scénario.
  const stripSql = await readFile(MIGRATIONS_DIR + '0092_strip_base_proficiency_grants.sql', 'utf8')
  for (const statement of splitSqlQueries(stripSql)) await client.execute(statement)
})

describe('0092 strip — fiche avec porteurs de classe + historique', () => {
  it('retire les grants de base (porteur) + tokens EN legacy, garde manuels/choisis/revoke', async () => {
    expect(await remaining(sheet1)).toEqual([
      'armor:heavy:grant',
      'language:Elfique:grant',
      'tool:Outils de forgeron:grant',
      'weapon:Fouet:grant',
      'weapon:martial_weapons:revoke',
    ].sort())
  })
})

describe('0092 strip — fiche sans porteur (auto-protection)', () => {
  it('garde les grants non-legacy (pas de perte sans dérivation), retire le token EN mort', async () => {
    expect(await remaining(sheet2)).toEqual([
      'weapon:martial_weapons:grant',
    ])
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { barbareFeatures, BRUTAL_CRITICAL_DESCRIPTION } from '../../server/db/seeds/data/barbare'
import { bardeFeatures } from '../../server/db/seeds/data/barde'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0124 : pose sur les features déployées les effets que lit le lanceur de dés, corrige la description de
// Critique brutal et ajoute les avantages de la Rage. Les deux chemins (seed, migration) doivent produire les mêmes
// données, même rejouée.

const MIGRATION = '0124_roll_engine_effects.sql'

let client: Client
const ids: Record<string, number> = {}

const insert = async (sql: string, args: (string | number | null)[] = []) =>
  Number((await client.execute({ sql, args })).lastInsertRowid)

const feature = (name: string, type: string, level: number, classId: number | null, subclassId: number | null = null, meta: unknown = null) =>
  insert(
    'INSERT INTO features (name, description, feature_type, class_id, subclass_id, level_required, meta) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, 'ancienne description', type, classId, subclassId, level, meta === null ? null : JSON.stringify(meta)],
  )

const effectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
}

const rowOf = async (featureId: number) => {
  const r = (await client.execute({ sql: 'SELECT description, meta FROM features WHERE id = ?', args: [featureId] })).rows[0]!
  return { description: String(r.description), meta: r.meta == null ? null : JSON.parse(String(r.meta)) }
}

const seed = (features: FeatureDef[], name: string, level: number) =>
  features.find(f => f.name === name && f.levelRequired === level)!

const champion = guerrierSubclasses.find(s => s.name === 'Champion')!.features

// Ce que la 0120 avait posé sur la Rage, avant les avantages.
const rageBefore = () => {
  const meta = seed(barbareFeatures, 'Rage', 1).meta!
  return { ...meta, whileActive: meta.whileActive!.filter(e => e.type !== 'advantage') }
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  const bard = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Barde', '1d8'])
  const fighter = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Guerrier', '1d10'])
  const rogue = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Roublard', '1d8'])
  const barbarian = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Barbare', '1d12'])
  const barbarian55 = await insert('INSERT INTO classes (name, hit_dice, ruleset) VALUES (?, ?, ?)', ['Barbare', '1d12', '5.5'])
  const championId = await insert('INSERT INTO subclasses (class_id, name) VALUES (?, ?)', [fighter, 'Champion'])

  ids.jack = await feature('Touche-à-tout', 'class_feature', 2, bard)
  ids.improvedCritical = await feature('Critique amélioré', 'subclass_feature', 3, null, championId)
  ids.athlete = await feature('Athlète accompli', 'subclass_feature', 7, null, championId)
  ids.superiorCritical = await feature('Critique supérieur', 'subclass_feature', 15, null, championId)
  ids.uncannyDodge = await feature('Esquive instinctive', 'class_feature', 5, rogue)
  ids.reliableTalent = await feature('Savoir-faire', 'class_feature', 11, rogue)
  ids.feralInstinct = await feature('Instinct sauvage', 'class_feature', 7, barbarian)
  ids.brutalCritical = await feature('Critique brutal', 'class_feature', 9, barbarian)
  ids.rage = await feature('Rage', 'class_feature', 1, barbarian, null, rageBefore())
  ids.homonym55 = await feature('Critique brutal', 'class_feature', 9, barbarian55)

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0124 — moteur de jets', () => {
  it('Touche-à-tout et Athlète accompli : demi-maîtrise, comme le seed', async () => {
    expect(await effectsOf(ids.jack!)).toEqual(seed(bardeFeatures, 'Touche-à-tout', 2).effects)
    expect(await effectsOf(ids.athlete!)).toEqual(seed(champion, 'Athlète accompli', 7).effects)
  })

  it('Champion : plage de critique 19 puis 18, comme le seed', async () => {
    expect(await effectsOf(ids.improvedCritical!)).toEqual(seed(champion, 'Critique amélioré', 3).effects)
    expect(await effectsOf(ids.superiorCritical!)).toEqual(seed(champion, 'Critique supérieur', 15).effects)
  })

  it('Roublard : Esquive instinctive et Savoir-faire, comme le seed', async () => {
    expect(await effectsOf(ids.uncannyDodge!)).toEqual(seed(roublardFeatures, 'Esquive instinctive', 5).effects)
    expect(await effectsOf(ids.reliableTalent!)).toEqual(seed(roublardFeatures, 'Savoir-faire', 11).effects)
  })

  it('Barbare : Instinct sauvage et Critique brutal, comme le seed', async () => {
    expect(await effectsOf(ids.feralInstinct!)).toEqual(seed(barbareFeatures, 'Instinct sauvage', 7).effects)
    expect(await effectsOf(ids.brutalCritical!)).toEqual(seed(barbareFeatures, 'Critique brutal', 9).effects)
  })

  it('Critique brutal : la description d\'AideDD remplace celle qui le liait à la rage', async () => {
    const row = await rowOf(ids.brutalCritical!)
    expect(row.description).toBe(BRUTAL_CRITICAL_DESCRIPTION)
    expect(row.description).toBe(seed(barbareFeatures, 'Critique brutal', 9).description)
    expect(row.description).not.toContain('rage')
  })

  it('Rage : les avantages de Force s\'ajoutent à la méta sans la dupliquer, même rejouée', async () => {
    expect((await rowOf(ids.rage!)).meta).toEqual(seed(barbareFeatures, 'Rage', 1).meta)
  })

  it('ne touche pas l\'homonyme de l\'édition 2024', async () => {
    expect(await effectsOf(ids.homonym55!)).toEqual([])
    expect((await rowOf(ids.homonym55!)).description).toBe('ancienne description')
  })

  it('rejouée, ne duplique aucun effet', async () => {
    const count = async (type: string) =>
      Number((await client.execute({ sql: 'SELECT count(*) AS c FROM effects WHERE type = ?', args: [type] })).rows[0]!.c)
    expect(await count('half_proficiency')).toBe(2)
    expect(await count('critical_range')).toBe(2)
    expect(await count('halve_damage_reaction')).toBe(1)
    expect(await count('proficient_check_minimum')).toBe(1)
    expect(await count('critical_extra_dice')).toBe(1)
    expect(await count('advantage')).toBe(1)
  })
})

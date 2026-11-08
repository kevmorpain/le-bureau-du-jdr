import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { LATER_KI_SPENDS } from '../fixtures/classResourcePatches'
import { featureCounterPatches } from '../fixtures/featureCounterPatches'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0157 : pose sur les features déployées les compteurs, coûts et recharges que le seed déclare
// (`featureCounterPatches`). Les deux chemins doivent produire les mêmes données, même rejouée.

const MIGRATION = '0157_feature_counters.sql'

const patches = featureCounterPatches()
const featureIds = new Map<string, number>()
let client: Client
let homonym55: number

const key = (p: { className: string, subclass: string | null, feature: { name: string, levelRequired?: number | null } }) =>
  `${p.className}/${p.subclass ?? '-'}/${p.feature.name}/${p.feature.levelRequired}`

const rowOf = async (featureId: number) => {
  const res = await client.execute({ sql: 'SELECT max_uses_formula, recharge_type, meta FROM features WHERE id = ?', args: [featureId] })
  const r = res.rows[0]!
  return {
    maxUsesFormula: r.max_uses_formula == null ? null : JSON.parse(String(r.max_uses_formula)),
    rechargeType: r.recharge_type == null ? null : String(r.recharge_type),
    meta: r.meta == null ? null : JSON.parse(String(r.meta)),
  }
}

// « Ki » arrive avec la meta que lui pose la 0120 ; les autres capacités n'ont rien, mais une recharge à retirer.
const priorMeta = (p: (typeof patches)[number]) => {
  const meta = p.feature.meta
  if (!meta?.spends) return null
  const { regains: _later, ...rest } = meta
  return JSON.stringify({ ...rest, spends: meta.spends.filter(s => !LATER_KI_SPENDS.includes(s.label)) })
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  const classIds = new Map<string, number>()
  const subclassIds = new Map<string, number>()
  let id = 1
  for (const p of patches) {
    if (!classIds.has(p.className)) {
      classIds.set(p.className, id)
      await client.execute({ sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)', args: [id++, p.className, '1d8'] })
    }
  }
  let featureId = 1000
  for (const p of patches) {
    const classId = classIds.get(p.className)!
    let subclassId: number | null = null
    if (p.subclass) {
      const sk = `${p.className}/${p.subclass}`
      if (!subclassIds.has(sk)) {
        subclassIds.set(sk, id)
        await client.execute({ sql: 'INSERT INTO subclasses (id, class_id, name) VALUES (?, ?, ?)', args: [id++, classId, p.subclass] })
      }
      subclassId = subclassIds.get(sk)!
    }
    await client.execute({
      sql: 'INSERT INTO features (id, name, description, feature_type, class_id, subclass_id, level_required, recharge_type, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [featureId, p.feature.name, 'description', subclassId ? 'subclass_feature' : 'class_feature', subclassId ? null : classId, subclassId, p.feature.levelRequired ?? null, 'long_rest', priorMeta(p)],
    })
    featureIds.set(key(p), featureId++)
  }

  const paladin55 = id++
  await client.execute({ sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)', args: [paladin55, 'Paladin', '1d10', '5.5'] })
  homonym55 = featureId
  await client.execute({
    sql: 'INSERT INTO features (id, name, description, feature_type, class_id, level_required, recharge_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [homonym55, 'Sens divin', 'version 5.5', 'class_feature', paladin55, 1, 'long_rest'],
  })

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0157 — compteurs et coûts des capacités de classe', () => {
  it('couvre les neuf classes concernées', () => {
    expect(new Set(patches.map(p => p.className))).toEqual(new Set([
      'Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Moine', 'Occultiste', 'Paladin', 'Roublard',
    ]))
  })

  for (const p of patches) {
    it(`${key(p)} : exactement les données du seed, même rejouée`, async () => {
      const row = await rowOf(featureIds.get(key(p))!)
      expect(row.maxUsesFormula).toEqual(p.feature.maxUsesFormula ?? null)
      expect(row.rechargeType).toBe(p.feature.rechargeType ?? null)
      expect(row.meta).toEqual(p.feature.meta ?? null)
    })
  }

  it('n\'touche pas l\'homonyme de l\'édition 2024', async () => {
    const row = await rowOf(homonym55)
    expect(row.maxUsesFormula).toBeNull()
    expect(row.rechargeType).toBe('long_rest')
  })
})

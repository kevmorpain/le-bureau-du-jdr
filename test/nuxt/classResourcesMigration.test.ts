import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { CLASS_RESOURCE_EFFECT_TYPES, classResourcePatches } from '../fixtures/classResourcePatches'
import { paladinFeatures } from '../../server/db/seeds/data/paladin'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0120 : pose sur les features déployées les compteurs, métadonnées et effets de ressources que le seed
// déclare (`classResourcePatches`). Les deux chemins doivent produire les mêmes données, même rejouée.

const MIGRATION = '0120_class_resources.sql'

const patches = classResourcePatches()
const featureIds = new Map<string, number>()
let client: Client
let homonym55: number

const key = (p: { className: string, subclass: string | null, feature: { name: string, levelRequired?: number | null } }) =>
  `${p.className}/${p.subclass ?? '-'}/${p.feature.name}/${p.feature.levelRequired}`

// La Rage a gagné ses avantages (migration 0124, moteur de jets) après la 0120 : on compare ce que la 0120 pose.
const withoutLaterEffects = <T extends { whileActive?: { type: string }[] } | null>(meta: T): T =>
  meta?.whileActive ? { ...meta, whileActive: meta.whileActive.filter(e => e.type !== 'advantage') } : meta

// L'Attaque sournoise a gagné `needsAdvantage` avec la migration 0125.
const withoutLaterFields = <T extends { type: string, value: unknown }>(effect: T): T => {
  if (effect.type !== 'weapon_damage_dice') return effect
  const { needsAdvantage: _later, ...value } = effect.value as Record<string, unknown>
  return { ...effect, value }
}

const rowOf = async (featureId: number) => {
  const res = await client.execute({ sql: 'SELECT max_uses_formula, meta, description FROM features WHERE id = ?', args: [featureId] })
  const r = res.rows[0]!
  return {
    maxUsesFormula: r.max_uses_formula == null ? null : JSON.parse(String(r.max_uses_formula)),
    meta: r.meta == null ? null : JSON.parse(String(r.meta)),
    description: String(r.description),
  }
}

const resourceEffectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows
    .map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
    .filter(e => CLASS_RESOURCE_EFFECT_TYPES.includes(e.type))
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
      sql: 'INSERT INTO features (id, name, description, feature_type, class_id, subclass_id, level_required) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [featureId, p.feature.name, 'ancienne description', subclassId ? 'subclass_feature' : 'class_feature', subclassId ? null : classId, subclassId, p.feature.levelRequired ?? null],
    })
    featureIds.set(key(p), featureId++)
  }

  const paladin55 = id++
  await client.execute({ sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)', args: [paladin55, 'Paladin', '1d10', '5.5'] })
  homonym55 = featureId
  await client.execute({
    sql: 'INSERT INTO features (id, name, description, feature_type, class_id, level_required) VALUES (?, ?, ?, ?, ?, ?)',
    args: [homonym55, 'Imposition des mains', 'version 5.5', 'class_feature', paladin55, 1],
  })

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0120 — ressources de classe', () => {
  it('couvre les dix classes porteuses de ressources', () => {
    expect(new Set(patches.map(p => p.className))).toEqual(new Set([
      'Barbare', 'Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Guerrier', 'Moine', 'Paladin', 'Rôdeur', 'Roublard',
    ]))
  })

  for (const p of patches) {
    it(`${key(p)} : exactement les données du seed, même rejouée`, async () => {
      const fid = featureIds.get(key(p))!
      const row = await rowOf(fid)
      expect(row.maxUsesFormula).toEqual(p.feature.maxUsesFormula ?? null)
      expect(row.meta).toEqual(withoutLaterEffects(p.feature.meta ?? null))
      const expected = (p.feature.effects ?? []).filter(e => CLASS_RESOURCE_EFFECT_TYPES.includes(e.type)).map(withoutLaterFields)
      const actual = await resourceEffectsOf(fid)
      const sortKey = (e: { type: string, value: unknown }) => `${e.type}:${JSON.stringify(e.value)}`
      expect(actual.map(sortKey).sort()).toEqual(expected.map(sortKey).sort())
    })
  }

  it('Châtiment divin : la description du seed remplace le texte erroné', async () => {
    const seed = paladinFeatures.find(f => f.name === 'Châtiment divin')!
    const row = await rowOf(featureIds.get('Paladin/-/Châtiment divin/2')!)
    expect(row.description).toBe(seed.description)
  })

  it('une même valeur d\'effet n\'est créée qu\'une fois (Attaque supplémentaire à 2 attaques)', async () => {
    const res = await client.execute(`SELECT count(*) AS c FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}'`)
    expect(Number(res.rows[0]!.c)).toBe(1)
  })

  it('n\'touche pas l\'homonyme de l\'édition 2024', async () => {
    const row = await rowOf(homonym55)
    expect(row.maxUsesFormula).toBeNull()
    expect(row.meta).toBeNull()
    expect(await resourceEffectsOf(homonym55)).toEqual([])
  })
})

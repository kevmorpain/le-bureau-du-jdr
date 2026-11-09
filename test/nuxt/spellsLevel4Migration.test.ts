import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { spellsLevel4, spellClassMappingsLevel4 } from '../../server/db/seeds/data/spells_niveau_4'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0161 : pose sur une base déployée les sorts de niveau 4 du socle et leurs liens de classes, comme le seed.

const MIGRATION = '0161_spells_level_4.sql'
const CLASS_NAMES = ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin', 'Rôdeur']

let client: Client

const json = (v: unknown) => (v == null ? null : JSON.parse(String(v)))

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  for (const [i, name] of CLASS_NAMES.entries()) {
    await client.execute({ sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)', args: [i + 1, name, '1d8', '5'] })
  }
  // Une base déployée a déjà son catalogue de sorts ; un homonyme 5.5 ne bloque pas le sort 2014.
  await client.execute(`INSERT INTO spells (name, level, casting_time, range, duration, school_id) VALUES ('Boule de feu', 3, '1 action', 45, 'Instantanée', 5)`)
  await client.execute(`INSERT INTO spells (name, level, casting_time, range, duration, school_id, ruleset, description) VALUES ('Mur de feu', 4, '1 action', 36, 'Instantanée', 5, '5.5', 'version 5.5')`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0161 — sorts de niveau 4', () => {
  it('pose les 29 sorts une seule fois, exactement comme le seed, même rejouée', async () => {
    expect(spellsLevel4).toHaveLength(29)
    const res = await client.execute(`SELECT name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal FROM spells WHERE ruleset = '5' AND level = 4`)
    const byName = (a: { name: unknown }, b: { name: unknown }) => String(a.name).localeCompare(String(b.name), 'fr')
    const actual = res.rows.map(r => ({
      name: r.name,
      level: Number(r.level),
      castingTime: r.casting_time,
      range: Number(r.range),
      components: json(r.components),
      material: r.material ?? null,
      materialCost: json(r.material_cost),
      ritual: Boolean(r.ritual),
      duration: r.duration,
      durationUnit: r.duration_unit,
      durationValue: r.duration_value == null ? null : Number(r.duration_value),
      concentration: Boolean(r.concentration),
      description: r.description,
      schoolId: Number(r.school_id),
      dc: json(r.dc),
      attackType: r.attack_type ?? null,
      areaOfEffect: json(r.area_of_effect),
      damages: json(r.damages),
      heal: json(r.heal),
    })).sort(byName)
    const expected = spellsLevel4.map(s => ({
      name: s.name,
      level: s.level,
      castingTime: s.castingTime,
      range: s.range,
      components: s.components,
      material: s.material ?? null,
      materialCost: s.materialCost ?? null,
      ritual: s.ritual ?? false,
      duration: s.duration,
      durationUnit: s.durationUnit,
      durationValue: s.durationValue ?? null,
      concentration: s.concentration ?? false,
      description: s.description,
      schoolId: s.schoolId,
      dc: s.dc ?? null,
      attackType: s.attackType ?? null,
      areaOfEffect: s.areaOfEffect ?? null,
      damages: s.damages ?? null,
      heal: s.heal ?? null,
    })).sort(byName)
    expect(actual).toEqual(expected)
  })

  it('lie chaque sort à ses classes, comme le mapping du seed', async () => {
    const res = await client.execute(`SELECT s.name AS spell, c.name AS class FROM spell_classes sc JOIN spells s ON s.id = sc.spell_id JOIN classes c ON c.id = sc.class_id WHERE s.level = 4 AND s.ruleset = '5'`)
    const linked = new Map<string, string[]>()
    for (const r of res.rows) linked.set(String(r.spell), [...(linked.get(String(r.spell)) ?? []), String(r.class)])
    for (const { spellName, classNames } of spellClassMappingsLevel4) {
      expect([...(linked.get(spellName) ?? [])].sort(), spellName).toEqual([...classNames].sort())
    }
    expect(res.rows).toHaveLength(spellClassMappingsLevel4.reduce((n, m) => n + m.classNames.length, 0))
  })

  it('n\'écrase pas l\'homonyme 5.5 et ajoute le sort 2014 à côté', async () => {
    const res = await client.execute(`SELECT ruleset, description FROM spells WHERE name = 'Mur de feu' ORDER BY ruleset`)
    expect(res.rows.map(r => r.ruleset)).toEqual(['5', '5.5'])
    expect(res.rows.find(r => r.ruleset === '5.5')!.description).toBe('version 5.5')
  })

  it('laisse les sorts existants à leur place', async () => {
    const res = await client.execute(`SELECT count(*) AS n FROM spells WHERE name = 'Boule de feu'`)
    expect(Number(res.rows[0]!.n)).toBe(1)
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT count(*) AS n FROM spells`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})

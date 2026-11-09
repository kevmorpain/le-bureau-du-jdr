import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import type { SpellSeed } from '../../server/db/seeds/data/spells'
import { rollTables } from '../../server/db/seeds/data/rollTables'
import { applyMigration, replayMigrations } from './migrations'

type LevelMigration = {
  migration: string
  level: number
  count: number
  spells: SpellSeed[]
  mappings: { spellName: string, classNames: string[] }[]
}

const CLASS_NAMES = ['Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin', 'Rôdeur']

const json = (v: unknown) => (v == null ? null : JSON.parse(String(v)))

/** Une migration de sorts pose exactement ce que pose le seed, même rejouée, sans toucher au reste ni à une base vierge. */
export function describeSpellLevelMigration({ migration, level, count, spells, mappings }: LevelMigration) {
  let client: Client
  const homonym = spells[0]!.name

  beforeAll(async () => {
    client = createClient({ url: ':memory:' })
    await replayMigrations(client, { before: migration })
    await client.execute('PRAGMA foreign_keys = OFF')
    for (const [i, name] of CLASS_NAMES.entries()) {
      await client.execute({ sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)', args: [i + 1, name, '1d8', '5'] })
    }
    // Une base déployée a déjà son catalogue de sorts ; un homonyme 5.5 ne bloque pas le sort 2014.
    await client.execute(`INSERT INTO spells (name, level, casting_time, range, duration, school_id) VALUES ('Boule de feu', 3, '1 action', 45, 'Instantanée', 5)`)
    await client.execute({
      sql: `INSERT INTO spells (name, level, casting_time, range, duration, school_id, ruleset, description) VALUES (?, ?, '1 action', 0, 'Instantanée', 5, '5.5', 'version 5.5')`,
      args: [homonym, level],
    })
    for (let pass = 0; pass < 2; pass++) await applyMigration(client, migration)
  })

  describe(`migration ${migration} — sorts de niveau ${level}`, () => {
    it(`pose les ${count} sorts une seule fois, exactement comme le seed, même rejouée`, async () => {
      expect(spells).toHaveLength(count)
      const res = await client.execute({
        sql: `SELECT name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, source, dc, attack_type, area_of_effect, damages, heal, multi_attack FROM spells WHERE ruleset = '5' AND level = ? AND name <> 'Boule de feu'`,
        args: [level],
      })
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
        source: r.source,
        dc: json(r.dc),
        attackType: r.attack_type ?? null,
        areaOfEffect: json(r.area_of_effect),
        damages: json(r.damages),
        heal: json(r.heal),
        multiAttack: json(r.multi_attack),
      })).sort(byName)
      const expected = spells.map(s => ({
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
        source: s.source ?? 'core',
        dc: s.dc ?? null,
        attackType: s.attackType ?? null,
        areaOfEffect: s.areaOfEffect ?? null,
        damages: s.damages ?? null,
        heal: s.heal ?? null,
        multiAttack: s.multiAttack ?? null,
      })).sort(byName)
      expect(actual).toEqual(expected)
    })

    it('lie chaque sort à ses classes, comme le mapping du seed', async () => {
      const res = await client.execute({
        sql: `SELECT s.name AS spell, c.name AS class FROM spell_classes sc JOIN spells s ON s.id = sc.spell_id JOIN classes c ON c.id = sc.class_id WHERE s.level = ? AND s.ruleset = '5'`,
        args: [level],
      })
      const linked = new Map<string, string[]>()
      for (const r of res.rows) linked.set(String(r.spell), [...(linked.get(String(r.spell)) ?? []), String(r.class)])
      for (const { spellName, classNames } of mappings) {
        expect([...(linked.get(spellName) ?? [])].sort(), spellName).toEqual([...classNames].sort())
      }
      expect(res.rows).toHaveLength(mappings.reduce((n, m) => n + m.classNames.length, 0))
    })

    it('pose la table à lancer des sorts qui en ont une, une seule fois, et la lie', async () => {
      for (const spell of spells.filter(s => s.rollTable)) {
        const seeded = rollTables.find(t => t.key === spell.rollTable)!
        const tables = await client.execute({ sql: `SELECT id, name, die, entries FROM roll_tables WHERE key = ? AND ruleset = '5'`, args: [seeded.key] })
        expect(tables.rows, spell.name).toHaveLength(1)
        expect({ name: tables.rows[0]!.name, die: Number(tables.rows[0]!.die), entries: json(tables.rows[0]!.entries) })
          .toEqual({ name: seeded.name, die: seeded.die, entries: seeded.entries })
        const linked = await client.execute({ sql: `SELECT roll_table_id FROM spells WHERE name = ? AND ruleset = '5'`, args: [spell.name] })
        expect(Number(linked.rows[0]!.roll_table_id), spell.name).toBe(Number(tables.rows[0]!.id))
      }
    })

    it('n\'écrase pas l\'homonyme 5.5 et ajoute le sort 2014 à côté', async () => {
      const res = await client.execute({ sql: `SELECT ruleset, description FROM spells WHERE name = ? ORDER BY ruleset`, args: [homonym] })
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
      for (const key of new Set(spells.map(s => s.rollTable).filter(Boolean))) {
        const tables = await blank.execute({ sql: `SELECT count(*) AS n FROM roll_tables WHERE key = ?`, args: [key!] })
        expect(Number(tables.rows[0]!.n), key).toBe(0)
      }
    })
  })
}

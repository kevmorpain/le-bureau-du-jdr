import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { computed, defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { inArray } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import type { Effect } from '../../server/db/schema/effects'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { useCharacterConditions } from '../../app/composables/character/useCharacterConditions'
import { blankFixture, mountAbilities } from './fixtures/characters'

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0100_effects_legacy_shapes.sql'

// Valeurs relevées telles quelles dans une base seedée avant le changement de forme des effets.
const LEGACY = [
  { id: 1, species: 'Haut-elfe', trait: 'Sens aiguisés', type: 'skill_proficiency', value: '"perception"' },
  { id: 2, species: 'Haut-elfe', trait: 'Ascendance féerique', type: 'advantage', value: '{"ability":"saving_throws","condition":"charmed"}' },
  { id: 3, species: 'Nain des collines', trait: 'Résistance naine', type: 'advantage', value: '{"ability":"saving_throws","condition":"poison"}' },
  { id: 4, species: 'Halfelin pied-léger', trait: 'Brave', type: 'advantage', value: '{"ability":"saving_throws","condition":"frightened"}' },
  { id: 5, species: 'Drakéide (2014)', trait: 'Résistance aux dégâts', type: 'damage_resistance', value: '"draconic_ancestry"' },
  { id: 6, species: 'Gnome des roches', trait: 'Ruse gnome', type: 'advantage', ability: 'int', value: '{"type":"saving_throw","ability":"int","condition":"magic"}' },
  { id: 7, species: 'Gnome des roches', trait: 'Ruse gnome', type: 'advantage', ability: 'wis', value: '{"type":"saving_throw","ability":"wis","condition":"magic"}' },
  { id: 8, species: 'Gnome des roches', trait: 'Ruse gnome', type: 'advantage', ability: 'cha', value: '{"type":"saving_throw","ability":"cha","condition":"magic"}' },
  { id: 9, species: 'Demi-elfe', trait: 'Ascendance féerique', type: 'advantage', value: '{"ability":"saving_throws","condition":"charmed"}' },
  { id: 10, species: 'Demi-orc', trait: 'Menaçant', type: 'skill_proficiency', value: '{"ability":"intimidation"}' },
]

// Déjà à la forme actuelle, ou d'un autre type à valeur texte : la migration ne doit pas y toucher.
const UNTOUCHED = [
  { id: 101, type: 'skill_proficiency', value: '{"skill":"stealth"}' },
  { id: 102, type: 'advantage', value: '{"rollType":"saving_throw","ability":"all","condition":"charmed"}' },
  { id: 103, type: 'damage_resistance', value: '{"damageType":"poison"}' },
  { id: 104, type: 'immunity', value: '"sleep_magic"' },
  { id: 105, type: 'language_proficiency', value: '"Commun"' },
  { id: 106, type: 'weapon_proficiency', value: '"Épée longue"' },
  { id: 107, type: 'tool_proficiency_choice', value: '["Outils de forgeron","Outils de brasseur"]' },
]

const LEGACY_IDS = LEGACY.map(c => c.id)

let client: Client
let splitSqlQueries: (sql: string) => string[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
let before: Effect[] = []
let after: Effect[] = []

async function applyMigration() {
  const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (const statement of splitSqlQueries(sql)) await client.execute(statement)
}

async function rawValues(): Promise<Map<number, string>> {
  const rows = await client.execute('SELECT id, value FROM effects ORDER BY id')
  return new Map(rows.rows.map(r => [Number(r.id), String(r.value)]))
}

async function legacyEffects(): Promise<Effect[]> {
  const rows = await orm.select().from(srcSchema.effects).where(inArray(srcSchema.effects.id, LEGACY_IDS))
  return rows.map((r: { type: string, value: unknown }) => ({ type: r.type, value: r.value }) as Effect)
}

function seedEffect(c: (typeof LEGACY)[number]) {
  const trait = characterSpecies.find(s => s.name === c.species)?.traits?.find(t => t.name === c.trait)
  const matches = (trait?.effects ?? []).filter(e =>
    e.type === c.type && (c.ability === undefined || (e.value as { ability?: string }).ability === c.ability),
  )
  expect(matches, `${c.species} › ${c.trait}`).toHaveLength(1)
  return matches[0]!
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  splitSqlQueries = mod.splitSqlQueries
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  client = createClient({ url: ':memory:' })
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  for (const row of [...LEGACY, ...UNTOUCHED]) {
    await client.execute({ sql: 'INSERT INTO effects (id, type, value) VALUES (?, ?, ?)', args: [row.id, row.type, row.value] })
  }

  before = await legacyEffects()
  await applyMigration()
  after = await legacyEffects()
})

describe('migration 0100 — effets d\'espèce à l\'ancienne forme', () => {
  it('réécrit chaque forme obsolète en exactement la valeur écrite par le seed', async () => {
    const values = await rawValues()
    for (const c of LEGACY) {
      expect(values.get(c.id), `${c.species} › ${c.trait}`).toBe(JSON.stringify(seedEffect(c).value))
    }
  })

  it('ne touche ni les effets déjà à jour ni les autres types', async () => {
    const values = await rawValues()
    for (const c of UNTOUCHED) {
      expect(values.get(c.id), c.type).toBe(c.value)
    }
  })

  it('est idempotente', async () => {
    const once = await rawValues()
    await applyMigration()
    expect(await rawValues()).toEqual(once)
  })
})

describe('migration 0100 — ce que la fiche relit', () => {
  const proficiency = (effects: Effect[], skill: string) =>
    mountAbilities({ ...blankFixture, speciesEffects: effects }).getEffectiveProficiency(skill)

  const defenseKeys = async (effects: Effect[]) => {
    let keys: string[] = []
    await mountSuspended(defineComponent({
      setup() {
        keys = useCharacterConditions(undefined, {
          allEffects: computed(() => effects),
          speed: computed(() => 9),
          abilityModifiers: computed(() => ({})),
        }).defenseEntries.value.map(e => e.key).sort()
        return () => h('div')
      },
    }))
    return keys
  }

  it('rend la maîtrise d\'Intimidation (Menaçant) et de Perception (Sens aiguisés)', () => {
    expect(proficiency(before, 'intimidation')).toBe('none')
    expect(proficiency(before, 'perception')).toBe('none')

    expect(proficiency(after, 'intimidation')).toBe('proficient')
    expect(proficiency(after, 'perception')).toBe('proficient')
  })

  it('rend les avantages aux JdS et la résistance draconique aux défenses', async () => {
    const expected = ['dmg:draconic_ancestry', 'jds:charmed', 'jds:frightened', 'jds:magic', 'jds:poison']

    expect((await defenseKeys(before)).filter(k => expected.includes(k))).toEqual([])
    expect(await defenseKeys(after)).toEqual(expected)
  })
})

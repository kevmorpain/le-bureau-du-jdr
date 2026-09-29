import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import type { FeatureChoice } from '../../server/db/seeds/lib/featureChoice'
import { dwarfToolChoice, oneLanguageChoice, twoSkillsChoice, wizardCantripChoice } from '../../server/db/seeds/data/speciesChoices'
import { characterSpecies } from '../../server/db/seeds/data/character_species'

// Migration 0107 : sur une base déployée, l'effet « au choix » d'un trait d'espèce devient le point de choix
// que le seed déclare (`choice`), et la Fadette reçoit son trait « Langues ».

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0107_species_trait_choices.sql'

let client: Client
const featureIds: Record<string, number> = {}
let fadetteId = 0

// Valeurs telles qu'écrites par le seed avant ce lot.
const LEGACY_TRAITS = [
  { key: 'polyvalence', type: 'species_trait', effect: { type: 'skill_proficiency_choice', value: '{"count":2}' } },
  { key: 'humanLanguages', type: 'species_trait', effect: { type: 'language_proficiency_choice', value: '{"count":1}' } },
  { key: 'dwarfTools', type: 'species_trait', effect: { type: 'tool_proficiency_choice', value: '["artisan_tools","brewer_tools","mason_tools"]' } },
  { key: 'highElfCantrip', type: 'lineage_feature', effect: { type: 'spell_choice', value: '{"class":"wizard","level":0,"spellcastingAbility":"int","count":1}' } },
  { key: 'highElfLanguage', type: 'lineage_feature', effect: { type: 'language_proficiency_choice', value: '{"count":1}' } },
  { key: 'linguist', type: 'feat', effect: { type: 'language_proficiency_choice', value: '{"count":3}' } },
]

async function progressionsOf(featureId: number): Promise<FeatureChoice[]> {
  const res = await client.execute({ sql: 'SELECT kind, count, option_source FROM progression WHERE feature_id = ?', args: [featureId] })
  return res.rows.map(r => ({
    kind: String(r.kind),
    count: JSON.parse(String(r.count)).value,
    optionSource: JSON.parse(String(r.option_source)),
  }) as FeatureChoice)
}

async function linkedEffectTypes(featureId: number): Promise<string[]> {
  const res = await client.execute({ sql: 'SELECT e.type FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?', args: [featureId] })
  return res.rows.map(r => String(r.type)).sort()
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const halfElf = await orm.insert(srcSchema.characterSpecies).values({ name: 'Demi-elfe', size: CreatureSize.Medium, speed: 9 }).returning().get()
  const fadette = await orm.insert(srcSchema.characterSpecies).values({ name: 'Fadette', size: CreatureSize.Small, speed: 9 }).returning().get()
  fadetteId = fadette.id
  const commonEffect = await orm.insert(srcSchema.effects).values({ type: 'language_proficiency', value: 'common' }).returning().get()

  for (const trait of LEGACY_TRAITS) {
    const feature = await orm.insert(srcSchema.features).values({ name: trait.key, featureType: trait.type as 'species_trait' }).returning().get()
    featureIds[trait.key] = feature.id
    if (trait.type === 'species_trait') await orm.insert(srcSchema.speciesFeatures).values({ speciesId: halfElf.id, featureId: feature.id })
    const effect = await client.execute({ sql: 'INSERT INTO effects (type, value) VALUES (?, ?) RETURNING id', args: [trait.effect.type, trait.effect.value] })
    await orm.insert(srcSchema.featureEffects).values({ featureId: feature.id, effectId: Number(effect.rows[0]!.id) })
  }
  // L'Humain garde son commun à côté du choix.
  await orm.insert(srcSchema.featureEffects).values({ featureId: featureIds.humanLanguages!, effectId: commonEffect.id })

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('migration 0107 — choix des traits d\'espèce', () => {
  it.each([
    ['polyvalence', twoSkillsChoice],
    ['humanLanguages', oneLanguageChoice],
    ['dwarfTools', dwarfToolChoice],
    ['highElfCantrip', wizardCantripChoice],
    ['highElfLanguage', oneLanguageChoice],
  ])('%s : exactement le point de choix du seed, même rejouée', async (key, choice) => {
    expect(await progressionsOf(featureIds[key]!)).toEqual([choice])
  })

  it('retire l\'effet « au choix » des traits, garde les maîtrises fixes', async () => {
    expect(await linkedEffectTypes(featureIds.polyvalence!)).toEqual([])
    expect(await linkedEffectTypes(featureIds.humanLanguages!)).toEqual(['language_proficiency'])
  })

  it('ne touche pas au don Linguiste, dont l\'effet est lu avec les choix du don', async () => {
    expect(await progressionsOf(featureIds.linguist!)).toEqual([])
    expect(await linkedEffectTypes(featureIds.linguist!)).toEqual(['language_proficiency_choice'])
  })

  it('donne à la Fadette le trait « Langues » du seed : commun + une langue au choix', async () => {
    const res = await client.execute({
      sql: 'SELECT f.id, f.description FROM features f JOIN species_features sf ON sf.feature_id = f.id WHERE sf.species_id = ? AND f.name = \'Langues\'',
      args: [fadetteId],
    })
    expect(res.rows).toHaveLength(1)
    const seedTrait = characterSpecies.find(s => s.name === 'Fadette')!.traits.find(t => t.name === 'Langues')!
    expect(res.rows[0]!.description).toBe(seedTrait.description)
    const featureId = Number(res.rows[0]!.id)
    expect(await linkedEffectTypes(featureId)).toEqual(['language_proficiency'])
    expect(await progressionsOf(featureId)).toEqual([seedTrait.choice])
    const common = await client.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'language_proficiency\' AND value = \'"common"\'')
    expect(Number(common.rows[0]!.c)).toBe(1)
  })
})

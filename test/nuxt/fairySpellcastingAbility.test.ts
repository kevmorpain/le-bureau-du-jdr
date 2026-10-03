import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { loadCharacterSheet } from '../../server/utils/characterSheetLoader'
import { ensureFeatureChoice } from '../../server/db/seeds/lib/featureChoice'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { fairyCastingAbilityChoice } from '../../server/db/seeds/data/speciesChoices'
import type { Effect } from '../../server/db/schema/effects'
import { speciesEffectsOf } from '../../shared/rules/characterEffects'
import { speciesSpellcastingAbility } from '../../shared/rules/speciesSpellcasting'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Fadette, Magie des fées (#227) : la caractéristique d'incantation est un choix du joueur (point de choix
// `spellcasting_ability`, migration 0122) qui remplace celle des effets `spell_grant` à la lecture de la fiche.

const MIGRATION = '0122_fairy_spellcasting_ability.sql'
const OWNER = 1
const FIGHTER = 1

const seedTrait = characterSpecies.find(s => s.name === 'Fadette')!.traits.find(t => t.name === 'Magie des fées')!
const LEGACY_DESCRIPTION = seedTrait.description.replace(', au choix.', ' (choisie à la création — ici le Charisme).')

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let fadetteId: number
let featureId: number
let homonymFeatureId: number
let progressionId: number

async function addTrait(speciesId: number, description: string): Promise<number> {
  const feature = await db.insert(schema.features).values({ name: 'Magie des fées', description, featureType: 'species_trait' }).returning().get()
  await db.insert(schema.speciesFeatures).values({ speciesId, featureId: feature.id })
  for (const effect of seedTrait.effects ?? []) {
    const row = await db.insert(schema.effects).values(effect).returning().get()
    await db.insert(schema.featureEffects).values({ featureId: feature.id, effectId: row.id })
  }
  return feature.id
}

const create = (choicePicks: unknown[]) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'Fée', hpBase: 10, classId: FIGHTER, level: 1, speciesId: fadetteId,
    abilityScores: { str: 10 }, classSkills: [], backgroundSkills: [], spellIds: [], choicePicks,
  }), OWNER)

const grantAbilities = async (sheetId: number) =>
  speciesEffectsOf(await loadCharacterSheet(db, sheetId)).flatMap(e => e.type === 'spell_grant' ? [e.value.spellcastingAbility] : [])

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'Testeur' })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' })

  fadetteId = (await db.insert(schema.characterSpecies).values({ name: 'Fadette', size: CreatureSize.Small, speed: 9 }).returning().get()).id
  const homonym = await db.insert(schema.characterSpecies).values({ name: 'Fadette', size: CreatureSize.Small, speed: 9, ruleset: '5.5' }).returning().get()
  featureId = await addTrait(fadetteId, LEGACY_DESCRIPTION)
  homonymFeatureId = await addTrait(homonym.id, LEGACY_DESCRIPTION)

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
  const res = await client.execute({ sql: 'SELECT id FROM progression WHERE feature_id = ?', args: [featureId] })
  progressionId = Number(res.rows[0]!.id)
}, 60000)

describe('migration 0122 — choix de la caractéristique d\'incantation', () => {
  it('le trait de la Fadette porte exactement le point de choix du seed, même rejouée', async () => {
    const res = await client.execute({ sql: 'SELECT kind, count, option_source FROM progression WHERE feature_id = ?', args: [featureId] })
    expect(res.rows.map(r => ({ kind: r.kind, count: JSON.parse(String(r.count)).value, optionSource: JSON.parse(String(r.option_source)) })))
      .toEqual([fairyCastingAbilityChoice])
    expect(seedTrait.choice).toEqual(fairyCastingAbilityChoice)
  })

  it('la description devient celle du seed, sans le Charisme figé', async () => {
    const [feature] = await db.select().from(schema.features).where(eq(schema.features.id, featureId))
    expect(feature.description).toBe(seedTrait.description)
  })

  it('ne touche pas l\'homonyme d\'une autre édition', async () => {
    const res = await client.execute({ sql: 'SELECT COUNT(*) AS n FROM progression WHERE feature_id = ?', args: [homonymFeatureId] })
    expect(Number(res.rows[0]!.n)).toBe(0)
    const [feature] = await db.select().from(schema.features).where(eq(schema.features.id, homonymFeatureId))
    expect(feature.description).toBe(LEGACY_DESCRIPTION)
  })

  it('idempotent avec le seed : ensureFeatureChoice ne crée pas de second point de choix', async () => {
    expect(await ensureFeatureChoice(db, featureId, fairyCastingAbilityChoice)).toBe(false)
  })
})

describe('Fadette — caractéristique d\'incantation choisie à la création', () => {
  it.each(['int', 'wis', 'cha'])('%s : le pick est enregistré et remplace celle des sorts octroyés', async (ability) => {
    const { id } = await create([{ progressionId, value: ability }])
    const picks = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, id))
    expect(picks.map((p: { selectedValue: string }) => p.selectedValue)).toEqual([ability])
    expect(await grantAbilities(id)).toEqual([ability, ability, ability])
  })

  it('sans pick (fiche existante) : le Charisme des effets reste la valeur par défaut', async () => {
    const { id } = await create([])
    expect(await grantAbilities(id)).toEqual(['cha', 'cha', 'cha'])
  })

  it('refuse une caractéristique hors de la liste, ou deux choix', async () => {
    await expect(create([{ progressionId, value: 'str' }])).rejects.toThrow(/n'est pas une option/)
    await expect(create([{ progressionId, value: 'int' }, { progressionId, value: 'wis' }])).rejects.toThrow(CharacterValidationError)
  })
})

describe('caractéristique d\'incantation des sorts d\'espèce', () => {
  const grant = (spellcastingAbility: string): Effect => ({ type: 'spell_grant', value: { level: 0, spellcastingAbility, spellName: 'Druidisme', countPerLongRest: 0 } } as Effect)

  it('lit celle des effets de l\'espèce', () => {
    expect(speciesSpellcastingAbility([grant('wis')])).toBe('wis')
  })

  it('aucune pour une espèce sans sort octroyé, ou une valeur inconnue', () => {
    expect(speciesSpellcastingAbility([])).toBeNull()
    expect(speciesSpellcastingAbility([{ type: 'walking_speed', value: 9 }])).toBeNull()
    expect(speciesSpellcastingAbility([grant('xxx')])).toBeNull()
  })
})

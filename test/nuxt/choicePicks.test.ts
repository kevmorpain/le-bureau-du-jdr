import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { deleteBackgroundChoicePicks, deriveChoiceProficiencies } from '../../server/utils/choicePicks'
import { buildCatalog } from '../../server/utils/catalog'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { ensureFeatureChoice } from '../../server/db/seeds/lib/featureChoice'
import { seedBackgroundProficiencies } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { twoSkillsChoice } from '../../server/db/seeds/data/speciesChoices'
import { resolveChoices } from '../../shared/rules/resolve'
import { LANGUAGE_KEYS } from '../../shared/rules/languages'
import type { ChoiceKind } from '../../shared/rules/choices'

// Chemin générique des points de choix de maîtrise et de sort mineur : le pick est validé contre
// `resolveChoices`, stocké en `character_choices`, et la maîtrise dérivée à la lecture.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const FIGHTER = 1
const WIZARD = 2
const OWNER = 1
const CANTRIP = 50
const LEVEL_1_SPELL = 51

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let elfId: number
let highElfId: number
let halfElfId: number
let merchantId: number

async function progressionOf(featureName: string, kind: ChoiceKind): Promise<number> {
  const [row] = await db.select({ id: schema.progression.id })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.features.name, featureName), eq(schema.progression.kind, kind)))
  return row.id
}

function input(over: Record<string, unknown>) {
  return createCharacterSchema.parse({
    name: 'Choix',
    maxHp: 10,
    classId: FIGHTER,
    level: 1,
    abilityScores: { str: 15 },
    classSkills: [],
    backgroundSkills: [],
    spellIds: [],
    ...over,
  })
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const client = createClient({ url: ':memory:' })
  for (const file of (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()) {
    for (const statement of splitSqlQueries(await readFile(MIGRATIONS_DIR + file, 'utf8'))) await client.execute(statement)
  }
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'Testeur' })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.magicSchools).values({ id: 1, name: 'Évocation' })
  await db.insert(schema.classes).values([
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
    { id: WIZARD, name: 'Magicien', hitDice: '1d6', spellcastingType: 'full' },
  ])
  await db.insert(schema.spells).values([
    { id: CANTRIP, name: 'Trait de feu', level: 0, castingTime: '1 action', range: 36, duration: 'Instantané', schoolId: 1 },
    { id: LEVEL_1_SPELL, name: 'Projectile magique', level: 1, castingTime: '1 action', range: 36, duration: 'Instantané', schoolId: 1 },
  ])
  await db.insert(schema.spellClasses).values([{ spellId: CANTRIP, classId: WIZARD }, { spellId: LEVEL_1_SPELL, classId: WIZARD }])

  await seedElfLineages(db)
  const [elf] = await db.select().from(schema.characterSpecies).where(eq(schema.characterSpecies.name, 'Elfe'))
  elfId = elf.id
  const [highElf] = await db.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.name, 'Haut-elfe'))
  highElfId = highElf.id

  const halfElf = await db.insert(schema.characterSpecies).values({ name: 'Demi-elfe', size: CreatureSize.Medium, speed: 9 }).returning().get()
  halfElfId = halfElf.id
  const polyvalence = await db.insert(schema.features).values({ name: 'Polyvalence', featureType: 'species_trait' }).returning().get()
  await db.insert(schema.speciesFeatures).values({ speciesId: halfElfId, featureId: polyvalence.id })
  await ensureFeatureChoice(db, polyvalence.id, twoSkillsChoice)

  const merchant = await db.insert(schema.backgrounds).values({ name: 'Marchand de guilde' }).returning().get()
  merchantId = merchant.id
  await seedBackgroundProficiencies(db, backgroundsData.filter(b => b.name === 'Marchand de guilde'))
})

describe('catalogue — options des choix de langue, d\'outil et de sort mineur', () => {
  it('lignée Haut-elfe : une langue parmi toutes, un sort mineur de magicien seulement', async () => {
    const catalog = await buildCatalog(db, { speciesIds: [elfId], lineageIds: [highElfId] })
    const { choices } = resolveChoices({ classLevels: { [FIGHTER]: 1 }, speciesId: elfId, lineageId: highElfId }, catalog)
    const language = choices.find(c => c.kind === 'language')!
    expect(language.ownerLineageId).toBe(highElfId)
    expect(language.options.map(o => o.value)).toEqual(LANGUAGE_KEYS)
    const cantrip = choices.find(c => c.kind === 'cantrip')!
    expect(cantrip.options.map(o => o.spellId)).toEqual([CANTRIP])
  })
})

describe('createCharacter — picks génériques', () => {
  it('Haut-elfe : enregistre les picks, range le sort mineur avec les sorts d\'espèce, dérive la langue', async () => {
    const languageProg = await progressionOf('Langue supplémentaire', 'language')
    const cantripProg = await progressionOf('Sort mineur', 'cantrip')
    const { id } = await createCharacter(db, input({
      speciesId: elfId,
      selectedLineageId: highElfId,
      choicePicks: [{ progressionId: languageProg, value: 'draconic' }, { progressionId: cantripProg, spellId: CANTRIP }],
    }), OWNER)

    const picks = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, id))
    expect(picks.filter((p: { progressionId: number }) => p.progressionId === languageProg).map((p: { selectedValue: string }) => p.selectedValue)).toEqual(['draconic'])
    const spells = await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, id))
    expect(spells).toEqual([expect.objectContaining({ spellId: CANTRIP, source: 'species' })])
    expect(await deriveChoiceProficiencies(db, id)).toEqual([{ type: 'language_proficiency', value: 'draconic' }])
  })

  it('Demi-elfe : les deux compétences de Polyvalence deviennent des maîtrises dérivées', async () => {
    const prog = await progressionOf('Polyvalence', 'skill')
    const { id } = await createCharacter(db, input({
      speciesId: halfElfId,
      choicePicks: [{ progressionId: prog, value: 'stealth' }, { progressionId: prog, value: 'arcana' }],
    }), OWNER)
    const effects = await deriveChoiceProficiencies(db, id)
    expect(effects.map(e => (e.value as { skill: string }).skill).sort()).toEqual(['arcana', 'stealth'])
  })

  it('refuse un pick sur le point de choix d\'une autre espèce', async () => {
    const prog = await progressionOf('Polyvalence', 'skill')
    await expect(createCharacter(db, input({ speciesId: elfId, selectedLineageId: highElfId, choicePicks: [{ progressionId: prog, value: 'stealth' }] }), OWNER))
      .rejects.toThrow(CharacterValidationError)
  })

  it('refuse un pick de trop, en double, hors des options ou du mauvais type', async () => {
    const skills = await progressionOf('Polyvalence', 'skill')
    const cantrip = await progressionOf('Sort mineur', 'cantrip')
    const halfElf = (choicePicks: unknown[]) => createCharacter(db, input({ speciesId: halfElfId, choicePicks }), OWNER)
    const highElf = (choicePicks: unknown[]) => createCharacter(db, input({ speciesId: elfId, selectedLineageId: highElfId, choicePicks }), OWNER)
    await expect(halfElf(['stealth', 'arcana', 'history'].map(value => ({ progressionId: skills, value })))).rejects.toThrow(/Trop de choix/)
    await expect(halfElf(['stealth', 'stealth'].map(value => ({ progressionId: skills, value })))).rejects.toThrow(/deux fois/)
    await expect(halfElf([{ progressionId: skills, value: 'voler' }])).rejects.toThrow(/n'est pas une option/)
    await expect(highElf([{ progressionId: cantrip, spellId: LEVEL_1_SPELL }])).rejects.toThrow(/n'est pas une option/)
    await expect(highElf([{ progressionId: cantrip, value: 'Trait de feu' }])).rejects.toThrow(/attend un sort/)
  })
})

describe('choix d\'historique — Marchand de guilde', () => {
  it('une langue prise à la place des outils de navigateur devient une maîtrise de langue', async () => {
    const tool = await progressionOf('Maîtrises d\'historique', 'tool')
    const language = await progressionOf('Maîtrises d\'historique', 'language')
    const { id } = await createCharacter(db, input({
      speciesId: halfElfId,
      backgroundId: merchantId,
      choicePicks: [{ progressionId: tool, value: 'giant' }, { progressionId: language, value: 'draconic' }],
    }), OWNER)
    const effects = await deriveChoiceProficiencies(db, id)
    expect(effects.filter(e => e.type === 'language_proficiency').map(e => e.value).sort()).toEqual(['draconic', 'giant'])
    expect(effects.some(e => e.type === 'tool_proficiency')).toBe(false)
  })

  it('changer d\'historique retire ses choix, pas ceux de l\'espèce', async () => {
    const tool = await progressionOf('Maîtrises d\'historique', 'tool')
    const polyvalence = await progressionOf('Polyvalence', 'skill')
    const { id } = await createCharacter(db, input({
      speciesId: halfElfId,
      backgroundId: merchantId,
      choicePicks: [
        { progressionId: tool, value: 'Outils de navigateur' },
        { progressionId: polyvalence, value: 'stealth' },
        { progressionId: polyvalence, value: 'arcana' },
      ],
    }), OWNER)
    await deleteBackgroundChoicePicks(db, id)
    const effects = await deriveChoiceProficiencies(db, id)
    expect(effects.map(e => e.type)).toEqual(['skill_proficiency', 'skill_proficiency'])
  })
})

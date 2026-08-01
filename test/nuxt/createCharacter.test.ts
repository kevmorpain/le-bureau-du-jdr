import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'

// ─────────────────────────────────────────────────────────────────────────────
// Filet du volet 2 (5d) : la logique de création extraite (createCharacter) est testée
// contre libsql, SANS la barrière d'auth (débloqué par la DI du `db`). On vérifie :
//  - le round-trip d'une création valide (les bonnes lignes sont persistées via db.batch) ;
//  - la dérivation serveur des emplacements de sorts ;
//  - la VALIDATION serveur (sous-classe∈classe, manifestations∈groupe & nombre, pacte légitime,
//    sort d'arcanum légal) qui rejette les choix illégaux AVANT toute écriture.
//
// FK désactivées : on teste la logique de création, pas l'intégrité référentielle du schéma
// (couverte par migrations.test.ts) → évite de seeder tous les référentiels (users, ability_scores…).
// Env `nuxt` car l'util importe `~~/...`.
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const WARLOCK = 1
const FIGHTER = 2
const FIGHTER_SUBCLASS = 10 // appartient au Guerrier
const OWNER = 1 // users.id est un integer

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

function baseInput(over: Partial<Parameters<typeof createCharacter>[1]> = {}) {
  return createCharacterSchema.parse({
    name: 'Test',
    maxHp: 10,
    classId: FIGHTER,
    level: 1,
    speciesId: 1,
    abilityScores: { str: 15, dex: 14, con: 13 },
    classSkills: [],
    classSavingThrows: [],
    backgroundSkills: [],
    spellIds: [],
    ...over,
  })
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
  db = drizzle(client, { schema, casing: 'snake_case' })

  // Référentiels (cibles de FK — libsql applique les FK) : école de magie, propriétaire,
  // espèce (speciesId est notNull sur character_sheets), caractéristiques.
  await db.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'Testeur' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })),
  )

  // Classes
  await db.insert(schema.classes).values([
    { id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
  ])
  await db.insert(schema.subclasses).values({ id: FIGHTER_SUBCLASS, classId: FIGHTER, name: 'Champion' })

  // Features propriétaires + progressions de l'Occultiste (= contrat 5a → catalogue de validation)
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await db.insert(schema.features).values({ id: 100 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: 100 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }

  // Grants passifs (matérialisés d'office à la création)
  await db.insert(schema.features).values([
    { id: 200, name: 'Incantation occulte', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1 }, // passif, non tagué
    { id: 300, name: 'Second souffle', featureType: 'class_feature', classId: FIGHTER, levelRequired: 1 }, // passif Guerrier
  ])

  // 3 manifestations occultes (tag invocation) — l'une octroie un sort
  await db.insert(schema.features).values([
    { id: 401, name: 'Regard de deux esprits', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 402, name: 'Armure des ombres', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 403, name: 'Maître des masques', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
  ])
  // 401 octroie « Armure de mage » (spell_grant) → doit être matérialisé (source='invocation').
  // Sort DIFFÉRENT du familier du Pacte de la Chaîne, pour éviter la collision d'unicité
  // (character_spells est unique par (sheet, spell) : deux sources ne peuvent porter le même sort).
  const [eff] = await db.insert(schema.effects).values({ type: 'spell_grant', value: { level: 1, spellcastingAbility: 'cha', spellName: 'Armure de mage', countPerLongRest: 0 } }).returning()
  await db.insert(schema.featureEffects).values({ featureId: 401, effectId: eff.id })

  // Sorts : familier (pacte), sort octroyé par la manifestation, 2 sorts d'arcanum (niv 6 et 9)
  await db.insert(schema.spells).values([
    { id: 500, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 heure', schoolId: 1 },
    { id: 501, name: 'Armure de mage', level: 1, castingTime: '1 action', range: 0, duration: '8 heures', schoolId: 1 },
    { id: 600, name: 'Cercle de mort', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
    { id: 601, name: 'Portail', level: 9, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
  ])
  await db.insert(schema.spellClasses).values([{ spellId: 600, classId: WARLOCK }, { spellId: 601, classId: WARLOCK }])
}, 60000) // rejoue toute la chaîne de migrations + seed → au-delà du timeout de hook par défaut (10s)

// ── Round-trip : créations valides ─────────────────────────────────────────────

describe('createCharacter — round-trip Guerrier niveau 1', () => {
  it('persiste fiche, classe, feature passive, caracs, compétences ; pas d\'emplacement de sort', async () => {
    const { id } = await createCharacter(db, baseInput({
      classId: FIGHTER, level: 1,
      classSkills: ['athletics'], classSavingThrows: ['str'],
    }), OWNER)

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.ownerId).toBe(OWNER)
    expect(sheet.maxHp).toBe(10)

    const classes = await db.select().from(schema.characterClasses).where(eq(schema.characterClasses.characterSheetId, id))
    expect(classes).toHaveLength(1)
    expect(classes[0].classId).toBe(FIGHTER)
    expect(classes[0].isMain).toBe(true)

    const feats = await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, id))
    expect(feats.map((f: { featureId: number }) => f.featureId)).toContain(300) // Second souffle (passif)

    const skills = await db.select().from(schema.characterSkills).where(eq(schema.characterSkills.characterSheetId, id))
    expect(skills.map((s: { skillKey: string }) => s.skillKey).sort()).toEqual(['athletics', 'str_save'])

    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots).toHaveLength(0) // Guerrier = non-lanceur
  })
})

describe('createCharacter — round-trip Occultiste niveau 3 (pacte + manifestation)', () => {
  it('dérive les emplacements de pacte, persiste le pacte, la manifestation et son sort octroyé', async () => {
    const { id } = await createCharacter(db, baseInput({
      classId: WARLOCK, level: 3,
      pactBoon: 'chain',
      invocationIds: [401],
    }), OWNER)

    const [cc] = await db.select().from(schema.characterClasses).where(eq(schema.characterClasses.characterSheetId, id))
    expect(cc.pactBoon).toBe('chain')

    // Emplacements de pacte DÉRIVÉS serveur : niveau 3 → 2 emplacements de niveau 2
    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots).toHaveLength(1)
    expect(slots[0].slotType).toBe('pact_magic')
    expect(slots[0].slotLevel).toBe(2)
    expect(slots[0].total).toBe(2)

    const feats = await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, id))
    expect(feats.map((f: { featureId: number }) => f.featureId)).toContain(401) // manifestation choisie
    expect(feats.map((f: { featureId: number }) => f.featureId)).toContain(200) // passif warlock

    const spells = await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, id))
    const bySource = new Map(spells.map((s: { source: string | null, spellId: number }) => [s.source, s.spellId]))
    expect(bySource.get('pact_chain')).toBe(500) // familier (Pacte de la Chaîne)
    expect(bySource.get('invocation')).toBe(501) // « Armure de mage » octroyé par la manifestation 401
  })
})

// ── Validation serveur : rejets ────────────────────────────────────────────────

describe('createCharacter — validation serveur (rejette les choix illégaux)', () => {
  it('sous-classe n\'appartenant pas à la classe → 422', async () => {
    await expect(createCharacter(db, baseInput({ classId: WARLOCK, level: 3, subclassId: FIGHTER_SUBCLASS }), OWNER))
      .rejects.toThrow(CharacterValidationError)
  })

  it('manifestation inconnue / non taguée → rejet', async () => {
    await expect(createCharacter(db, baseInput({ classId: WARLOCK, level: 3, invocationIds: [999999] }), OWNER))
      .rejects.toThrow(/invocation/i)
  })

  it('trop de manifestations pour le niveau (3 pour un max de 2 au niveau 3) → rejet', async () => {
    await expect(createCharacter(db, baseInput({ classId: WARLOCK, level: 3, invocationIds: [401, 402, 403] }), OWNER))
      .rejects.toThrow(/manifestation/i)
  })

  it('faveur de pacte à un niveau trop bas (Occultiste 2) → rejet', async () => {
    await expect(createCharacter(db, baseInput({ classId: WARLOCK, level: 2, pactBoon: 'blade' }), OWNER))
      .rejects.toThrow(/pacte/i)
  })

  it('sort d\'arcanum illégal (niveau 9 alors que l\'arcanum de niveau 11 plafonne à 6) → rejet', async () => {
    await expect(createCharacter(db, baseInput({ classId: WARLOCK, level: 11, arcaneMysteriumSpellId: 601 }), OWNER))
      .rejects.toThrow(CharacterValidationError)
  })

  it('sort d\'arcanum légal (niveau 6 au niveau 11) → accepté', async () => {
    const { id } = await createCharacter(db, baseInput({ classId: WARLOCK, level: 11, arcaneMysteriumSpellId: 600 }), OWNER)
    const spells = await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, id))
    expect(spells.some((s: { spellId: number, source: string | null }) => s.spellId === 600 && s.source === 'arcanum_6')).toBe(true)
  })
})

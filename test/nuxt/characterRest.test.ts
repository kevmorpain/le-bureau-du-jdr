import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterRest } from '../../server/utils/characterRest'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'
import { replayMigrations } from '../fixtures/migrations'

// Repos testé contre libsql : recharge (features + emplacements) ET préservation de la dépendance
// d'ORDRE sur currentHp (repos long puis soin par dés de vie).

const WARLOCK = 1
const OWNER = 1
const RECHARGE_FEATURE = 210 // feature passive rechargeable (short_rest)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

function newWarlock(over: Record<string, unknown> = {}) {
  return createCharacterSchema.parse({
    name: 'Occ', hpBase: 24, classId: WARLOCK, level: 3, speciesId: 1, pactBoon: 'chain',
    abilityScores: { cha: 16 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    invocationIds: [401, 402], ...over,
  })
}

async function create() {
  const { id } = await createCharacter(db, newWarlock(), OWNER)
  return id
}

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' })
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await db.insert(schema.features).values({ id: 100 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: 100 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }
  // Feature passive RECHARGEABLE (repos court) → matérialisée d'office par createCharacter
  await db.insert(schema.features).values({ id: RECHARGE_FEATURE, name: 'Récup. arcanique', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1, rechargeType: 'short_rest' })
  await db.insert(schema.features).values([
    { id: 401, name: 'Manif A', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 402, name: 'Manif B', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
  ])
  await db.insert(schema.spells).values({ id: 500, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 h', schoolId: 1 })
}, 60000)

describe('characterRest — repos court', () => {
  it('recharge la feature (short_rest) et les emplacements de pacte', async () => {
    const id = await create()
    await db.update(schema.characterFeatures).set({ currentUses: 1 }).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, RECHARGE_FEATURE)))
    await db.update(schema.characterSpellSlots).set({ used: 2 }).where(eq(schema.characterSpellSlots.characterSheetId, id))

    await characterRest(db, id, { type: 'short', hitDiceSpent: [] })

    const [feat] = await db.select().from(schema.characterFeatures).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, RECHARGE_FEATURE)))
    expect(feat.currentUses).toBe(0)
    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots.every((s: { used: number }) => s.used === 0)).toBe(true)
  })
})

describe('characterRest — repos long', () => {
  it('restaure les PV au max et réinitialise les emplacements', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 5 }).where(eq(schema.characterSheets.id, id))
    await db.update(schema.characterSpellSlots).set({ used: 2 }).where(eq(schema.characterSpellSlots.characterSheetId, id))

    await characterRest(db, id, { type: 'long', hitDiceSpent: [] })

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.currentHp).toBe(24) // maxHp
    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots.every((s: { used: number }) => s.used === 0)).toBe(true)
  })

  it('rend la moitié des dés de vie dépensés (le seed écrit « 1d8 », la fiche « 8 »)', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHitDie: [{ die: '8', count: 0 }] }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'long', hitDiceSpent: [] })

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.currentHitDie).toEqual([{ die: '8', count: 2 }]) // niveau 3 → moitié arrondie au supérieur
  })

  it('PRÉSERVE la dépendance d\'ordre : long + dés de vie → min(currentHp lu + soin, maxHp), pas maxHp', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 5 }).where(eq(schema.characterSheets.id, id))

    // Repos long (mettrait currentHp=24) MAIS avec 3 PV de dés de vie → le soin écrase à min(5+3,24)=8.
    await characterRest(db, id, { type: 'long', hitDiceSpent: [{ die: 'd8', count: 1, healAmount: 3 }] })

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.currentHp).toBe(8) // comportement historique préservé (le soin par dés de vie l'emporte)
  })
})

// PV max dérivés (ADR D19) : le repos remet les PV au maximum EFFECTIF — Robuste compris, moitié à l'épuisement 4 —
// et non à la part stockée.
describe('characterRest — maximum effectif', () => {
  const TOUGH = 700
  const sheetOf = async (id: number) => (await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id)))[0]

  beforeAll(async () => {
    await db.insert(schema.features).values({ id: TOUGH, name: 'Robuste', featureType: 'feat', levelRequired: 1 })
    const [perLevel] = await db.insert(schema.effects).values({ type: 'hp_per_level', value: { amount: 2 } }).returning()
    await db.insert(schema.featureEffects).values({ featureId: TOUGH, effectId: perLevel.id })
  })

  const withTough = async () => {
    const id = await create()
    await db.insert(schema.characterFeatures).values({ characterSheetId: id, featureId: TOUGH, currentUses: 0 })
    return id
  }

  it('repos long : Robuste (+2 PV par niveau) compte dans le maximum rétabli', async () => {
    const id = await withTough()
    await db.update(schema.characterSheets).set({ currentHp: 3 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'long' })

    expect((await sheetOf(id)).currentHp).toBe(24 + 2 * 3)
  })

  it('repos long à l\'épuisement 5 : PV rétablis à la moitié du maximum, épuisement réduit à 4', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 1, exhaustionLevel: 5 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'long' })

    const row = await sheetOf(id)
    expect(row.exhaustionLevel).toBe(4)
    expect(row.currentHp).toBe(12) // épuisement 4 : la moitié de 24
  })

  it('repos long à l\'épuisement 4 : le maximum est celui de l\'épuisement 3, plein', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 1, exhaustionLevel: 4 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'long' })

    const row = await sheetOf(id)
    expect(row.exhaustionLevel).toBe(3)
    expect(row.currentHp).toBe(24)
  })

  it('sans avoir mangé ni bu, l\'épuisement ne baisse pas (AideDD, Conditions)', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 1, exhaustionLevel: 4 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'long', fedAndWatered: false })

    const row = await sheetOf(id)
    expect(row.exhaustionLevel).toBe(4)
    expect(row.currentHp).toBe(12)
  })

  it('l\'épuisement ne descend pas sous 0, et un repos long vide les PV temporaires', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ temporaryHp: 9 }).where(eq(schema.characterSheets.id, id))

    const res = await characterRest(db, id, { type: 'long' })

    expect(res.exhaustionLevel).toBe(0)
    expect((await sheetOf(id)).temporaryHp).toBe(0)
  })

  it('repos court : ni PV temporaires ni épuisement ne bougent', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ temporaryHp: 9, exhaustionLevel: 2 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'short' })

    const row = await sheetOf(id)
    expect(row.temporaryHp).toBe(9)
    expect(row.exhaustionLevel).toBe(2)
  })

  it('regagner des PV remet les jets contre la mort à zéro : repos long, ou soin par dés de vie', async () => {
    const dying = { currentHp: 0, deathSaveSuccesses: 2, deathSaveFailures: 2 }
    const long = await create()
    await db.update(schema.characterSheets).set(dying).where(eq(schema.characterSheets.id, long))
    await characterRest(db, long, { type: 'long' })
    expect(await sheetOf(long)).toMatchObject({ currentHp: 24, deathSaveSuccesses: 0, deathSaveFailures: 0 })

    const short = await create()
    await db.update(schema.characterSheets).set(dying).where(eq(schema.characterSheets.id, short))
    await characterRest(db, short, { type: 'short', hitDiceSpent: [{ die: 'd8', count: 1, healAmount: 5 }] })
    expect(await sheetOf(short)).toMatchObject({ currentHp: 5, deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('un repos court sans soin laisse les jets contre la mort', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 0, deathSaveSuccesses: 1, deathSaveFailures: 2 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'short' })

    expect(await sheetOf(id)).toMatchObject({ deathSaveSuccesses: 1, deathSaveFailures: 2 })
  })

  it('soin par dés de vie : plafonné au maximum effectif, Robuste compris', async () => {
    const id = await withTough()
    await db.update(schema.characterSheets).set({ currentHp: 28 }).where(eq(schema.characterSheets.id, id))

    await characterRest(db, id, { type: 'short', hitDiceSpent: [{ die: 'd8', count: 1, healAmount: 10 }] })

    expect((await sheetOf(id)).currentHp).toBe(30)
  })
})

describe('characterRest — recharge des objets', () => {
  const STAFF = 800
  const WAND = 801
  const entryOf = async (id: number, itemId: number) =>
    (await db.select().from(schema.characterInventory).where(and(eq(schema.characterInventory.characterSheetId, id), eq(schema.characterInventory.itemId, itemId))))[0]

  beforeAll(async () => {
    await db.insert(schema.items).values([
      { id: STAFF, name: 'Bâton', itemType: 'equipment', properties: { category: 'wondrous' }, maxUses: 10, rechargeType: 'dawn', rechargeDice: '1d6+4' },
      { id: WAND, name: 'Baguette', itemType: 'equipment', properties: { category: 'wondrous' }, maxUses: 3, rechargeType: 'dawn' },
    ])
  })

  const withItems = async (staffUsed: number) => {
    const id = await create()
    await db.insert(schema.characterInventory).values([
      { characterSheetId: id, itemId: STAFF, currentUses: staffUsed },
      { characterSheetId: id, itemId: WAND, currentUses: 3 },
    ])
    return id
  }

  it('à l\'aube : les dés rendent des charges (1d6+4), la recharge complète les rend toutes', async () => {
    const id = await withItems(10)

    const res = await characterRest(db, id, { type: 'dawn' }, () => 0.5) // 1d6 → 4, +4 = 8

    expect(res.rechargedItems).toEqual([{ inventoryId: (await entryOf(id, STAFF)).id, name: 'Bâton', rolled: 8 }])
    expect((await entryOf(id, STAFF)).currentUses).toBe(2)
    expect((await entryOf(id, WAND)).currentUses).toBe(0)
  })

  it('jamais plus de charges que dépensées', async () => {
    const id = await withItems(3)

    await characterRest(db, id, { type: 'dawn' }, () => 0.99) // 1d6 → 6, +4 = 10

    expect((await entryOf(id, STAFF)).currentUses).toBe(0)
  })

  it('un repos qui ne correspond pas au type de recharge ne touche pas l\'objet', async () => {
    const id = await withItems(10)

    const res = await characterRest(db, id, { type: 'long' })

    expect(res.rechargedItems).toEqual([])
    expect((await entryOf(id, STAFF)).currentUses).toBe(10)
  })
})

// Ressources de classe (lot 11) : regains partiels et élargissements de recharge portés par des effets, fin de ce qui dure
// une minute, emplacements créés par les points de sorcellerie.
describe('characterRest — ressources de classe', () => {
  const POOL = 900
  const RESTORATION = 901
  const INSPIRATION = 902
  const SOURCE = 903
  const RAGE = 904

  const featureOf = async (id: number, featureId: number) =>
    (await db.select().from(schema.characterFeatures).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, featureId))))[0]

  beforeAll(async () => {
    await db.insert(schema.features).values([
      { id: POOL, name: 'Réserve', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1, rechargeType: 'long_rest', meta: { resource: 'sorcery_points' } },
      { id: RESTORATION, name: 'Restauration', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1 },
      { id: INSPIRATION, name: 'Inspiration', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1, rechargeType: 'long_rest', meta: { resource: 'bardic_inspiration' } },
      { id: SOURCE, name: 'Source', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1 },
      { id: RAGE, name: 'Rage', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1, rechargeType: 'long_rest', meta: { resource: 'rage' } },
    ])
    const [regain4] = await db.insert(schema.effects).values({ type: 'resource_regain', value: { resource: 'sorcery_points', amount: 4, on: 'short_rest' } }).returning()
    const [refill] = await db.insert(schema.effects).values({ type: 'resource_regain', value: { resource: 'bardic_inspiration', amount: 'all', on: 'short_rest' } }).returning()
    await db.insert(schema.featureEffects).values([
      { featureId: RESTORATION, effectId: regain4.id },
      { featureId: SOURCE, effectId: refill.id },
    ])
  })

  const withResources = async () => {
    // createCharacter matérialise déjà ces capacités de classe : on règle leur état.
    const id = await create()
    const set = (featureId: number, values: { currentUses: number, active?: boolean }) =>
      db.update(schema.characterFeatures).set(values).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, featureId)))
    await set(POOL, { currentUses: 7 })
    await set(INSPIRATION, { currentUses: 3 })
    await set(RAGE, { currentUses: 2, active: true })
    return id
  }

  it('repos court : le regain de 4 points est partiel, jamais une remise à zéro', async () => {
    const id = await withResources()
    await characterRest(db, id, { type: 'short' })
    expect((await featureOf(id, POOL)).currentUses).toBe(3)
  })

  it('le regain ne descend pas sous zéro dépensé', async () => {
    const id = await withResources()
    await db.update(schema.characterFeatures).set({ currentUses: 2 }).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, POOL)))
    await characterRest(db, id, { type: 'short' })
    expect((await featureOf(id, POOL)).currentUses).toBe(0)
  })

  it('repos court : une réserve élargie au repos court par un effet (Source d\'inspiration) revient entièrement', async () => {
    const id = await withResources()
    await characterRest(db, id, { type: 'short' })
    expect((await featureOf(id, INSPIRATION)).currentUses).toBe(0)
    expect((await featureOf(id, RAGE)).currentUses).toBe(2)
  })

  it('repos long : toutes les réserves reviennent', async () => {
    const id = await withResources()
    await characterRest(db, id, { type: 'long' })
    for (const featureId of [POOL, INSPIRATION, RAGE]) expect((await featureOf(id, featureId)).currentUses).toBe(0)
  })

  it('un repos, court ou long, met fin à la rage ; l\'aube non', async () => {
    const dawn = await withResources()
    await characterRest(db, dawn, { type: 'dawn' })
    expect((await featureOf(dawn, RAGE)).active).toBe(true)

    for (const type of ['short', 'long'] as const) {
      const id = await withResources()
      await characterRest(db, id, { type })
      expect((await featureOf(id, RAGE)).active).toBe(false)
    }
  })

  it('repos long : les emplacements créés disparaissent ; repos court : ils restent', async () => {
    const id = await create()
    await db.insert(schema.characterSpellSlots).values({ characterSheetId: id, slotLevel: 2, slotType: 'spellcasting', total: 3, used: 1, created: 1 })

    await characterRest(db, id, { type: 'short' })
    const afterShort = (await db.select().from(schema.characterSpellSlots).where(and(eq(schema.characterSpellSlots.characterSheetId, id), eq(schema.characterSpellSlots.slotType, 'spellcasting'))))[0]
    expect(afterShort).toMatchObject({ used: 1, created: 1 })

    await characterRest(db, id, { type: 'long' })
    const afterLong = (await db.select().from(schema.characterSpellSlots).where(and(eq(schema.characterSpellSlots.characterSheetId, id), eq(schema.characterSpellSlots.slotType, 'spellcasting'))))[0]
    expect(afterLong).toMatchObject({ used: 0, created: 0, total: 3 })
  })
})

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { loadCharacterSheet, loadSheetRelations, sheetHitPointsOf } from '../../server/utils/characterSheetLoader'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES, FEATURE } from './fixtures/goldenMaster'

// PV max dérivés (ADR D19) : la fiche ne stocke que la part « dés » ; CON × niveau et bonus par niveau (Robuste)
// s'ajoutent à la lecture. Le serveur (repos, level-up) et la fiche appliquent la MÊME règle, sur le même payload.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let sheetId: number

// Guerrier 4 (d10) : CON 14 + ASI +2 = 16 (mod +3), Robuste (+2 PV/niveau), 30 PV de dés.
// Maximum attendu : 30 + 3 × 4 + 2 × 4 = 50.
const EXPECTED_MAX = 50

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
  const [perLevel] = await db.insert(schema.effects).values({ type: 'hp_per_level', value: { amount: 2 } }).returning()
  await db.insert(schema.featureEffects).values({ featureId: FEATURE.featTough, effectId: perLevel.id })

  ;({ id: sheetId } = await createCharacter(db, createCharacterSchema.parse({
    name: 'Brom', hpBase: 30, classId: CLASS.fighter, level: 4, speciesId: SPECIES.human,
    abilityScores: { str: 15, dex: 12, con: 14 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    asiBonuses: [{ classLevel: 4, ability: 'con', amount: 2 }],
    bonusFeatureId: FEATURE.featTough,
  }), OWNER))

  registerEndpoint(`/api/character_sheets/${sheetId}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${sheetId}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${sheetId}/spells`, () => [])
  registerEndpoint('/api/backgrounds', () => [])
}, 60000)

const sheet = () => db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, sheetId)).then((r: unknown[]) => r[0] as { hpBase: number, currentHp: number })

describe('PV max dérivés — création', () => {
  it('stocke la part des dés ; les PV courants partent du maximum dérivé', async () => {
    const row = await sheet()
    expect(row.hpBase).toBe(30)
    expect(row.currentHp).toBe(EXPECTED_MAX)
  })

  it('refuse des PV de base hors de ce que permettent les dés (d10 niveau 4 : 4 à 40)', async () => {
    const create = (hpBase: number) => createCharacter(db, createCharacterSchema.parse({
      name: 'X', hpBase, classId: CLASS.fighter, level: 4, speciesId: SPECIES.human,
      abilityScores: {}, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    }), OWNER)
    await expect(create(41)).rejects.toThrow(/PV de base/)
    await expect(create(3)).rejects.toThrow(/PV de base/)
  })
})

describe('PV max dérivés — équivalence serveur / fiche', () => {
  it('le serveur et la fiche lisent le même maximum sur le même payload', async () => {
    const payload = clone(await loadCharacterSheet(db, sheetId))
    expect(sheetHitPointsOf(payload).maxHp).toBe(EXPECTED_MAX)

    let s!: ReturnType<typeof useCharacterSheet>
    await mountSuspended(defineComponent({
      setup() {
        s = useCharacterSheet(ref(payload))
        return () => h('div')
      },
    }))
    await vi.waitFor(() => expect(s.fullMaxHp.value).toBe(EXPECTED_MAX))
    expect(s.hpPerLevelBonus.value).toBe(2)
    expect(s.effectiveMaxHp.value).toBe(EXPECTED_MAX)
  })

  it('épuisement 4 : moitié du maximum, côté serveur comme côté fiche', async () => {
    const payload = clone(await loadCharacterSheet(db, sheetId))
    payload.exhaustionLevel = 4
    expect(sheetHitPointsOf(payload).maxHp).toBe(EXPECTED_MAX / 2)

    let s!: ReturnType<typeof useCharacterSheet>
    await mountSuspended(defineComponent({
      setup() {
        s = useCharacterSheet(ref(payload))
        return () => h('div')
      },
    }))
    await vi.waitFor(() => expect(s.effectiveMaxHp.value).toBe(EXPECTED_MAX / 2))
    expect(s.fullMaxHp.value).toBe(EXPECTED_MAX)
  })

  it('un objet équipé qui fixe la CON déplace le maximum (CON 19 : mod +4)', async () => {
    const payload = clone(await loadCharacterSheet(db, sheetId))
    payload.inventory = [{
      inventory: { equipped: true, attuned: true },
      item: { name: 'Amulette de santé', requiresAttunement: true, effects: [{ type: 'ability_score_set', value: { ability: 'con', score: 19 } }] },
    }]
    expect(sheetHitPointsOf(payload).maxHp).toBe(30 + 4 * 4 + 2 * 4)
    expect(sheetHitPointsOf(payload).naturalConMod).toBe(3)
  })

  it('un effet temporaire actif de CON joue de même, éteint il ne joue pas', async () => {
    const payload = clone(await loadCharacterSheet(db, sheetId))
    const potion = { id: 1, name: 'Potion', active: true, effects: [{ type: 'ability_score_set', value: { ability: 'con', score: 21 } }] }
    payload.temporaryEffects = [potion]
    expect(sheetHitPointsOf(payload).maxHp).toBe(30 + 5 * 4 + 2 * 4)
    payload.temporaryEffects = [{ ...potion, active: false }]
    expect(sheetHitPointsOf(payload).maxHp).toBe(EXPECTED_MAX)
  })
})

describe('PV max dérivés — level-up', () => {
  const levelUp = (over: Record<string, unknown>) => characterLevelUp(db, sheetId, levelUpSchema.parse({ classId: CLASS.fighter, isMulticlass: false, ...over }))

  it('le serveur ajoute le dé à la part stockée ; le maximum gagne dé + CON + Robuste', async () => {
    const before = await sheet()
    const { hpGained } = await levelUp({ hpDie: 6 })
    expect(hpGained).toBe(6)
    const after = await sheet()
    expect(after.hpBase).toBe(before.hpBase + 6)
    expect(sheetHitPointsOf(await loadSheetRelations(db, sheetId)).maxHp).toBe(EXPECTED_MAX + 6 + 3 + 2)
  })

  it('refuse un dé qui dépasse celui de la classe (d10)', async () => {
    const before = await sheet()
    await expect(levelUp({ hpDie: 11 })).rejects.toThrow(/dépasse le d10/)
    expect((await sheet()).hpBase).toBe(before.hpBase)
  })

  it('minimum de 1 PV par niveau (AideDD) : un dé de 1 avec CON −5 rapporte tout de même 1 PV de maximum', async () => {
    const [weak] = await db.insert(schema.characterSheets).values({ name: 'Frêle', speciesId: SPECIES.human, hpBase: 6 }).returning()
    await db.insert(schema.characterClasses).values({ characterSheetId: weak.id, classId: CLASS.fighter, level: 1, isMain: true })
    await db.insert(schema.characterAbilityScores).values({ characterSheetId: weak.id, abilityId: 'con', value: 1 })
    await characterLevelUp(db, weak.id, levelUpSchema.parse({ classId: CLASS.fighter, isMulticlass: false, hpDie: 1 }))
    const [row] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, weak.id))
    // CON 1 : mod −5. Le dé de 1 est relevé à 6 pour que dé + CON fasse 1.
    expect(row.hpBase).toBe(12)
    expect(sheetHitPointsOf(await loadSheetRelations(db, weak.id)).maxHp).toBe(2)
  })
})

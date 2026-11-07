import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { schema } from '../../server/utils/db'
import { CharacterValidationError, createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { bootstrapGoldenDb, CLASS, ITEM, OWNER, SPECIES } from './fixtures/goldenMaster'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const create = (over: Record<string, unknown>) => createCharacter(db, createCharacterSchema.parse({
  name: 'X', hpBase: 10, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
  abilityScores: {}, classSkills: [], spellIds: [],
  ...over,
}), OWNER)

const inventoryOf = (sheetId: number) =>
  db.select().from(schema.characterInventory).where(eq(schema.characterInventory.characterSheetId, sheetId))

describe('inventaire de départ', () => {
  it('range chaque objet avec sa quantité', async () => {
    const { id } = await create({ inventory: [{ itemId: ITEM.dagger, quantity: 2 }, { itemId: ITEM.longsword, quantity: 1 }] })
    const rows = await inventoryOf(id)
    expect(rows.map((r: { itemId: number, quantity: number }) => [r.itemId, r.quantity]).sort()).toEqual([[ITEM.longsword, 1], [ITEM.dagger, 2]].sort())
  })

  it('refuse un objet absent du catalogue plutôt que de le perdre', async () => {
    await expect(create({ inventory: [{ itemId: 999999, quantity: 1 }] })).rejects.toThrow(CharacterValidationError)
  })

  it('refuse un objet retiré du catalogue', async () => {
    await db.update(schema.items).set({ deletedAt: new Date().toISOString() }).where(eq(schema.items.id, ITEM.dagger))
    await expect(create({ inventory: [{ itemId: ITEM.dagger, quantity: 1 }] })).rejects.toThrow(CharacterValidationError)
    await db.update(schema.items).set({ deletedAt: null }).where(eq(schema.items.id, ITEM.dagger))
  })

  it('refuse une quantité nulle ou démesurée', () => {
    expect(() => createCharacterSchema.parse({ name: 'X', hpBase: 10, classId: 1, level: 1, abilityScores: {}, classSkills: [], spellIds: [], inventory: [{ itemId: 1, quantity: 0 }] })).toThrow()
    expect(() => createCharacterSchema.parse({ name: 'X', hpBase: 10, classId: 1, level: 1, abilityScores: {}, classSkills: [], spellIds: [], inventory: [{ itemId: 1, quantity: 5000 }] })).toThrow()
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { bootstrapGoldenDb, serializeCharacter, OWNER, CLASS, SPECIES } from './fixtures/goldenMaster'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const create = (classId: number, level: number, classSkills: string[]) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'X', maxHp: 10 * level, classId, level, speciesId: SPECIES.human,
    abilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 14 },
    classSkills, classSavingThrows: [], backgroundSkills: [], spellIds: [],
  }), OWNER)

const levelUp = (id: number, over: Record<string, unknown>) => characterLevelUp(db, id, levelUpSchema.parse({
  hpGained: 5, ...over,
}))

describe('level-up — `isMulticlass` confronté à l\'état de la fiche', () => {
  it('Roublard 5 + isMulticlass sur le Roublard → rejet, rien d\'écrit (ni niveau remis à 1, ni PV, ni dé de vie)', async () => {
    const { id } = await create(CLASS.rogue, 5, ['stealth', 'perception'])
    const before = await serializeCharacter(db, id)

    await expect(levelUp(id, { classId: CLASS.rogue, isMulticlass: true })).rejects.toThrow(/déjà au niveau 5/)

    expect(await serializeCharacter(db, id)).toEqual(before)
  })

  it('multiclassage rejoué (onglet périmé) : le 2ᵉ envoi est rejeté au lieu de monter l\'Occultiste 1 → 2', async () => {
    const { id } = await create(CLASS.fighter, 3, ['athletics', 'acrobatics'])
    await levelUp(id, { classId: CLASS.warlock, isMulticlass: true })
    const afterFirst = await serializeCharacter(db, id)

    await expect(levelUp(id, { classId: CLASS.warlock, isMulticlass: true })).rejects.toThrow(/déjà au niveau 1/)

    expect(await serializeCharacter(db, id)).toEqual(afterFirst)
  })

  it('classe absente de la fiche sans isMulticlass → rejet, rien d\'écrit', async () => {
    const { id } = await create(CLASS.fighter, 3, ['athletics', 'acrobatics'])
    const before = await serializeCharacter(db, id)

    await expect(levelUp(id, { classId: CLASS.warlock, isMulticlass: false })).rejects.toThrow(/n'est pas sur la fiche/)

    expect(await serializeCharacter(db, id)).toEqual(before)
  })

  it('flag cohérent : classe possédée → niveau + 1, nouvelle classe → niveau 1', async () => {
    const { id } = await create(CLASS.rogue, 5, ['stealth', 'perception'])

    expect((await levelUp(id, { classId: CLASS.rogue, isMulticlass: false })).newLevel).toBe(6)
    expect((await levelUp(id, { classId: CLASS.fighter, isMulticlass: true })).newLevel).toBe(1)
  })
})

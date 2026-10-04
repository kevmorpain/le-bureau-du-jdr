import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { loadCharacterSheet } from '../../server/utils/characterSheetLoader'
import { readAccountPreferences, writeAccountPreferences } from '../../server/utils/accountPreferences'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES } from './fixtures/goldenMaster'

// Préférences (D18, migration 0126) : une colonne JSON nullable sur la fiche et sur le compte. NULL veut dire « hérite » ;
// le GET de la fiche expose les défauts du compte pour que le client résolve `fiche ?? compte ?? défaut`.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let sheetId: number

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
  ;({ id: sheetId } = await createCharacter(db, createCharacterSchema.parse({
    name: 'Brom', hpBase: 30, classId: CLASS.fighter, level: 4, speciesId: SPECIES.human,
    abilityScores: {}, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  }), OWNER))
}, 60000)

const sheetRow = () => db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, sheetId)).then((r: unknown[]) => r[0] as { preferences: unknown })

describe('préférences — colonnes', () => {
  it('une fiche et un compte existants sont à NULL : ils héritent sans backfill', async () => {
    expect((await sheetRow()).preferences).toBeNull()
    expect(await readAccountPreferences(db, OWNER)).toBeNull()
  })

  it('le GET de la fiche expose les défauts du propriétaire, et seulement id, nom et préférences', async () => {
    await writeAccountPreferences(db, OWNER, { diceRolls: false })
    const loaded = await loadCharacterSheet(db, sheetId)
    expect(loaded!.owner).toEqual({ id: OWNER, name: 'Testeur', preferences: { diceRolls: false } })
    expect(loaded!.preferences).toBeNull()
  })

  it('la préférence de la fiche s\'écrit en JSON et se relit telle quelle', async () => {
    await db.update(schema.characterSheets).set({ preferences: { diceRolls: true } }).where(eq(schema.characterSheets.id, sheetId))
    expect((await loadCharacterSheet(db, sheetId))!.preferences).toEqual({ diceRolls: true })
  })
})

describe('défauts du compte', () => {
  it('écrit et relit les réglages posés', async () => {
    expect(await writeAccountPreferences(db, OWNER, { diceRolls: true })).toEqual({ diceRolls: true })
    expect(await readAccountPreferences(db, OWNER)).toEqual({ diceRolls: true })
  })

  it('aucun réglage posé : NULL plutôt qu\'un objet vide', async () => {
    expect(await writeAccountPreferences(db, OWNER, {})).toBeNull()
    expect(await readAccountPreferences(db, OWNER)).toBeNull()
  })

  it('un compte inconnu n\'a aucun défaut', async () => {
    expect(await readAccountPreferences(db, 9999)).toBeNull()
  })
})

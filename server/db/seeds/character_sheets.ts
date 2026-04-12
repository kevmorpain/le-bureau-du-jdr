import { db, schema } from 'hub:db'
import { characterSheets } from './data/character_sheets'

export default async function seed() {
  for (const { classes, abilityScores, ...sheetData } of characterSheets) {
    const character = await db
      .insert(schema.characterSheets)
      .values(sheetData)
      .returning()
      .get()

    if (classes?.length) {
      await db.insert(schema.characterClasses).values(
        classes.map(cls => ({ ...cls, characterSheetId: character.id })),
      )
    }

    if (abilityScores?.length) {
      await db.insert(schema.characterAbilityScores).values(
        abilityScores.map(abs => ({ ...abs, characterSheetId: character.id })),
      )
    }
  }
}

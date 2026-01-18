import { db, schema } from 'hub:db'

interface ClassInput {
  classId: number
  level: number
  isMain: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<InsertCharacterSheet> & { classes?: ClassInput[] }>(event)

  // Separate classes from character sheet data
  const { classes, ...characterSheetData } = body

  // Insert character sheet
  const characterSheet = await db
    .insert(schema.characterSheets)
    .values(characterSheetData)
    .returning()
    .get()

  // Handle character classes if provided
  if (classes !== undefined && classes.length > 0) {
    await db
      .insert(schema.characterClasses)
      .values(
        classes.map(cls => ({
          characterSheetId: characterSheet.id,
          classId: cls.classId,
          level: cls.level,
          isMain: cls.isMain,
        })),
      )
  }

  return characterSheet
})

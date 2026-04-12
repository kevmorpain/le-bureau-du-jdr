import { db, schema } from 'hub:db'

interface ClassInput {
  classId: number
  level: number
  isMain: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<InsertCharacterSheet & { classes?: ClassInput[] }>(event)
  const { classes, ...characterSheetData } = body

  const characterSheet = await db.transaction(async (tx) => {
    const sheet = await tx
      .insert(schema.characterSheets)
      .values(characterSheetData)
      .returning()
      .get()

    if (classes?.length) {
      await tx
        .insert(schema.characterClasses)
        .values(classes.map(cls => ({
          characterSheetId: sheet.id,
          classId: cls.classId,
          level: cls.level,
          isMain: cls.isMain,
        })))
    }

    return sheet
  })

  setResponseStatus(event, 201)
  return characterSheet
})

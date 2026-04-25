import { db, schema } from 'hub:db'
import { createCharacterSheetSchema } from '~~/shared/utils/character_sheet'

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, createCharacterSheetSchema.safeParse)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const { classes, ...characterSheetData } = result.data

  try {
    const sheet = await db
      .insert(schema.characterSheets)
      .values(characterSheetData as InsertCharacterSheet)
      .returning()
      .get()

    if (classes?.length) {
      await db
        .insert(schema.characterClasses)
        .values(classes.map(cls => ({
          characterSheetId: sheet.id,
          classId: cls.classId,
          level: cls.level,
          isMain: cls.isMain,
        })))
    }

    setResponseStatus(event, 201)
    return sheet
  } catch (e) {
    const cause = e instanceof Error ? (e.cause as Error | undefined) : undefined
    const message = e instanceof Error ? e.message : ''
    const causeMessage = cause?.message ?? ''
    if (message.includes('FOREIGN KEY') || causeMessage.includes('FOREIGN KEY')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid speciesId or classId' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
})

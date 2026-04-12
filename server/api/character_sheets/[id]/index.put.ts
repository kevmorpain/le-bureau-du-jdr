import { db, schema } from 'hub:db'
import { sql, eq, and, notInArray } from 'drizzle-orm'
import { updateCharacterSheetSchema } from '~~/shared/utils/character_sheet'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  const result = await readValidatedBody(event, updateCharacterSheetSchema.safeParse)

  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const { classes, ...fields } = result.data
  const updates = Object.fromEntries(
    Object.entries(fields).filter(([_, v]) => v !== undefined),
  )

  try {
    const updated = await db.transaction(async (tx) => {
      const sheets = await tx
        .update(schema.characterSheets)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(schema.characterSheets.id, characterSheetId))
        .returning()

      if (classes?.length) {
        await tx
          .insert(schema.characterClasses)
          .values(classes.map(cls => ({
            characterSheetId,
            classId: cls.classId,
            level: cls.level,
            isMain: cls.isMain,
          })))
          .onConflictDoUpdate({
            target: [schema.characterClasses.characterSheetId, schema.characterClasses.classId],
            set: {
              level: sql`excluded.level`,
              isMain: sql`excluded.is_main`,
            },
          })

        await tx
          .delete(schema.characterClasses)
          .where(
            and(
              eq(schema.characterClasses.characterSheetId, characterSheetId),
              notInArray(schema.characterClasses.classId, classes.map(cls => cls.classId)),
            ),
          )
      }

      return sheets
    })

    return updated
  } catch (e) {
    const message = e instanceof Error ? e.message : ''
    if (message.includes('FOREIGN KEY')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid speciesId or classId' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Database error' })
  }
})

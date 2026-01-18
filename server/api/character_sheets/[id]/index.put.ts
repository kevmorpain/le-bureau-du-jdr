import { db, schema } from 'hub:db'
import { sql, eq, and, notInArray } from 'drizzle-orm'

interface ClassUpdate {
  classId: number
  level: number
  isMain: boolean
}

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const body = await readBody<Partial<CharacterSheet> & { classes?: ClassUpdate[] }>(event)
  const characterSheetId = Number(id)

  // Separate classes from other updates
  const { classes, ...otherUpdates } = body
  const updates = Object.fromEntries(
    Object.entries(otherUpdates).filter(([_, v]) => v !== undefined),
  )

  // Update character sheet properties
  const result = await db
    .update(schema.characterSheets)
    .set(updates)
    .where(eq(schema.characterSheets.id, characterSheetId))
    .returning()

  // Handle character classes if provided
  if (classes !== undefined && classes.length > 0) {
    await db
      .insert(schema.characterClasses)
      .values(
        classes.map(cls => ({
          characterSheetId,
          classId: cls.classId,
          level: cls.level,
          isMain: cls.isMain,
        })),
      )
      .onConflictDoUpdate({
        target: [schema.characterClasses.characterSheetId, schema.characterClasses.classId],
        set: {
          level: sql`excluded.level`,
          isMain: sql`excluded.is_main`,
        },
      })

    // Delete character classes that are not in the input
    const inputClassIds = classes.map(cls => cls.classId)
    await db
      .delete(schema.characterClasses)
      .where(
        and(
          eq(schema.characterClasses.characterSheetId, characterSheetId),
          notInArray(schema.characterClasses.classId, inputClassIds),
        ),
      )
  }

  return result
})

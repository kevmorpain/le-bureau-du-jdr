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

  const { classes, ...otherUpdates } = body
  const updates = Object.fromEntries(
    Object.entries(otherUpdates).filter(([_, v]) => v !== undefined),
  )

  const result = await db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.characterSheets)
      .set(updates)
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

      const inputClassIds = classes.map(cls => cls.classId)
      await tx
        .delete(schema.characterClasses)
        .where(
          and(
            eq(schema.characterClasses.characterSheetId, characterSheetId),
            notInArray(schema.characterClasses.classId, inputClassIds),
          ),
        )
    }

    return updated
  })

  return result
})

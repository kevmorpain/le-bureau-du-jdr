import { db, schema } from 'hub:db'
import { isNull, or, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { characterSheetId } = getQuery(event)
  const charId = characterSheetId ? Number(characterSheetId) : null

  const rows = await db
    .select()
    .from(schema.backgrounds)
    .where(
      charId
        ? or(isNull(schema.backgrounds.characterSheetId), eq(schema.backgrounds.characterSheetId, charId))
        : isNull(schema.backgrounds.characterSheetId),
    )
    .orderBy(schema.backgrounds.name)

  return rows
})

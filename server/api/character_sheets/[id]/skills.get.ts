import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const sheet = await db.query.characterSheets.findFirst({
    where: eq(schema.characterSheets.id, Number(id)),
    columns: { id: true },
  })
  if (!sheet) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })

  return await db
    .select()
    .from(schema.characterSkills)
    .where(eq(schema.characterSkills.characterSheetId, Number(id)))
    .orderBy(schema.characterSkills.skillKey, schema.characterSkills.source)
})

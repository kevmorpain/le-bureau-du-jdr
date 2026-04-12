import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db
    .select()
    .from(schema.characterSkills)
    .where(eq(schema.characterSkills.characterSheetId, Number(id)))
    .orderBy(schema.characterSkills.skillKey, schema.characterSkills.source)
})

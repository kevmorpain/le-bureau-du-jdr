import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db.query.characterProficiencyOverrides.findMany({
    where: eq(schema.characterProficiencyOverrides.characterSheetId, Number(id)),
  })
})

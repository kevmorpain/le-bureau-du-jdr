import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db
    .query
    .characterSpells
    .findMany({
      where: eq(schema.characterSpells.characterSheetId, Number(id)),
      with: { spell: { with: { school: true } } },
    })
})

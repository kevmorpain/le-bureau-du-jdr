import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  return await db.query.characterInventory.findMany({
    where: eq(schema.characterInventory.characterSheetId, Number(id)),
    with: { item: true },
    orderBy: (inv, { asc }) => [asc(inv.id)],
  })
})

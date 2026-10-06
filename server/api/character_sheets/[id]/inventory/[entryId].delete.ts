import { db, schema } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { id, entryId } = getRouterParams(event)

  if (!id || !entryId) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameters are required' })
  }

  await db
    .delete(schema.characterInventory)
    .where(
      and(
        eq(schema.characterInventory.id, Number(entryId)),
        eq(schema.characterInventory.characterSheetId, Number(id)),
      ),
    )

  await touchCharacterSheet(event, Number(id))
  return { success: true }
})

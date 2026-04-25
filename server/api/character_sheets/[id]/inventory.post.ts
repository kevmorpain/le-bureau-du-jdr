import { db, schema } from 'hub:db'
import { createInventoryEntrySchema } from '~~/shared/utils/item'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const body = await readValidatedBody(event, createInventoryEntrySchema.parse)

  const inserted = await db
    .insert(schema.characterInventory)
    .values({
      characterSheetId: Number(id),
      itemId: body.itemId,
      quantity: body.quantity,
      equipped: body.equipped,
      magicBonus: body.magicBonus,
      magicEffects: body.magicEffects ?? null,
      notes: body.notes ?? null,
    })
    .returning()

  const entry = inserted[0]
  if (!entry) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create inventory entry' })
  }

  setResponseStatus(event, 201)
  return await db.query.characterInventory.findFirst({
    where: eq(schema.characterInventory.id, entry.id),
    with: { item: true },
  })
})

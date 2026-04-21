import { db, schema } from 'hub:db'
import { updateInventoryEntrySchema } from '~~/shared/utils/item'

export default defineEventHandler(async (event) => {
  const { id, entryId } = getRouterParams(event)

  if (!id || !entryId) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameters are required' })
  }

  const body = await readValidatedBody(event, updateInventoryEntrySchema.parse)

  const updateValues: Record<string, unknown> = {}
  if (body.quantity !== undefined) updateValues.quantity = body.quantity
  if (body.equipped !== undefined) updateValues.equipped = body.equipped
  if (body.magicBonus !== undefined) updateValues.magicBonus = body.magicBonus
  if (body.magicEffects !== undefined) updateValues.magicEffects = body.magicEffects
  if (body.notes !== undefined) updateValues.notes = body.notes

  if (Object.keys(updateValues).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  await db
    .update(schema.characterInventory)
    .set(updateValues as Partial<typeof schema.characterInventory.$inferInsert>)
    .where(
      and(
        eq(schema.characterInventory.id, Number(entryId)),
        eq(schema.characterInventory.characterSheetId, Number(id)),
      ),
    )

  const updated = await db.query.characterInventory.findFirst({
    where: and(
      eq(schema.characterInventory.id, Number(entryId)),
      eq(schema.characterInventory.characterSheetId, Number(id)),
    ),
    with: { item: true },
  })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Inventory entry not found' })
  }

  return updated
})

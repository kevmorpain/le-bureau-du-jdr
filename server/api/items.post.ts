import { db, schema } from 'hub:db'
import { createItemSchema } from '~~/shared/utils/item'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createItemSchema.parse)

  const [item] = await db
    .insert(schema.items)
    .values({
      name: body.name,
      itemType: body.itemType,
      properties: body.properties as typeof schema.items.$inferInsert['properties'],
      description: body.description ?? null,
      isCustom: true,
    })
    .returning()

  return item
})

import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const charId = Number(id)

  const sheet = await db
    .select({ id: schema.characterSheets.id })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, charId))
    .get()
  if (!sheet) throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })

  // db.select() with source schema = fresh column definitions (incl. recently
  // added columns that hub:db's cached schema doesn't know about).
  const rows = await db
    .select()
    .from(schema.characterInventory)
    .leftJoin(schema.items, eq(schema.characterInventory.itemId, schema.items.id))
    .where(eq(schema.characterInventory.characterSheetId, charId))
    .orderBy(asc(schema.characterInventory.id))

  return rows.map(r => ({
    ...r.character_inventory,
    item: r.items,
  }))
})

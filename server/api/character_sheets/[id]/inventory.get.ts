import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { asc, eq, inArray } from 'drizzle-orm'

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

  // Charge les effets de chaque item (jointure item_effects → effects).
  // On le fait en lookup séparé pour éviter le N+1 et parce que hub:db ne
  // connaît pas item_effects (ajoutée en 0053).
  const itemIds = rows.map(r => r.items?.id).filter((i): i is number => i !== undefined)
  const itemEffectsRows = itemIds.length
    ? await db
        .select({ itemId: schema.itemEffects.itemId, effect: schema.effects })
        .from(schema.itemEffects)
        .innerJoin(schema.effects, eq(schema.itemEffects.effectId, schema.effects.id))
        .where(inArray(schema.itemEffects.itemId, itemIds))
    : []

  const effectsByItem = new Map<number, typeof schema.effects.$inferSelect[]>()
  for (const link of itemEffectsRows) {
    if (!effectsByItem.has(link.itemId)) effectsByItem.set(link.itemId, [])
    effectsByItem.get(link.itemId)!.push(link.effect)
  }

  return rows.map(r => ({
    ...r.character_inventory,
    item: r.items
      ? { ...r.items, effects: effectsByItem.get(r.items.id) ?? [] }
      : null,
  }))
})

import { db, schema } from 'hub:db'
import { itemsData } from './data/items'

export default async function seed() {
  let inserted = 0

  for (const item of itemsData) {
    const row = await db
      .insert(schema.items)
      .values({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        properties: item.properties,
        description: item.description ?? null,
        isCustom: false,
      })
      .onConflictDoNothing()
      .returning()
      .get()
    if (row) inserted++
  }

  return { inserted, skipped: itemsData.length - inserted }
}

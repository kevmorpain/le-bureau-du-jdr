import { db, schema } from 'hub:db'
import { itemsData } from './data/items'

export default async function seed() {
  for (const item of itemsData) {
    await db
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
  }
}

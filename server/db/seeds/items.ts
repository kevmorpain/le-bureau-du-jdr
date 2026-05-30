import { db, schema } from 'hub:db'
import { itemsData } from './data/items'

export default async function seed() {
  // Pré-charge les ids existants (1 requête) pour ne tenter l'insert que des
  // items manquants — évite 89 INSERT à chaque run (limite de requêtes D1).
  const existing = await db.select({ id: schema.items.id }).from(schema.items)
  const existingIds = new Set(existing.map(i => i.id))

  let inserted = 0

  for (const item of itemsData) {
    if (existingIds.has(item.id)) continue
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
    inserted++
  }

  return { inserted, skipped: itemsData.length - inserted }
}

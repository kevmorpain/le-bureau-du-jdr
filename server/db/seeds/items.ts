import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { itemsData } from './data/items'

export default async function seed() {
  const existing = await db
    .select({
      id: schema.items.id,
      description: schema.items.description,
      source: schema.items.source,
      rarity: schema.items.rarity,
      requiresAttunement: schema.items.requiresAttunement,
      attunementNote: schema.items.attunementNote,
      weightG: schema.items.weightG,
      costCp: schema.items.costCp,
      lotSize: schema.items.lotSize,
    })
    .from(schema.items)
  const byId = new Map(existing.map(i => [i.id, i]))

  let inserted = 0
  let updated = 0

  for (const item of itemsData) {
    // Le nom/type/properties ne sont PAS resynchronisés (les renommages passent par migration, cf. 0076) ;
    // la description et les champs d'objet magique le sont, pour corriger une base déjà peuplée.
    const content = {
      description: item.description ?? null,
      source: item.source ?? 'core',
      rarity: item.rarity ?? null,
      requiresAttunement: item.requiresAttunement ?? false,
      attunementNote: item.attunementNote ?? null,
      weightG: item.weightG ?? null,
      costCp: item.costCp ?? null,
      lotSize: item.lotSize ?? 1,
    }

    const cur = byId.get(item.id)
    if (cur) {
      const changed
        = cur.description !== content.description
        || cur.source !== content.source
        || cur.rarity !== content.rarity
        || cur.requiresAttunement !== content.requiresAttunement
        || cur.attunementNote !== content.attunementNote
        || cur.weightG !== content.weightG
        || cur.costCp !== content.costCp
        || cur.lotSize !== content.lotSize
      if (changed) {
        await db.update(schema.items).set(content).where(eq(schema.items.id, item.id))
        updated++
      }
      continue
    }

    await db
      .insert(schema.items)
      .values({
        id: item.id,
        name: item.name,
        itemType: item.itemType,
        properties: item.properties,
        isCustom: false,
        ...content,
      })
      .onConflictDoNothing()
    inserted++
  }

  return { inserted, updated, skipped: itemsData.length - inserted - updated }
}

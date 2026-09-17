import { db } from 'hub:db'
import { eq } from 'drizzle-orm'
import * as srcSchema from '~~/server/db/schema'
import { itemsData } from './data/items'

export default async function seed() {
  // srcSchema (schéma frais) : le cache hub:db peut dropper les colonnes récentes en silence.
  const existing = await db
    .select({
      id: srcSchema.items.id,
      description: srcSchema.items.description,
      source: srcSchema.items.source,
      rarity: srcSchema.items.rarity,
      requiresAttunement: srcSchema.items.requiresAttunement,
      attunementNote: srcSchema.items.attunementNote,
    })
    .from(srcSchema.items)
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
    }

    const cur = byId.get(item.id)
    if (cur) {
      const changed
        = cur.description !== content.description
        || cur.source !== content.source
        || cur.rarity !== content.rarity
        || cur.requiresAttunement !== content.requiresAttunement
        || cur.attunementNote !== content.attunementNote
      if (changed) {
        await db.update(srcSchema.items).set(content).where(eq(srcSchema.items.id, item.id))
        updated++
      }
      continue
    }

    await db
      .insert(srcSchema.items)
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

import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { spells } from './data/spells'

export default async function seed() {
  let inserted = 0
  let skipped = 0

  for (const spell of spells) {
    const existing = await db.query.spells.findFirst({
      where: eq(schema.spells.name, spell.name),
    })

    if (existing) {
      skipped++
      continue
    }

    await db.insert(schema.spells).values(spell)
    inserted++
  }

  return { inserted, skipped }
}

import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'
import { classesData } from './data/classes'

export default async function seed() {
  for (const cls of classesData) {
    await db.run(
      sql`UPDATE classes SET spellcasting_ability = ${cls.spellcastingAbility}, hit_dice = ${cls.hitDice} WHERE name = ${cls.name}`,
    )
  }
  // Insère uniquement les classes absentes
  const existing = await db.select({ name: schema.classes.name }).from(schema.classes)
  const existingNames = new Set(existing.map(r => r.name))
  for (const cls of classesData) {
    if (!existingNames.has(cls.name)) {
      await db.insert(schema.classes).values(cls)
    }
  }
}

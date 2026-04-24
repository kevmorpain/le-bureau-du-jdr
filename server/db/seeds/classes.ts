import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { classesData } from './data/classes'

export default async function seed() {
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const cls of classesData) {
    const existing = await db
      .select({ id: schema.classes.id, hitDice: schema.classes.hitDice, spellcastingAbility: schema.classes.spellcastingAbility })
      .from(schema.classes)
      .where(eq(schema.classes.name, cls.name))
      .get()

    if (!existing) {
      await db.insert(schema.classes).values(cls)
      inserted++
    } else if (existing.hitDice !== cls.hitDice || existing.spellcastingAbility !== cls.spellcastingAbility) {
      await db
        .update(schema.classes)
        .set({ hitDice: cls.hitDice, spellcastingAbility: cls.spellcastingAbility })
        .where(eq(schema.classes.id, existing.id))
      updated++
    } else {
      skipped++
    }
  }

  return { inserted, updated, skipped }
}

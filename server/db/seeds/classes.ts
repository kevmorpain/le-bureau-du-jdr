import { db } from 'hub:db'
// Schéma importé de la source : le cache hub:db peut être périmé et dropper les colonnes neuves en silence.
import * as schema from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { classesData } from './data/classes'
import { rulesetOf } from './lib/rulesetOf'

export default async function seed() {
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const cls of classesData) {
    const existing = await db
      .select({
        id: schema.classes.id,
        hitDice: schema.classes.hitDice,
        spellcastingAbility: schema.classes.spellcastingAbility,
        subclassLevel: schema.classes.subclassLevel,
        spellcastingType: schema.classes.spellcastingType,
      })
      .from(schema.classes)
      // Keyé par (name, ruleset) : un homonyme 5.5 est une ligne DISTINCTE, pas une mise à jour (D2).
      .where(and(eq(schema.classes.name, cls.name), eq(schema.classes.ruleset, rulesetOf(cls))))
      .get()

    if (!existing) {
      await db.insert(schema.classes).values(cls)
      inserted++
    } else if (
      existing.hitDice !== cls.hitDice
      || existing.spellcastingAbility !== cls.spellcastingAbility
      || existing.subclassLevel !== cls.subclassLevel
      || existing.spellcastingType !== cls.spellcastingType
    ) {
      await db
        .update(schema.classes)
        .set({
          hitDice: cls.hitDice,
          spellcastingAbility: cls.spellcastingAbility,
          subclassLevel: cls.subclassLevel,
          spellcastingType: cls.spellcastingType,
        })
        .where(eq(schema.classes.id, existing.id))
      updated++
    } else {
      skipped++
    }
  }

  return { inserted, updated, skipped }
}

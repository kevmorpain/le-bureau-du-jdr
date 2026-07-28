import { db } from 'hub:db'
// Colonnes neuves (subclass_level, spellcasting_type) → schéma importé de la source
// et non de `hub:db`, dont le cache peut être périmé au démarrage : `drizzle.set()`
// laisserait alors tomber les nouveaux champs en silence (cf. CLAUDE.md « hub:db
// schema cache »). Seul `db` vient encore de `hub:db`.
import * as schema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { classesData } from './data/classes'

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
      .where(eq(schema.classes.name, cls.name))
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

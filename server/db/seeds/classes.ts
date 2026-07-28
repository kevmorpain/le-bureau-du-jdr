import { db } from 'hub:db'
// Colonnes neuves (subclass_level, spellcasting_type) → schéma importé de la source :
// le cache de `hub:db` peut être périmé au démarrage et `drizzle.set()` laisserait
// alors tomber les nouveaux champs en silence (cf. CLAUDE.md « hub:db schema cache »).
import * as srcSchema from '~~/server/db/schema'
import { eq } from 'drizzle-orm'
import { classesData } from './data/classes'

export default async function seed() {
  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const cls of classesData) {
    const existing = await db
      .select({
        id: srcSchema.classes.id,
        hitDice: srcSchema.classes.hitDice,
        spellcastingAbility: srcSchema.classes.spellcastingAbility,
        subclassLevel: srcSchema.classes.subclassLevel,
        spellcastingType: srcSchema.classes.spellcastingType,
      })
      .from(srcSchema.classes)
      .where(eq(srcSchema.classes.name, cls.name))
      .get()

    if (!existing) {
      await db.insert(srcSchema.classes).values(cls)
      inserted++
    } else if (
      existing.hitDice !== cls.hitDice
      || existing.spellcastingAbility !== cls.spellcastingAbility
      || existing.subclassLevel !== cls.subclassLevel
      || existing.spellcastingType !== cls.spellcastingType
    ) {
      await db
        .update(srcSchema.classes)
        .set({
          hitDice: cls.hitDice,
          spellcastingAbility: cls.spellcastingAbility,
          subclassLevel: cls.subclassLevel,
          spellcastingType: cls.spellcastingType,
        })
        .where(eq(srcSchema.classes.id, existing.id))
      updated++
    } else {
      skipped++
    }
  }

  return { inserted, updated, skipped }
}

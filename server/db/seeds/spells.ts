import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { spells } from './data/spells'
import { spellClassMappings } from './data/spell_class_mappings'

export default async function seed() {
  // Build class name → ID map (single query)
  const allClasses = await db.select({ id: schema.classes.id, name: schema.classes.name }).from(schema.classes)
  const classIdByName = Object.fromEntries(allClasses.map(c => [c.name, c.id]))

  // Build spell name → class mappings lookup
  const classesBySpellName = Object.fromEntries(
    spellClassMappings.map(m => [m.spellName, m.classNames]),
  )

  let inserted = 0
  let updated = 0
  let skipped = 0
  let classLinksInserted = 0

  for (const spell of spells) {
    const existing = await db.query.spells.findFirst({ where: eq(schema.spells.name, spell.name) })

    let spellId: number
    if (existing) {
      // Resync des champs « contenu » (JSON et descriptifs) — les seeds restent
      // la source de vérité pour les définitions de sorts.
      const next = {
        damage: (spell as any).damage ?? null,
        heal: (spell as any).heal ?? null,
        multiAttack: (spell as any).multiAttack ?? null,
        dc: (spell as any).dc ?? null,
        description: spell.description ?? null,
        ritual: spell.ritual ?? false,
        concentration: spell.concentration ?? false,
      }
      const changed
        = JSON.stringify(existing.damage) !== JSON.stringify(next.damage)
        || JSON.stringify(existing.heal) !== JSON.stringify(next.heal)
        || JSON.stringify(existing.multiAttack) !== JSON.stringify(next.multiAttack)
        || JSON.stringify(existing.dc) !== JSON.stringify(next.dc)
        || existing.description !== next.description
        || existing.ritual !== next.ritual
        || existing.concentration !== next.concentration

      if (changed) {
        await db
          .update(schema.spells)
          .set(next)
          .where(eq(schema.spells.id, existing.id))
        updated++
      }
      else {
        skipped++
      }
      spellId = existing.id
    }
    else {
      spellId = await db.insert(schema.spells).values(spell).returning().get().then(r => (inserted++, r.id))
    }

    for (const className of classesBySpellName[spell.name] ?? []) {
      const classId = classIdByName[className]
      if (!classId) {
        console.warn(`[spells seed] Classe "${className}" introuvable pour le sort "${spell.name}"`)
        continue
      }
      await db.insert(schema.spellClasses).values({ spellId, classId }).onConflictDoNothing()
      classLinksInserted++
    }
  }

  return { inserted, updated, skipped, classLinksInserted }
}

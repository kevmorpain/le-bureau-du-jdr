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
  let skipped = 0
  let classLinksInserted = 0

  for (const spell of spells) {
    const existing = await db.query.spells.findFirst({ where: eq(schema.spells.name, spell.name) })

    const spellId = existing
      ? (skipped++, existing.id)
      : await db.insert(schema.spells).values(spell).returning().get().then(r => (inserted++, r.id))

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

  return { inserted, skipped, classLinksInserted }
}

import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
// Schéma importé depuis la source (pas hub:db) : la table `spells` a évolué
// (colonne `damage` → `damages[]`) et le cache ESM de hub:db peut être périmé,
// ce qui ferait silencieusement tomber les nouveaux champs (cf. docs/CLAUDE.md).
import * as srcSchema from '~~/server/db/schema'
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

  // Pré-chargement : on récupère tous les sorts et tous les liens sort↔classe
  // existants en 2 requêtes, plutôt qu'un findFirst par sort (73) + un insert
  // par lien (223) à chaque run. Sans ça, le seed explose la limite de requêtes
  // D1 par invocation Worker (cf. server/db/seeds/run.ts, mode ?only=).
  const existingSpells = await db.select().from(srcSchema.spells)
  const spellByName = new Map(existingSpells.map(s => [s.name, s]))

  const existingLinks = await db
    .select({ spellId: schema.spellClasses.spellId, classId: schema.spellClasses.classId })
    .from(schema.spellClasses)
  const linkSet = new Set(existingLinks.map(l => `${l.spellId}:${l.classId}`))

  let inserted = 0
  let updated = 0
  let skipped = 0
  let classLinksInserted = 0

  for (const spell of spells) {
    const existing = spellByName.get(spell.name)

    let spellId: number
    if (existing) {
      // Resync « source de vérité » : les seeds pilotent la définition complète
      // des sorts (hors le nom, dont les renommages passent par migration pour
      // éviter les doublons). On resynchronise donc tous les champs de contenu.
      const next = {
        level: spell.level,
        schoolId: spell.schoolId,
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        components: spell.components ?? [],
        material: spell.material ?? null,
        damages: (spell as any).damages ?? null,
        heal: (spell as any).heal ?? null,
        multiAttack: (spell as any).multiAttack ?? null,
        dc: (spell as any).dc ?? null,
        description: spell.description ?? null,
        ritual: spell.ritual ?? false,
        concentration: spell.concentration ?? false,
      }
      const changed
        = existing.level !== next.level
        || existing.schoolId !== next.schoolId
        || existing.castingTime !== next.castingTime
        || existing.range !== next.range
        || existing.duration !== next.duration
        || JSON.stringify(existing.components) !== JSON.stringify(next.components)
        || existing.material !== next.material
        || JSON.stringify(existing.damages) !== JSON.stringify(next.damages)
        || JSON.stringify(existing.heal) !== JSON.stringify(next.heal)
        || JSON.stringify(existing.multiAttack) !== JSON.stringify(next.multiAttack)
        || JSON.stringify(existing.dc) !== JSON.stringify(next.dc)
        || existing.description !== next.description
        || existing.ritual !== next.ritual
        || existing.concentration !== next.concentration

      if (changed) {
        await db
          .update(srcSchema.spells)
          .set(next)
          .where(eq(srcSchema.spells.id, existing.id))
        updated++
      }
      else {
        skipped++
      }
      spellId = existing.id
    }
    else {
      spellId = await db.insert(srcSchema.spells).values(spell).returning().get().then(r => (inserted++, r.id))
    }

    for (const className of classesBySpellName[spell.name] ?? []) {
      const classId = classIdByName[className]
      if (!classId) {
        console.warn(`[spells seed] Classe "${className}" introuvable pour le sort "${spell.name}"`)
        continue
      }
      // N'insère que les liens réellement absents (idempotent et léger en re-run).
      const key = `${spellId}:${classId}`
      if (linkSet.has(key)) continue
      await db.insert(schema.spellClasses).values({ spellId, classId }).onConflictDoNothing()
      linkSet.add(key)
      classLinksInserted++
    }
  }

  return { inserted, updated, skipped, classLinksInserted }
}

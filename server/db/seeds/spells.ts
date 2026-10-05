import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { spells } from './data/spells'
import { spellClassMappings } from './data/spell_class_mappings'
import { nameRulesetKey } from './lib/rulesetOf'

export default async function seed() {
  // ⚠️ SUIVI (lot sorts 5.5) : keyé par NOM seul → quand deux « Magicien » (2014+2024) coexisteront,
  // le lien sort↔classe deviendra ambigu. À reprendre en (nom, ruleset du sort) au moment du seed 5.5
  // des sorts (hors périmètre P0 : aucun sort ni classe 5.5 seedé aujourd'hui).
  const allClasses = await db.select({ id: schema.classes.id, name: schema.classes.name }).from(schema.classes)
  const classIdByName = Object.fromEntries(allClasses.map(c => [c.name, c.id]))

  const classesBySpellName = Object.fromEntries(
    spellClassMappings.map(m => [m.spellName, m.classNames]),
  )

  // Préchargement en 2 requêtes (sinon le seed explose la limite de requêtes D1). Dédup keyée par
  // (name, ruleset) : un sort 5.5 homonyme doit INSÉRER, jamais réécrire la ligne 2014.
  const existingSpells = await db.select().from(schema.spells)
  const spellByKey = new Map(existingSpells.map(s => [nameRulesetKey(s), s]))

  const existingLinks = await db
    .select({ spellId: schema.spellClasses.spellId, classId: schema.spellClasses.classId })
    .from(schema.spellClasses)
  const linkSet = new Set(existingLinks.map(l => `${l.spellId}:${l.classId}`))

  let inserted = 0
  let updated = 0
  let skipped = 0
  let classLinksInserted = 0

  for (const spell of spells) {
    const existing = spellByKey.get(nameRulesetKey(spell))

    let spellId: number
    if (existing) {
      const next = {
        level: spell.level,
        schoolId: spell.schoolId,
        castingTime: spell.castingTime,
        range: spell.range,
        duration: spell.duration,
        components: spell.components ?? [],
        material: spell.material ?? null,
        materialCost: (spell as any).materialCost ?? null,
        attackType: (spell as any).attackType ?? null,
        areaOfEffect: (spell as any).areaOfEffect ?? null,
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
        || JSON.stringify(existing.materialCost) !== JSON.stringify(next.materialCost)
        || existing.attackType !== next.attackType
        || JSON.stringify(existing.areaOfEffect) !== JSON.stringify(next.areaOfEffect)
        || JSON.stringify(existing.damages) !== JSON.stringify(next.damages)
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
      const key = `${spellId}:${classId}`
      if (linkSet.has(key)) continue
      await db.insert(schema.spellClasses).values({ spellId, classId }).onConflictDoNothing()
      linkSet.add(key)
      classLinksInserted++
    }
  }

  return { inserted, updated, skipped, classLinksInserted }
}

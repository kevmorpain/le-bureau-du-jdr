import { db, schema } from '~~/server/utils/db'
import { eq } from 'drizzle-orm'
import { spells } from './data/spells'
import { spellClassMappings } from './data/spell_class_mappings'
import { nameRulesetKey, rulesetOf } from './lib/rulesetOf'

export default async function seed() {
  const allClasses = await db.select({ id: schema.classes.id, name: schema.classes.name, ruleset: schema.classes.ruleset }).from(schema.classes)
  const classIdByKey = new Map(allClasses.map(c => [nameRulesetKey(c), c.id]))

  const classesBySpellKey = new Map(
    spellClassMappings.map(m => [nameRulesetKey({ name: m.spellName, ruleset: m.ruleset }), m.classNames]),
  )

  // Préchargement en 2 requêtes (sinon le seed explose la limite de requêtes D1). Dédup keyée par
  // (name, ruleset) : un sort 5.5 homonyme doit INSÉRER, jamais réécrire la ligne 2014.
  const existingSpells = await db.select().from(schema.spells)
  const spellByKey = new Map(existingSpells.map(s => [nameRulesetKey(s), s]))

  // Résolues avant toute écriture : un sort lié à une table absente ne doit pas laisser un seed à moitié fait.
  const rollTableRows = await db.select({ id: schema.rollTables.id, key: schema.rollTables.key, ruleset: schema.rollTables.ruleset }).from(schema.rollTables)
  const rollTableIdBySpell = new Map<string, number>()
  for (const spell of spells.filter(s => s.rollTable)) {
    const row = rollTableRows.find(r => r.key === spell.rollTable && r.ruleset === rulesetOf(spell))
    if (!row) throw new Error(`[spells seed] table ${spell.rollTable} introuvable pour « ${spell.name} » : lancer le seed rollTables d'abord`)
    rollTableIdBySpell.set(nameRulesetKey(spell), row.id)
  }
  const rollTableIdOf = (spell: (typeof spells)[number]): number | null => rollTableIdBySpell.get(nameRulesetKey(spell)) ?? null

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
        durationUnit: spell.durationUnit ?? 'special',
        durationValue: spell.durationValue ?? null,
        components: spell.components ?? [],
        material: spell.material ?? null,
        rollTableId: rollTableIdOf(spell),
        materialCost: spell.materialCost ?? null,
        attackType: spell.attackType ?? null,
        areaOfEffect: spell.areaOfEffect ?? null,
        damages: spell.damages ?? null,
        heal: spell.heal ?? null,
        multiAttack: spell.multiAttack ?? null,
        dc: spell.dc ?? null,
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
          || existing.durationUnit !== next.durationUnit
          || existing.durationValue !== next.durationValue
          || JSON.stringify(existing.components) !== JSON.stringify(next.components)
          || existing.material !== next.material
          || existing.rollTableId !== next.rollTableId
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
      } else {
        skipped++
      }
      spellId = existing.id
    } else {
      const { rollTable: _, ...columns } = spell
      spellId = await db.insert(schema.spells).values({ ...columns, rollTableId: rollTableIdOf(spell) }).returning().get().then(r => (inserted++, r.id))
    }

    const ruleset = rulesetOf(spell)
    for (const className of classesBySpellKey.get(nameRulesetKey(spell)) ?? []) {
      const classId = classIdByKey.get(nameRulesetKey({ name: className, ruleset }))
      if (!classId) {
        console.warn(`[spells seed] Classe "${className}" (${ruleset}) introuvable pour le sort "${spell.name}"`)
        continue
      }
      const key = `${spellId}:${classId}`
      if (linkSet.has(key)) continue
      await db.insert(schema.spellClasses).values({ spellId, classId, ruleset }).onConflictDoNothing()
      linkSet.add(key)
      classLinksInserted++
    }
  }

  return { inserted, updated, skipped, classLinksInserted }
}

import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

// Sorts de domaine et de serment : dérivés de la sous-classe et du niveau de classe, jamais stockés. Un sort
// que le catalogue n'a pas encore n'apparaît pas, et apparaît de lui-même une fois seedé.
export async function loadAlwaysPreparedSpells(db: Db, characterSheetId: number) {
  const classes = await db
    .select({
      classId: schema.characterClasses.classId,
      level: schema.characterClasses.level,
      subclassId: schema.characterClasses.subclassId,
      ruleset: schema.classes.ruleset,
    })
    .from(schema.characterClasses)
    .innerJoin(schema.classes, eq(schema.classes.id, schema.characterClasses.classId))
    .where(and(eq(schema.characterClasses.characterSheetId, characterSheetId), isNotNull(schema.characterClasses.subclassId)))
  if (!classes.length) return []

  const grants = await db
    .select({ subclassId: schema.features.subclassId, value: schema.effects.value })
    .from(schema.features)
    .innerJoin(schema.featureEffects, eq(schema.featureEffects.featureId, schema.features.id))
    .innerJoin(schema.effects, eq(schema.effects.id, schema.featureEffects.effectId))
    .where(and(
      inArray(schema.features.subclassId, classes.map(c => c.subclassId!)),
      eq(schema.effects.type, 'always_prepared_spell'),
    ))

  const unlocked = classes.flatMap(cls => grants
    .filter(g => g.subclassId === cls.subclassId)
    .map(g => g.value as { spellName: string, unlockLevel: number })
    .filter(v => v.unlockLevel <= cls.level)
    .map(v => ({ classId: cls.classId, ruleset: cls.ruleset, spellName: v.spellName })))
  if (!unlocked.length) return []

  const rows = await db
    .select({ spell: schema.spells, school: schema.magicSchools })
    .from(schema.spells)
    .innerJoin(schema.magicSchools, eq(schema.magicSchools.id, schema.spells.schoolId))
    .where(inArray(schema.spells.name, [...new Set(unlocked.map(u => u.spellName))]))
  const spells = rows.map(r => ({ ...r.spell, school: r.school }))

  const seen = new Set<number>()
  return unlocked.flatMap((u) => {
    const spell = spells.find(s => s.name === u.spellName && s.ruleset === u.ruleset)
    if (!spell || seen.has(spell.id)) return []
    seen.add(spell.id)
    return [{
      characterSheetId,
      spellId: spell.id,
      classId: u.classId,
      isKnown: true,
      isPrepared: true,
      source: null,
      alwaysPrepared: true,
      spell,
    }]
  })
}

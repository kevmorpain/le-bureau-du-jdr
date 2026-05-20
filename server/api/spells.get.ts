import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { className } = getQuery(event) as { className?: string }

  if (className) {
    const rows = await db
      .select({ spell: schema.spells, school: schema.magicSchools })
      .from(schema.spells)
      .leftJoin(schema.magicSchools, eq(schema.spells.schoolId, schema.magicSchools.id))
      .leftJoin(schema.spellClasses, eq(schema.spellClasses.spellId, schema.spells.id))
      .leftJoin(schema.classes, eq(schema.spellClasses.classId, schema.classes.id))
      .where(eq(schema.classes.name, className))
      .orderBy(asc(schema.spells.level), asc(schema.spells.name))

    return rows.map(r => ({ ...r.spell, school: r.school }))
  }

  const rows = await db
    .select({ spell: schema.spells, school: schema.magicSchools })
    .from(schema.spells)
    .leftJoin(schema.magicSchools, eq(schema.spells.schoolId, schema.magicSchools.id))
    .orderBy(asc(schema.spells.level), asc(schema.spells.name))

  return rows.map(r => ({ ...r.spell, school: r.school }))
})

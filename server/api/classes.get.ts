import { db } from 'hub:db'
import * as schema from '~~/server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const rows = await db
    .select()
    .from(schema.classes)
    .leftJoin(schema.subclasses, eq(schema.subclasses.classId, schema.classes.id))
    .orderBy(asc(schema.classes.id), asc(schema.subclasses.name))

  // Regroupe les sous-classes par classe
  const byId = new Map<number, ReturnType<typeof formatClass>>()
  for (const r of rows) {
    const cls = r.classes
    if (!byId.has(cls.id)) byId.set(cls.id, formatClass(cls))
    if (r.subclasses) byId.get(cls.id)!.subclasses.push(r.subclasses)
  }
  return [...byId.values()]
})

function formatClass(c: typeof schema.classes.$inferSelect) {
  return { ...c, subclasses: [] as (typeof schema.subclasses.$inferSelect)[] }
}

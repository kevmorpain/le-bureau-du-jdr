import { inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

export async function subclassNamesById(db: Db, ids: Array<number | null | undefined>): Promise<Map<number, string>> {
  const wanted = [...new Set(ids.filter((id): id is number => id != null))]
  if (!wanted.length) return new Map()
  const rows = await db
    .select({ id: schema.subclasses.id, name: schema.subclasses.name })
    .from(schema.subclasses)
    .where(inArray(schema.subclasses.id, wanted))
  return new Map(rows.map(r => [r.id, r.name]))
}

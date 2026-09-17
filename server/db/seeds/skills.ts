import { db } from 'hub:db'
import * as srcSchema from '~~/server/db/schema'
import { SKILLS } from '~~/shared/rules/skills'

export default async function seed() {
  const rows = Object.entries(SKILLS).map(([id, def]) => ({ id, ability: def.ability }))
  const inserted = await db.insert(srcSchema.skills).values(rows).onConflictDoNothing().returning()
  return { inserted: inserted.length, skipped: rows.length - inserted.length }
}

import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import { rollTables, type RollTableDef } from '../data/rollTables'
import { rulesetOf } from './rulesetOf'

// Keyé par (key, ruleset) et resynchronisé : une table corrigée dans le seed met à jour la base peuplée.
export async function seedRollTables(db: Db, defs: RollTableDef[] = rollTables) {
  const existing = await db.select().from(schema.rollTables)
  let inserted = 0
  let updated = 0

  for (const def of defs) {
    const ruleset = rulesetOf(def)
    const content = { name: def.name, die: def.die, entries: def.entries }
    const row = existing.find(r => r.key === def.key && r.ruleset === ruleset)
    if (!row) {
      await db.insert(schema.rollTables).values({ key: def.key, ruleset, ...content })
      inserted++
    } else if (JSON.stringify({ name: row.name, die: row.die, entries: row.entries }) !== JSON.stringify(content)) {
      await db.update(schema.rollTables)
        .set({ ...content, updatedAt: new Date().toISOString() })
        .where(eq(schema.rollTables.id, row.id))
      updated++
    }
  }

  return { inserted, updated, skipped: defs.length - inserted - updated }
}

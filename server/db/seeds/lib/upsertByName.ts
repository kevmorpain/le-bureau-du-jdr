import type { Ruleset } from '~~/shared/rules/ruleset'
import { rulesetOf } from './rulesetOf'

/** Upsert keyé par (name, ruleset) — jamais par nom seul : un homonyme 5.5 insère une ligne distincte (D2). */
export async function upsertByName<T extends { name: string; ruleset?: Ruleset }>(
  findFirst: (name: string, ruleset: Ruleset) => Promise<unknown>,
  insert: (row: T) => Promise<unknown>,
  rows: T[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0
  for (const row of rows) {
    const existing = await findFirst(row.name, rulesetOf(row))
    if (existing) { skipped++; continue }
    await insert(row)
    inserted++
  }
  return { inserted, skipped }
}

import type { Ruleset } from '~~/shared/rules/ruleset'
import { rulesetOf } from './rulesetOf'

/**
 * Upsert idempotent d'entités de catalogue keyé par **(name, ruleset)** — PAS par nom seul :
 * un contenu 5.5 homonyme (« Sage », « Soldat »…) insère une ligne distincte au lieu d'écraser
 * la 2014 (cf. {@link rulesetOf}, decisions.md D2). `findFirst` reçoit donc `(name, ruleset)`.
 * `insert` doit estampiller la ligne avec `ruleset` (défaut `'5'` via la colonne / `rulesetOf`).
 */
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

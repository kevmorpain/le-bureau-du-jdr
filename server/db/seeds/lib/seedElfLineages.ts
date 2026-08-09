import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { seedLineages } from './seedLineages'
import { elf } from '../data/elf'

/**
 * Shim de compat du pilote elfe. La logique GÉNÉRIQUE vit désormais dans `seedLineages(db, data)`
 * (chantier lignée, D17 — généralisée au lot 6) ; ce point d'entrée reste pour le wrapper
 * `elf_lineages.ts` (`?only=elfLineage`) et le test `seedElfLineages.test.ts`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export function seedElfLineages(db: Db) {
  return seedLineages(db, elf)
}

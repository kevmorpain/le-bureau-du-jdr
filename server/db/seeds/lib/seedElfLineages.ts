import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { seedLineages } from './seedLineages'
import { elf } from '../data/elf'

// Shim de compat (`?only=elfLineage`) : la logique générique vit dans `seedLineages(db, data)`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export function seedElfLineages(db: Db) {
  return seedLineages(db, elf)
}

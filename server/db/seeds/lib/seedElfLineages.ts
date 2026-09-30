import { seedLineages } from './seedLineages'
import { elf } from '../data/elf'
import type { Db } from '~~/server/utils/db'

// Shim de compat (`?only=elfLineage`) : la logique générique vit dans `seedLineages(db, data)`.

export function seedElfLineages(db: Db) {
  return seedLineages(db, elf)
}

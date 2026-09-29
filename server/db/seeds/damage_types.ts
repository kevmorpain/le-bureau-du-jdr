import { db, schema } from '~~/server/utils/db'
import damageTypes from './data/damage_types.json'

export default async function seed() {
  const rows = await db.insert(schema.damageTypes).values(damageTypes).onConflictDoNothing().returning()
  return { inserted: rows.length, skipped: damageTypes.length - rows.length }
}

import { db, schema } from 'hub:db'
import damageTypes from './data/damage_types.json'

export default async function seed() {
  const rows = await db.insert(schema.damageTypes).values(damageTypes).onConflictDoNothing().returning()
  return { inserted: rows.length, skipped: damageTypes.length - rows.length }
}

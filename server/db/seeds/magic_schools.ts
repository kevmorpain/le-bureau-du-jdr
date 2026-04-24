import { db, schema } from 'hub:db'
import magicSchools from './data/magic_schools.json'

export default async function seed() {
  const rows = await db.insert(schema.magicSchools).values(magicSchools).onConflictDoNothing().returning()
  return { inserted: rows.length, skipped: magicSchools.length - rows.length }
}

import { db, schema } from 'hub:db'
import magicSchools from './data/magic_schools.json'

export default async function seed() {
  await db.insert(schema.magicSchools).values(magicSchools)
}

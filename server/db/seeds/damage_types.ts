import { db, schema } from 'hub:db'
import damageTypes from './data/damage_types.json'

export default async function seed() {
  await db.insert(schema.damageTypes).values(damageTypes)
}

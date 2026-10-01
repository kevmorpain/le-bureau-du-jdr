import { db } from '~~/server/utils/db'
import { seedRollTables } from './lib/seedRollTables'

export default function seed() {
  return seedRollTables(db)
}

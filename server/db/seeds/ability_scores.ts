import { db, schema } from 'hub:db'
import abilityScores from './data/ability_scores.json'

export default async function seed() {
  const rows = await db.insert(schema.abilityScores).values(abilityScores).onConflictDoNothing().returning()
  return { inserted: rows.length, skipped: abilityScores.length - rows.length }
}

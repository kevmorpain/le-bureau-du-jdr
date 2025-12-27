import { db, schema } from 'hub:db'
import abilityScores from './data/ability_scores.json'

export default async function seed() {
  await db.insert(schema.abilityScores).values(abilityScores)
}

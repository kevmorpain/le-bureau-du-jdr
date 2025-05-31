import abilityScores from './data/ability_scores.json'

export default async function seed() {
  await useDrizzle().insert(tables.abilityScores).values(abilityScores)
}

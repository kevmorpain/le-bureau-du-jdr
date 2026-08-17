import { seedClass } from './lib/seedClass'
import { paladinName, paladinFeatures, paladinSubclasses } from './data/paladin'

export default async function seed() {
  return seedClass(paladinName, paladinFeatures, paladinSubclasses)
}

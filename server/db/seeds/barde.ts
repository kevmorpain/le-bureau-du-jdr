import { seedClass } from './lib/seedClass'
import { bardeName, bardeFeatures, bardeSubclasses } from './data/barde'

export default async function seed() {
  return seedClass(bardeName, bardeFeatures, bardeSubclasses)
}

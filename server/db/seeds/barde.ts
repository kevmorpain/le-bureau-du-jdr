import { seedClass } from './lib/seedClass'
import { bardeName, bardeFeatures, bardeSubclasses } from './data/barde'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(bardeName, [subclassChoiceFeature(bardeName), ...bardeFeatures], bardeSubclasses)
}

import { seedClass } from './lib/seedClass'
import { paladinName, paladinFeatures, paladinSubclasses } from './data/paladin'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(paladinName, [subclassChoiceFeature(paladinName), ...paladinFeatures], paladinSubclasses)
}

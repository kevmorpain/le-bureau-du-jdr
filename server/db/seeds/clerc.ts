import { seedClass } from './lib/seedClass'
import { clercName, clercFeatures, clercSubclasses } from './data/clerc'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(clercName, [subclassChoiceFeature(clercName), ...clercFeatures], clercSubclasses)
}

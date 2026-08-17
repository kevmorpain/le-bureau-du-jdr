import { seedClass } from './lib/seedClass'
import { druideName, druideFeatures, druideSubclasses } from './data/druide'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(druideName, [subclassChoiceFeature(druideName), ...druideFeatures], druideSubclasses)
}

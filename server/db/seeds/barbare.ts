import { seedClass } from './lib/seedClass'
import { barbareName, barbareFeatures, barbareSubclasses } from './data/barbare'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(barbareName, [subclassChoiceFeature(barbareName), ...barbareFeatures], barbareSubclasses)
}

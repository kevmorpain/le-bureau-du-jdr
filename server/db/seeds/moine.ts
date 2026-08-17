import { seedClass } from './lib/seedClass'
import { moineName, moineFeatures, moineSubclasses } from './data/moine'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(moineName, [subclassChoiceFeature(moineName), ...moineFeatures], moineSubclasses)
}

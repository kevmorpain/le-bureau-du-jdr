import { seedClass } from './lib/seedClass'
import { ensorceleurName, ensorceleurFeatures, ensorceleurSubclasses } from './data/ensorceleur'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(ensorceleurName, [subclassChoiceFeature(ensorceleurName), ...ensorceleurFeatures], ensorceleurSubclasses)
}

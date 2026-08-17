import { seedClass } from './lib/seedClass'
import { rodeurName, rodeurFeatures, rodeurSubclasses } from './data/rodeur'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(rodeurName, [subclassChoiceFeature(rodeurName), ...rodeurFeatures], rodeurSubclasses)
}

import { seedClass } from './lib/seedClass'
import { roublardName, roublardFeatures, roublardSubclasses } from './data/roublard'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(roublardName, [subclassChoiceFeature(roublardName), ...roublardFeatures], roublardSubclasses)
}

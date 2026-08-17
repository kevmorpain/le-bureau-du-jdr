import { seedClass } from './lib/seedClass'
import { guerrierName, guerrierFeatures, guerrierSubclasses } from './data/guerrier'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(guerrierName, [subclassChoiceFeature(guerrierName), ...guerrierFeatures], guerrierSubclasses)
}

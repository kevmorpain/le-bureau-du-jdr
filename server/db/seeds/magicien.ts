import { seedClass } from './lib/seedClass'
import { magicienName, magicienFeatures, magicienSubclasses } from './data/magicien'
import { subclassChoiceFeature } from './data/subclassChoice'

export default async function seed() {
  return seedClass(magicienName, [subclassChoiceFeature(magicienName), ...magicienFeatures], magicienSubclasses)
}

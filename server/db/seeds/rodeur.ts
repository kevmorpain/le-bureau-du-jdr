import { seedClass } from './lib/seedClass'
import { rodeurName, rodeurFeatures, rodeurSubclasses } from './data/rodeur'

export default async function seed() {
  return seedClass(rodeurName, rodeurFeatures, rodeurSubclasses)
}

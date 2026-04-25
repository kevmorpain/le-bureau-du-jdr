import { seedClass } from './lib/seedClass'
import { druideName, druideFeatures, druideSubclasses } from './data/druide'

export default async function seed() {
  return seedClass(druideName, druideFeatures, druideSubclasses)
}

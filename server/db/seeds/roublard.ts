import { seedClass } from './lib/seedClass'
import { roublardName, roublardFeatures, roublardSubclasses } from './data/roublard'

export default async function seed() {
  return seedClass(roublardName, roublardFeatures, roublardSubclasses)
}

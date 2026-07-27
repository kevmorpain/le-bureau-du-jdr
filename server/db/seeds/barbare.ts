import { seedClass } from './lib/seedClass'
import { barbareName, barbareFeatures, barbareSubclasses } from './data/barbare'

export default async function seed() {
  return seedClass(barbareName, barbareFeatures, barbareSubclasses)
}

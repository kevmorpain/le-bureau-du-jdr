import { seedClass } from './lib/seedClass'
import { moineName, moineFeatures, moineSubclasses } from './data/moine'

export default async function seed() {
  return seedClass(moineName, moineFeatures, moineSubclasses)
}

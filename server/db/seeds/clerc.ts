import { seedClass } from './lib/seedClass'
import { clercName, clercFeatures, clercSubclasses } from './data/clerc'

export default async function seed() {
  return seedClass(clercName, clercFeatures, clercSubclasses)
}

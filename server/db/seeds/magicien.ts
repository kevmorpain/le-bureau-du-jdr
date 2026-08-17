import { seedClass } from './lib/seedClass'
import { magicienName, magicienFeatures, magicienSubclasses } from './data/magicien'

export default async function seed() {
  return seedClass(magicienName, magicienFeatures, magicienSubclasses)
}

import { seedClass } from './lib/seedClass'
import { ensorceleurName, ensorceleurFeatures, ensorceleurSubclasses } from './data/ensorceleur'

export default async function seed() {
  return seedClass(ensorceleurName, ensorceleurFeatures, ensorceleurSubclasses)
}

import { seedClass } from './lib/seedClass'
import { guerrierName, guerrierFeatures, guerrierSubclasses } from './data/guerrier'

export default async function seed() {
  return seedClass(guerrierName, guerrierFeatures, guerrierSubclasses)
}

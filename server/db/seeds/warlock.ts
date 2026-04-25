import { seedClass } from './lib/seedClass'
import { warlockClassName, warlockFeatures, warlockSubclasses } from './data/warlock'
import type { Effect } from '../schema/effects'

export default async function seed() {
  return seedClass(
    warlockClassName,
    warlockFeatures.map(f => ({ ...f, effects: (f.effects ?? []) as Effect[] })),
    warlockSubclasses,
  )
}

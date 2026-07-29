import { seedClass } from './lib/seedClass'
import { warlockClassName, warlockFeatures, warlockSubclasses } from './data/warlock'
import { warlockInvocationFeatures } from './data/warlock_invocations'
import type { Effect } from '../schema/effects'

export default async function seed() {
  const baseFeatures = warlockFeatures.map(f => ({ ...f, effects: (f.effects ?? []) as Effect[] }))
  // `warlockInvocationFeatures` porte déjà feature_type='eldritch_invocation' et
  // tag='invocation' (cf. data/warlock_invocations.ts).
  return seedClass(
    warlockClassName,
    [...baseFeatures, ...warlockInvocationFeatures],
    warlockSubclasses,
  )
}

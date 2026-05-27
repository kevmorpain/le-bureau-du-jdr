import { seedClass } from './lib/seedClass'
import { warlockClassName, warlockFeatures, warlockSubclasses } from './data/warlock'
import { warlockInvocations } from './data/warlock_invocations'
import type { Effect } from '../schema/effects'

export default async function seed() {
  const baseFeatures = warlockFeatures.map(f => ({ ...f, effects: (f.effects ?? []) as Effect[] }))
  const invocationFeatures = warlockInvocations.map(inv => ({
    name: inv.name,
    description: inv.description,
    featureType: 'eldritch_invocation' as const,
    levelRequired: inv.levelRequired,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: inv.effects,
    prerequisites: inv.prerequisites,
  }))
  return seedClass(
    warlockClassName,
    [...baseFeatures, ...invocationFeatures],
    warlockSubclasses,
  )
}

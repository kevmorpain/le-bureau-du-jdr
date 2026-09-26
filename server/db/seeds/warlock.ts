import { seedClass } from './lib/seedClass'
import type { FeatureDef } from './lib/seedClass'
import { warlockClassName, warlockFeatures, warlockSubclasses } from './data/warlock'
import { warlockInvocationFeatures } from './data/warlock_invocations'
import { warlockProgressionByOwner } from './data/warlock_progression'

export default async function seed() {
  const baseFeatures: FeatureDef[] = [...warlockFeatures, ...warlockInvocationFeatures]

  // Fail-fast si un propriétaire manque, pour ne pas seeder une progression orpheline.
  for (const { ownerName, ownerLevelRequired, progression } of warlockProgressionByOwner) {
    const owner = baseFeatures.find(f => f.name === ownerName && f.levelRequired === ownerLevelRequired)
    if (!owner) {
      throw new Error(`[seed warlock] feature propriétaire introuvable pour la progression : "${ownerName}" (niveau ${ownerLevelRequired})`)
    }
    owner.progression = progression
  }

  return seedClass(warlockClassName, baseFeatures, warlockSubclasses)
}

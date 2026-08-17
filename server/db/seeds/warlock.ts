import { seedClass } from './lib/seedClass'
import type { FeatureDef } from './lib/seedClass'
import { warlockClassName, warlockFeatures, warlockSubclasses } from './data/warlock'
import { warlockInvocationFeatures } from './data/warlock_invocations'
import { warlockProgressionByOwner } from './data/warlock_progression'
import { subclassChoiceFeature } from './data/subclassChoice'
import type { Effect } from '../schema/effects'

export default async function seed() {
  // `warlockFeatures` inclut désormais les 3 options de pacte (taguées pact_boon) ;
  // `warlockInvocationFeatures` porte feature_type='eldritch_invocation' + tag='invocation'.
  // Le choix de sous-classe (Protecteur d'outre-monde, niv 1) suit le même modèle `progression`
  // que les 11 autres classes (F2), en plus des points de choix propres à l'Occultiste.
  const baseFeatures: FeatureDef[] = [
    subclassChoiceFeature(warlockClassName),
    ...warlockFeatures.map(f => ({ ...f, effects: (f.effects ?? []) as Effect[] })),
    ...warlockInvocationFeatures,
  ]

  // Attache chaque point de choix à sa feature PROPRIÉTAIRE par (nom + niveau) — owner =
  // featureId (D4). La donnée du binding vit dans data/warlock_progression.ts (testée
  // contre le contrat) ; ici, on ne fait que l'appliquer. Fail-fast si un propriétaire
  // manque, pour ne pas seeder silencieusement une progression orpheline.
  for (const { ownerName, ownerLevelRequired, progression } of warlockProgressionByOwner) {
    const owner = baseFeatures.find(f => f.name === ownerName && f.levelRequired === ownerLevelRequired)
    if (!owner) {
      throw new Error(`[seed warlock] feature propriétaire introuvable pour la progression : "${ownerName}" (niveau ${ownerLevelRequired})`)
    }
    owner.progression = progression
  }

  return seedClass(warlockClassName, baseFeatures, warlockSubclasses)
}

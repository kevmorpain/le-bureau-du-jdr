import { seedClass } from './lib/seedClass'
import type { FeatureDef } from './lib/seedClass'
import { ensorceleurName, ensorceleurFeatures, ensorceleurSubclasses } from './data/ensorceleur'
import { ensorceleurMetamagicFeatures, ensorceleurProgressionByOwner } from './data/ensorceleur_metamagic'

export default async function seed() {
  // Les 8 options de Métamagie (taguées `metamagic`) rejoignent les features de la classe, et le
  // point de choix `metamagic` est attaché à sa feature propriétaire « Métamagie » (niveau 3) —
  // même patron que l'Occultiste (cf. seeds/warlock.ts). Fail-fast si l'owner manque.
  const features: FeatureDef[] = [...ensorceleurFeatures, ...ensorceleurMetamagicFeatures]

  for (const { ownerName, ownerLevelRequired, progression } of ensorceleurProgressionByOwner) {
    const owner = features.find(f => f.name === ownerName && f.levelRequired === ownerLevelRequired)
    if (!owner) {
      throw new Error(`[seed ensorceleur] feature propriétaire introuvable pour la progression : "${ownerName}" (niveau ${ownerLevelRequired})`)
    }
    owner.progression = progression
  }

  return seedClass(ensorceleurName, features, ensorceleurSubclasses)
}

import { magicienFeatures, magicienName, magicienSubclasses } from '../../server/db/seeds/data/magicien'
import { warlockClassName, warlockFeatures, warlockSubclasses } from '../../server/db/seeds/data/warlock'
import { CLASSES, COUNTER_PATCH_KEYS, type ResourcePatch } from './classResourcePatches'

// Le Magicien et l'Occultiste n'avaient aucune ressource à la 0120 : ils ne sont pas dans `CLASSES`.
export const SEED_CLASSES = [
  ...CLASSES,
  { name: magicienName, features: magicienFeatures, subclasses: magicienSubclasses },
  { name: warlockClassName, features: warlockFeatures, subclasses: warlockSubclasses },
]

// « Ki » reçoit de nouvelles dépenses (migration 0157) en plus de ce que la 0120 lui a posé.
const KI: readonly [string, string] = ['Moine', 'Ki']

export const featureCounterPatches = (): ResourcePatch[] =>
  [...COUNTER_PATCH_KEYS, KI].map(([className, name]) => {
    const cls = SEED_CLASSES.find(c => c.name === className)
    if (!cls) throw new Error(`Classe inconnue : ${className}`)
    const hits: ResourcePatch[] = [
      ...cls.features.filter(f => f.name === name).map(feature => ({ className, subclass: null, feature })),
      ...cls.subclasses.flatMap(s => s.features.filter(f => f.name === name).map(feature => ({ className, subclass: s.name, feature }))),
    ]
    if (hits.length !== 1) throw new Error(`${className} / ${name} : ${hits.length} correspondances dans les seeds`)
    return hits[0]!
  })

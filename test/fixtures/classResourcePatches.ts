import type { FeatureDef, SubclassDef } from '../../server/db/seeds/lib/seedClass'
import { barbareFeatures, barbareName, barbareSubclasses } from '../../server/db/seeds/data/barbare'
import { bardeFeatures, bardeName, bardeSubclasses } from '../../server/db/seeds/data/barde'
import { clercFeatures, clercName, clercSubclasses } from '../../server/db/seeds/data/clerc'
import { druideFeatures, druideName, druideSubclasses } from '../../server/db/seeds/data/druide'
import { ensorceleurFeatures, ensorceleurName, ensorceleurSubclasses } from '../../server/db/seeds/data/ensorceleur'
import { ensorceleurMetamagicFeatures } from '../../server/db/seeds/data/ensorceleur_metamagic'
import { guerrierFeatures, guerrierName, guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { moineFeatures, moineName, moineSubclasses } from '../../server/db/seeds/data/moine'
import { paladinFeatures, paladinName, paladinSubclasses } from '../../server/db/seeds/data/paladin'
import { rodeurFeatures, rodeurName, rodeurSubclasses } from '../../server/db/seeds/data/rodeur'
import { roublardFeatures, roublardName, roublardSubclasses } from '../../server/db/seeds/data/roublard'

export interface ResourcePatch {
  className: string
  subclass: string | null
  feature: FeatureDef
}

const CLASSES: { name: string, features: FeatureDef[], subclasses: SubclassDef[] }[] = [
  { name: barbareName, features: barbareFeatures, subclasses: barbareSubclasses },
  { name: bardeName, features: bardeFeatures, subclasses: bardeSubclasses },
  { name: clercName, features: clercFeatures, subclasses: clercSubclasses },
  { name: druideName, features: druideFeatures, subclasses: druideSubclasses },
  { name: ensorceleurName, features: [...ensorceleurFeatures, ...ensorceleurMetamagicFeatures], subclasses: ensorceleurSubclasses },
  { name: guerrierName, features: guerrierFeatures, subclasses: guerrierSubclasses },
  { name: moineName, features: moineFeatures, subclasses: moineSubclasses },
  { name: paladinName, features: paladinFeatures, subclasses: paladinSubclasses },
  { name: rodeurName, features: rodeurFeatures, subclasses: rodeurSubclasses },
  { name: roublardName, features: roublardFeatures, subclasses: roublardSubclasses },
]

export const CLASS_RESOURCE_EFFECT_TYPES = [
  'extra_attack', 'weapon_damage_dice', 'melee_strength_damage_bonus', 'resource_die',
  'resource_regain', 'slot_damage_dice', 'beast_shape', 'beast_shape_challenge',
]

const carriesResource = (f: FeatureDef) =>
  f.maxUsesFormula != null
  || f.meta?.resource != null
  || f.meta?.cost != null
  || (f.effects ?? []).some(e => CLASS_RESOURCE_EFFECT_TYPES.includes(e.type))

// Les features que le lot « ressources de classe » complète : leur seed est la source, la migration
// 0120 en est le pendant pour les bases déjà peuplées (test/nuxt/classResourcesMigration.test.ts).
export const classResourcePatches = (): ResourcePatch[] =>
  CLASSES.flatMap(c => [
    ...c.features.filter(carriesResource).map(feature => ({ className: c.name, subclass: null, feature })),
    ...c.subclasses.flatMap(s => s.features.filter(carriesResource).map(feature => ({ className: c.name, subclass: s.name, feature }))),
  ])

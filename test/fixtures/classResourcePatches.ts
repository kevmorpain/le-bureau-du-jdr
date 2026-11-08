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

export const CLASSES: { name: string, features: FeatureDef[], subclasses: SubclassDef[] }[] = [
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

// Capacités dont la migration 0157 pose le compteur ou le coût, avec leur recharge (test/fixtures/featureCounterPatches.ts).
// [classe, capacité] ; la sous-classe se retrouve dans les seeds.
export const COUNTER_PATCH_KEYS: readonly (readonly [string, string])[] = [
  ['Clerc', 'Intervention divine'], ['Clerc', 'Illumination protectrice'], ['Clerc', 'Prêtre de guerre'], ['Clerc', 'Fureur de l\'ouragan'],
  ['Clerc', 'Renvoi des morts-vivants'], ['Clerc', 'Conduit divin : Préservation de la vie'], ['Clerc', 'Conduit divin : Radiance de l\'aube'],
  ['Clerc', 'Conduit divin : Frappe guidée'], ['Clerc', 'Conduit divin : Bénédiction du dieu de la guerre'], ['Clerc', 'Conduit divin : Fureur destructrice'],
  ['Clerc', 'Conduit divin : Charme des animaux et des plantes'], ['Clerc', 'Conduit divin : Invocation de réplique'],
  ['Clerc', 'Conduit divin : Linceul d\'ombre'], ['Clerc', 'Conduit divin : Savoir ancestral'], ['Clerc', 'Conduit divin : Lecture des pensées'],
  ['Druide', 'Récupération naturelle'],
  ['Ensorceleur', 'Incantation'], ['Ensorceleur', 'Restauration ensorcelée'], ['Ensorceleur', 'Marée du chaos'],
  ['Barde', 'Source d\'inspiration'],
  ['Magicien', 'Restauration arcanique'], ['Magicien', 'Sorts de prédilection'], ['Magicien', 'Protection arcanique'], ['Magicien', 'Présage'],
  ['Magicien', 'Regard hypnotique'], ['Magicien', 'Charme instinctif'], ['Magicien', 'Surcharge magique'], ['Magicien', 'Double illusoire'],
  ['Moine', 'Plénitude physique'], ['Moine', 'Tranquillité'], ['Moine', 'Paume frémissante'], ['Moine', 'Arts des ombres'],
  ['Paladin', 'Sens divin'], ['Paladin', 'Contact purifiant'], ['Paladin', 'Nimbe sacré'], ['Paladin', 'Sentinelle immortelle'],
  ['Paladin', 'Champion antique'], ['Paladin', 'Ange de la vengeance'],
  ['Paladin', 'Conduit divin : Arme sacrée'], ['Paladin', 'Conduit divin : Renvoi des impies'], ['Paladin', 'Conduit divin : Courroux de la nature'],
  ['Paladin', 'Conduit divin : Renvoi des infidèles'], ['Paladin', 'Conduit divin : Conspuer l\'ennemi'], ['Paladin', 'Conduit divin : Vœu d\'hostilité'],
  ['Roublard', 'Coup de chance'], ['Roublard', 'Voleur de sort'], ['Roublard', 'Incantation'],
  ['Occultiste', 'Chance du ténébreux'], ['Occultiste', 'Traversée des enfers'], ['Occultiste', 'Présence féerique'],
  ['Occultiste', 'Échappatoire brumeuse'], ['Occultiste', 'Sombre délire'],
]

// Dépenses de ki que la migration 0157 ajoute à celles que la 0120 pose sur « Ki ».
export const LATER_KI_SPENDS = ['Âme de diamant', 'Vide immaculé', 'Projection astrale']

const isCounterPatch = (className: string, feature: FeatureDef) =>
  COUNTER_PATCH_KEYS.some(([c, name]) => c === className && name === feature.name)

const carriesResource = (className: string) => (f: FeatureDef) =>
  !isCounterPatch(className, f) && (
    f.maxUsesFormula != null
    || f.meta?.resource != null
    || f.meta?.cost != null
    || (f.effects ?? []).some(e => CLASS_RESOURCE_EFFECT_TYPES.includes(e.type)))

// Les features que le lot « ressources de classe » complète : leur seed est la source, la migration
// 0120 en est le pendant pour les bases déjà peuplées (test/nuxt/classResourcesMigration.test.ts).
// Les dés de supériorité et les manœuvres du Maître de guerre arrivent plus tard, par la migration 0151
// (test/nuxt/maneuversMigration.test.ts), les compteurs et coûts restants par la 0157
// (test/nuxt/featureCountersMigration.test.ts) et les disciplines de la Voie des quatre éléments par la 0158
// (test/nuxt/elementalDisciplinesMigration.test.ts).
const BATTLE_MASTER = 'Maître de guerre'
const FOUR_ELEMENTS = 'Voie des quatre éléments'

export const classResourcePatches = (): ResourcePatch[] =>
  CLASSES.flatMap(c => [
    ...c.features.filter(carriesResource(c.name)).map(feature => ({ className: c.name, subclass: null, feature })),
    ...c.subclasses
      .filter(s => s.name !== BATTLE_MASTER && s.name !== FOUR_ELEMENTS)
      .flatMap(s => s.features.filter(carriesResource(c.name)).map(feature => ({ className: c.name, subclass: s.name, feature }))),
  ])

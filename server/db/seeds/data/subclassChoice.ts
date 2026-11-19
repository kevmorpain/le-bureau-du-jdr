import type { FeatureDef } from '../lib/seedClass'
import { classesData } from './classes'
import { rulesetOf } from '../lib/rulesetOf'
import type { Ruleset } from '~~/shared/rules/ruleset'

// Source unique côté DONNÉES du choix de sous-classe : une feature owner par classe, à
// `classes.subclass_level`, portant la progression `kind:'subclass'`.

const SUBCLASS_CHOICE_FEATURE_NAMES_2014: Record<string, string> = {
  Barbare: 'Voie primitive',
  Barde: 'Collège bardique',
  Clerc: 'Domaine divin',
  Druide: 'Cercle druidique',
  Guerrier: 'Archétype martial',
  Magicien: 'Tradition arcanique',
  Moine: 'Tradition monastique',
  Paladin: 'Serment sacré',
  Rôdeur: 'Archétype de rôdeur',
  Roublard: 'Archétype de roublard',
  Ensorceleur: 'Origine magique',
  Occultiste: 'Protecteur d\'outre-monde',
}

export const SUBCLASS_CHOICE_FEATURE_NAMES: Record<Ruleset, Record<string, string>> = {
  5: SUBCLASS_CHOICE_FEATURE_NAMES_2014,
  5.5: {},
}

/** `throw` fail-fast si la classe est inconnue : mieux vaut casser le seed que seeder un orphelin. */
export function subclassChoiceFeature(className: string, ruleset: Ruleset): FeatureDef {
  const cls = classesData.find(c => c.name === className && rulesetOf(c) === ruleset)
  const name = SUBCLASS_CHOICE_FEATURE_NAMES[ruleset][className]
  if (!cls) throw new Error(`[subclassChoice] classe absente de classesData : "${className}" (${ruleset})`)
  if (!name) throw new Error(`[subclassChoice] nom de feature de sous-classe manquant : "${className}"`)

  return {
    name,
    description: `Au niveau ${cls.subclassLevel}, vous choisissez votre spécialisation (${name}). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.`,
    // `choice_carrier` : jamais matérialisé — la sous-classe choisie et ses features sont déjà rendues.
    featureType: 'choice_carrier',
    levelRequired: cls.subclassLevel,
    effects: [],
    progression: {
      kind: 'subclass',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'subclasses' },
      replaceable: false,
    },
  }
}

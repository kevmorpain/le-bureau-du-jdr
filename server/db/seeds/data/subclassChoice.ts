import type { FeatureDef } from '../lib/seedClass'
import { classesData } from './classes'

// Source unique côté DONNÉES du choix de sous-classe : une feature owner par classe, à
// `classes.subclass_level`, portant la progression `kind:'subclass'`.

export const SUBCLASS_CHOICE_FEATURE_NAMES: Record<string, string> = {
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

/** `throw` fail-fast si la classe est inconnue : mieux vaut casser le seed que seeder un orphelin. */
export function subclassChoiceFeature(className: string): FeatureDef {
  const cls = classesData.find(c => c.name === className)
  const name = SUBCLASS_CHOICE_FEATURE_NAMES[className]
  if (!cls) throw new Error(`[subclassChoice] classe absente de classesData : "${className}"`)
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

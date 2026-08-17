import type { FeatureDef } from '../lib/seedClass'
import { classesData } from './classes'

// ─────────────────────────────────────────────────────────────────────────────
// Choix de SOUS-CLASSE — point de choix `progression` commun à TOUTES les classes (F2).
//
// « Décision → choix » (rules-engine.md §3/§4) : le niveau d'accès à la sous-classe est un
// FAIT D'IDENTITÉ déjà porté par la colonne `classes.subclass_level` (migration 0080, contrat
// `test/fixtures/classIdentity.ts`) ; la DÉCISION « quelle sous-classe » est une `progression`
// `kind:'subclass'` portée par une feature owner (D4), résolue par `buildCatalog`
// (`optionSource:{subclasses}` → les sous-classes de la classe) puis `resolveChoices`.
//
// Jusqu'ici SEUL l'Occultiste (pacte/invocations/arcanum) et la lignée Elfe étaient pilotés par
// `progression` ; les 11 autres classes avaient leur choix de sous-classe **front-dupliqué**
// (`app/data/character-builder.ts`, cf. F2). Ce helper pose la source unique côté DONNÉES : une
// feature owner par classe, à `classes.subclass_level`, portant la même progression. Le front la
// lira ensuite via le catalogue (`loadClasses` expose déjà `subclassLevel` + `subclasses`) au lieu
// du blob — étape suivante de F2.
//
// Ce module n'a AUCUNE dépendance runtime `hub:db` (import de type seul) → testable en unit
// (`test/unit/subclassChoice.test.ts`, verrouillé contre `CLASS_IDENTITY`).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nom de la feature « choix de sous-classe » par classe (PHB FR 2014 / aidedd.org). C'est la
 * feature de classe qui, à `subclass_level`, ouvre le choix de la spécialisation.
 */
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

/**
 * FeatureDef owner du point de choix de sous-classe d'une classe. Le niveau vient de la source
 * unique `classesData` (`classes.subclass_level`) — jamais recopié ici. `throw` fail-fast si la
 * classe est inconnue (nom mal orthographié → on préfère casser le seed que seeder un orphelin).
 */
export function subclassChoiceFeature(className: string): FeatureDef {
  const cls = classesData.find(c => c.name === className)
  const name = SUBCLASS_CHOICE_FEATURE_NAMES[className]
  if (!cls) throw new Error(`[subclassChoice] classe absente de classesData : "${className}"`)
  if (!name) throw new Error(`[subclassChoice] nom de feature de sous-classe manquant : "${className}"`)

  return {
    name,
    description: `Au niveau ${cls.subclassLevel}, vous choisissez votre spécialisation (${name}). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.`,
    // `choice_carrier` (et non `class_feature`) : l'owner porte la progression pour le catalogue mais
    // n'est JAMAIS matérialisé sur la fiche — la sous-classe choisie + ses features sont déjà rendues
    // (option B, cf. schema/features.ts). Le sweep de matérialisation filtre `class_feature` → no-op ici.
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

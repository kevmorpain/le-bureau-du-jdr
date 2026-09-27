import type { AbilityKey } from './abilities'

// Convention : catégorie d'arme = token EN (`simple_weapons`/`martial_weapons`), arme précise = nom FR de l'item
// (comparé par nom) ; armures = tokens EN (`light`/`medium`/`heavy`/`shield`/`all_armor`) ; outils = nom du
// catalogue `shared/rules/tools.ts`.

export interface ClassProficiencies {
  savingThrows: AbilityKey[]
  armor: string[]
  weapon: string[]
  // Outils FIXES seulement (ligne « Outils » des pages de classe AideDD) : ceux AU CHOIX (Barde, Moine)
  // relèvent du ChoiceKind `tool`.
  tools: string[]
}

// Clé = nom de classe en base (`classes.name`), tel que passé à `seedClass`.
// `savingThrows` : les 2 JS maîtrisés (PHB 2014) — accordés par la 1re classe SEULEMENT (le multiclassage
// n'en donne pas), d'où une dérivation scopée à la classe principale (cf. deriveMainClassSavingThrows).
export const CLASS_PROFICIENCIES: Record<string, ClassProficiencies> = {
  Barbare: {
    savingThrows: ['str', 'con'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
  },
  Barde: {
    savingThrows: ['dex', 'cha'],
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    tools: [],
  },
  Clerc: {
    savingThrows: ['wis', 'cha'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons'],
    tools: [],
  },
  Druide: {
    savingThrows: ['int', 'wis'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['Gourdin', 'Dague', 'Fléchette', 'Javeline', 'Masse d\'armes', 'Bâton', 'Cimeterre', 'Fronde', 'Lance'],
    tools: ['Kit d\'herboriste'],
  },
  Guerrier: {
    savingThrows: ['str', 'con'],
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
  },
  Moine: {
    savingThrows: ['str', 'dex'],
    armor: [],
    weapon: ['simple_weapons', 'Épée courte'],
    tools: [],
  },
  Paladin: {
    savingThrows: ['wis', 'cha'],
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
  },
  Rôdeur: {
    savingThrows: ['str', 'dex'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
  },
  Roublard: {
    savingThrows: ['dex', 'int'],
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    tools: ['Outils de voleur'],
  },
  Ensorceleur: {
    savingThrows: ['con', 'cha'],
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    tools: [],
  },
  Occultiste: {
    savingThrows: ['wis', 'cha'],
    armor: ['light'],
    weapon: ['simple_weapons'],
    tools: [],
  },
  Magicien: {
    savingThrows: ['int', 'wis'],
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    tools: [],
  },
}

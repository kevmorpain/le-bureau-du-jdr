import type { AbilityKey } from './abilities'
import { TOOL_CATEGORIES } from './tools'

// Convention : catégorie d'arme = token EN (`simple_weapons`/`martial_weapons`), arme précise = nom FR de l'item
// (comparé par nom) ; armures = tokens EN (`light`/`medium`/`heavy`/`shield`/`all_armor`) ; outils = nom du
// catalogue `shared/rules/tools.ts`.

export interface ProficiencySet {
  armor: string[]
  weapon: string[]
  // Outils FIXES (ligne « Outils » des pages de classe AideDD).
  tools: string[]
  // Outils AU CHOIX (Barde, Moine) : point de choix `tool` sur le porteur.
  toolChoice?: { count: number, from: string[] }
}

export interface ClassProficiencies extends ProficiencySet {
  savingThrows: AbilityKey[]
  // Sous-ensemble reçu en REJOIGNANT la classe par multiclassage (AideDD, tableau des maîtrises du
  // multiclassage). La compétence éventuelle est `classes.multiclass_skill_count`.
  multiclass: ProficiencySet
}

// Clé = nom de classe en base (`classes.name`), tel que passé à `seedClass`. Source du SEED seulement : le front
// lit les porteurs en base via `/api/catalog/classes` (`proficiencies`), comme la fiche.
// `savingThrows` : les 2 JS maîtrisés (PHB 2014) — accordés par la 1re classe SEULEMENT (le multiclassage
// n'en donne pas), d'où une dérivation scopée à la classe principale (cf. deriveClassGrants).
export const CLASS_PROFICIENCIES: Record<string, ClassProficiencies> = {
  Barbare: {
    savingThrows: ['str', 'con'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
    multiclass: { armor: ['shield'], weapon: ['simple_weapons', 'martial_weapons'], tools: [] },
  },
  Barde: {
    savingThrows: ['dex', 'cha'],
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    tools: [],
    toolChoice: { count: 3, from: TOOL_CATEGORIES['Instruments de musique']! },
    multiclass: { armor: ['light'], weapon: [], tools: [], toolChoice: { count: 1, from: TOOL_CATEGORIES['Instruments de musique']! } },
  },
  Clerc: {
    savingThrows: ['wis', 'cha'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons'],
    tools: [],
    multiclass: { armor: ['light', 'medium', 'shield'], weapon: [], tools: [] },
  },
  Druide: {
    savingThrows: ['int', 'wis'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['Gourdin', 'Dague', 'Fléchette', 'Javeline', 'Masse d\'armes', 'Bâton', 'Cimeterre', 'Fronde', 'Lance'],
    tools: ['Kit d\'herboriste'],
    multiclass: { armor: ['light', 'medium', 'shield'], weapon: [], tools: [] },
  },
  Guerrier: {
    savingThrows: ['str', 'con'],
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
    multiclass: { armor: ['light', 'medium', 'shield'], weapon: ['simple_weapons', 'martial_weapons'], tools: [] },
  },
  Moine: {
    savingThrows: ['str', 'dex'],
    armor: [],
    weapon: ['simple_weapons', 'Épée courte'],
    tools: [],
    toolChoice: { count: 1, from: [...TOOL_CATEGORIES['Outils d\'artisan']!, ...TOOL_CATEGORIES['Instruments de musique']!] },
    multiclass: { armor: [], weapon: ['simple_weapons', 'Épée courte'], tools: [] },
  },
  Paladin: {
    savingThrows: ['wis', 'cha'],
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
    multiclass: { armor: ['light', 'medium', 'shield'], weapon: ['simple_weapons', 'martial_weapons'], tools: [] },
  },
  Rôdeur: {
    savingThrows: ['str', 'dex'],
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
    tools: [],
    multiclass: { armor: ['light', 'medium', 'shield'], weapon: ['simple_weapons', 'martial_weapons'], tools: [] },
  },
  Roublard: {
    savingThrows: ['dex', 'int'],
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    tools: ['Outils de voleur'],
    multiclass: { armor: ['light'], weapon: [], tools: ['Outils de voleur'] },
  },
  Ensorceleur: {
    savingThrows: ['con', 'cha'],
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    tools: [],
    multiclass: { armor: [], weapon: [], tools: [] },
  },
  Occultiste: {
    savingThrows: ['wis', 'cha'],
    armor: ['light'],
    weapon: ['simple_weapons'],
    tools: [],
    multiclass: { armor: ['light'], weapon: ['simple_weapons'], tools: [] },
  },
  Magicien: {
    savingThrows: ['int', 'wis'],
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    tools: [],
    multiclass: { armor: [], weapon: [], tools: [] },
  },
}

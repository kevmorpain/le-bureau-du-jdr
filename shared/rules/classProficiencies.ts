// Convention : catégorie d'arme = token EN (`simple_weapons`/`martial_weapons`), arme précise = nom FR de l'item
// (comparé par nom) ; armures = tokens EN (`light`/`medium`/`heavy`/`shield`/`all_armor`).

export interface ClassProficiencies {
  armor: string[]
  weapon: string[]
}

// Clé = nom de classe en base (`classes.name`), tel que passé à `seedClass`.
export const CLASS_PROFICIENCIES: Record<string, ClassProficiencies> = {
  Barbare: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
  },
  Barde: {
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
  },
  Clerc: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons'],
  },
  Druide: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['Gourdin', 'Dague', 'Fléchette', 'Javeline', 'Masse d\'armes', 'Bâton', 'Cimeterre', 'Fronde', 'Lance'],
  },
  Guerrier: {
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
  },
  Moine: {
    armor: [],
    weapon: ['simple_weapons', 'Épée courte'],
  },
  Paladin: {
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
  },
  Rôdeur: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
  },
  Roublard: {
    armor: ['light'],
    weapon: ['simple_weapons', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
  },
  Ensorceleur: {
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
  },
  Occultiste: {
    armor: ['light'],
    weapon: ['simple_weapons'],
  },
  Magicien: {
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
  },
}

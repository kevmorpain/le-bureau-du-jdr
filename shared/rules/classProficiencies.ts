// Maîtrises d'armes et d'armures de BASE par classe (D&D 5e 2014) — source unique
// (patron `abilities.ts` / `ruleset.ts`, decisions.md D6). Node-safe (aucun import).
//
// Volet B (dérivation des maîtrises depuis l'origine) : ces valeurs vivaient jusqu'ici dans le
// BLOB front `app/data/character-builder.ts` (`ClassData.armorProficiencies`/`weaponProficiencies`,
// en libellés FR), mappées à la volée en clés machine par le builder
// (`ARMOR_PROF_KEYS[p] ?? p` / `WEAPON_PROF_KEYS[p] ?? p`) puis STOCKÉES en grants
// `character_proficiency_overrides`. On les descend ici pour les poser en EFFETS sur une feature
// porteuse de classe (seedClass → feature_type `proficiency_grant`), afin que la fiche les DÉRIVE.
//
// CONVENTION (normalisée, cf. volet B étape 1) : la fiche reconnaît une maîtrise d'ARME par
//   - CATÉGORIE → token machine EN (`simple_weapons`/`martial_weapons`), comparé à `weapon_category`,
//     affiché en FR via `weaponProficiencyLabels` ;
//   - ARME PRÉCISE → **nom FR de l'item** (`item.name`), comparé par nom (`useCharacterInventory`).
// De même les ARMURES sont des tokens EN (`light`/`medium`/`heavy`/`shield`/`all_armor`), comparés à
// `armor_type` et affichés en FR via `armorTypeLabels`.
//
// ⚠️ On CORRIGE ici 3 défauts du mapping historique du builder (qui mappait certaines armes précises
// en clé EN — `longsword`/`rapier`/`shortsword`/`hand_crossbow`/`light_crossbow` — qui ne matchaient
// AUCUN item FR et s'affichaient en anglais sur la fiche) : les armes précises sont désormais en FR
// (Barde/Roublard/Moine/Ensorceleur/Magicien), et « Masse » (Druide) devient « Masse d'armes » (le
// vrai nom de l'item). Divergence assumée vs les grants stockés actuels — l'équivalence
// (test/nuxt/classProficienciesFront.test.ts) vérifie « == cible corrigée », pas la copie verbatim.

export interface ClassProficiencies {
  /** Maîtrises d'armure — effet `{ type: 'proficiency', value }`. Tokens EN. */
  armor: string[]
  /**
   * Maîtrises d'arme — effet `{ type: 'weapon_proficiency', value }`. Catégorie = token EN
   * (`simple_weapons`/`martial_weapons`) ; arme précise = nom FR de l'item.
   */
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

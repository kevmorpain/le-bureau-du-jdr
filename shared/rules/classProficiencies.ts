// Maîtrises d'armes et d'armures de BASE par classe (D&D 5e 2014) — source unique
// (patron `abilities.ts` / `ruleset.ts`, decisions.md D6). Node-safe (aucun import).
//
// Volet B (dérivation des maîtrises depuis l'origine) : ces valeurs vivaient jusqu'ici dans le
// BLOB front `app/data/character-builder.ts` (`ClassData.armorProficiencies`/`weaponProficiencies`,
// en libellés FR), mappées à la volée en clés machine par le builder
// (`ARMOR_PROF_KEYS[p] ?? p` / `WEAPON_PROF_KEYS[p] ?? p`) puis STOCKÉES en grants
// `character_proficiency_overrides`. On les descend ici en clés machine pour les poser en EFFETS
// sur une feature porteuse de classe (seedClass → feature_type `proficiency_grant`), afin que la
// fiche les DÉRIVE (comme l'espèce) au lieu de les matérialiser.
//
// ⚠️ ÉQUIVALENCE (test/nuxt/classProficienciesFront.test.ts) : pour chaque classe, l'ensemble
// ci-dessous doit être EXACTEMENT `new Set(blob.map(p => KEYS[p] ?? p))`. On reproduit donc
// verbatim les quirks pré-existants du blob — SANS les corriger dans ce volet :
//   - Druide / Ensorceleur / Magicien portent des noms d'armes FR bruts (non mappés en clé
//     machine par le builder) ; « Masse » (≠ l'item « Masse d'armes ») en est un.
//   - Moine / Ensorceleur / Magicien n'ont aucune maîtrise d'armure.
//
// Clés machine : armes → catégories (`simple_weapons`/`martial_weapons`) ou clé d'arme précise
// (`longsword`, `hand_crossbow`, `light_crossbow`, …) ou nom FR brut ; armures →
// `light`/`medium`/`all_armor`/`shield` (consommées par `useCharacterInventory.armorProficiencies`).

export interface ClassProficiencies {
  /** Maîtrises d'armure — effet `{ type: 'proficiency', value }`. */
  armor: string[]
  /** Maîtrises d'arme — effet `{ type: 'weapon_proficiency', value }`. */
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
    weapon: ['simple_weapons', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
  },
  Clerc: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['simple_weapons'],
  },
  Druide: {
    armor: ['light', 'medium', 'shield'],
    weapon: ['Gourdin', 'Dague', 'Fléchette', 'Javeline', 'Masse', 'Bâton', 'Cimeterre', 'Fronde', 'Lance'],
  },
  Guerrier: {
    armor: ['all_armor', 'shield'],
    weapon: ['simple_weapons', 'martial_weapons'],
  },
  Moine: {
    armor: [],
    weapon: ['simple_weapons', 'shortsword'],
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
    weapon: ['simple_weapons', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
  },
  Ensorceleur: {
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'light_crossbow'],
  },
  Occultiste: {
    armor: ['light'],
    weapon: ['simple_weapons'],
  },
  Magicien: {
    armor: [],
    weapon: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'light_crossbow'],
  },
}

/**
 * Correspondance canonique **slug de classe → nom en base** (cf. decisions.md D6).
 *
 * Aujourd'hui cette table est dupliquée FRONT-ONLY dans `app/data/character-builder.ts`
 * (`CLASS_DB_NAMES`), et il n'existe PAS de colonne `classes.slug`. Le loader du catalogue
 * (`server/utils/catalog.ts`, lot 5b) en a besoin CÔTÉ SERVEUR pour résoudre
 * `optionSource:{type:'spells', spellClass}` — le `spellClass` est un slug (ex. `'warlock'`)
 * qu'il faut mapper vers la classe en base (« Occultiste ») pour lister ses sorts.
 *
 * Source unique : le front pointera ici au point 6 (au lieu de sa copie locale). Node-safe :
 * const pure, aucun import → importable par le projet vitest `unit`.
 */
export const CLASS_DB_NAMES = {
  barbarian: 'Barbare',
  bard: 'Barde',
  cleric: 'Clerc',
  druid: 'Druide',
  fighter: 'Guerrier',
  monk: 'Moine',
  paladin: 'Paladin',
  ranger: 'Rôdeur',
  rogue: 'Roublard',
  sorcerer: 'Ensorceleur',
  warlock: 'Occultiste',
  wizard: 'Magicien',
} as const satisfies Record<string, string>

/** Union dérivée des slugs de classe connus. */
export type ClassSlug = keyof typeof CLASS_DB_NAMES

/** Nom en base d'une classe à partir de son slug (undefined si slug inconnu). */
export function classNameFromSlug(slug: string): string | undefined {
  return (CLASS_DB_NAMES as Record<string, string>)[slug]
}

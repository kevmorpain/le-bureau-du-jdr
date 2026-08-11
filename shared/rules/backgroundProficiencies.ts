// Séparation FIXE vs AU CHOIX des maîtrises d'historique (outils / langues) — source unique du
// critère (node-safe, aucun import). Volet B.
//
// Un historique 2014 stocke ses outils/langues en colonnes JSON (`backgrounds.tool_proficiencies`/
// `language_proficiencies`). Certaines entrées sont FIXES (« Kit de déguisement », « Outils de
// voleur »…) → dérivables de l'origine ; d'autres sont des PLACEHOLDERS de choix (« Jeux au choix
// ×1 », « Instrument de musique au choix », « Au choix ×2 ») → le joueur les résout (deltas
// stockés), jamais dérivés.
//
// Ce critère est partagé entre le SEED (émet les fixes en effets `tool_proficiency`/
// `language_proficiency` sur `background_features`, volet B étape 2) et `createCharacter` (matérialise
// les mêmes fixes en grants) → l'ensemble DÉRIVÉ == l'ensemble STOCKÉ, garantissant l'inertie.

/** `true` si l'entrée est un placeholder « au choix » (à résoudre par le joueur), pas une maîtrise fixe. */
export function isChoiceProficiency(entry: string): boolean {
  return entry.toLowerCase().includes('choix') || entry.includes('×')
}

/** Ne garde que les maîtrises FIXES (exclut les placeholders « au choix »). */
export function fixedProficiencies(entries: string[]): string[] {
  return entries.filter(e => !isChoiceProficiency(e))
}

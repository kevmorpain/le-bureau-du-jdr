/**
 * Helpers de calcul PURS D&D 5e (2014) — **source unique** (cf. decisions.md D6).
 *
 * Formules mécaniques sans état ni dépendance : bonus de maîtrise, modificateur de
 * caractéristique, formatage signé, points de vie moyens par niveau. Étaient définies front-only
 * dans `app/data/character-builder.ts` (dédup point 6c-3) ; le front les ré-exporte désormais sous
 * leurs noms historiques.
 *
 * Module node-safe (aucun import) : importable par le projet vitest `unit` et par le serveur.
 */

/** Bonus de maîtrise à un niveau donné (PHB 2014 : +2 aux niv. 1–4, +3 aux 5–8, …, +6 aux 17–20). */
export function profBonusAtLevel(level: number): number {
  return Math.ceil(level / 4) + 1
}

/** Modificateur de caractéristique à partir d'un score (⌊(score − 10) / 2⌋). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Formate un modificateur avec son signe (`+3`, `0`, `-1`). */
export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

/** PV « moyens fixes » : max au niv. 1, puis (⌈dé/2⌉ + 1 + mod CON) par niveau suivant. */
export function hpAtLevel(hitDie: number, level: number, conMod: number): number {
  if (level <= 0) return 0
  const firstLevel = hitDie + conMod
  const additionalLevels = (level - 1) * (Math.ceil(hitDie / 2) + 1 + conMod)
  return firstLevel + additionalLevels
}

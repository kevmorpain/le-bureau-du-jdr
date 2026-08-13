import type { Ruleset } from '~~/shared/rules/ruleset'

/**
 * Édition d'une ligne de données de seed — défaut `'5'` (2014). Les données 2014 actuelles
 * n'ont pas de champ `ruleset` (→ `'5'`) ; une entrée 5.5 le portera explicitement (`ruleset: '5.5'`).
 * SOURCE UNIQUE de la clé d'édition côté seed : tous les upserts de catalogue keyent par
 * `(name, rulesetOf(row))` pour que du contenu 5.5 homonyme (« Magicien », « Boule de feu »…)
 * INSÈRE une ligne distincte au lieu d'écraser la 2014 (cf. D2, cohabitation par édition).
 *
 * Générique `<T extends object>` : le paramètre est `T & { ruleset?: Ruleset }`, donc une ligne de
 * données 2014 (sans le champ) reste assignable SANS déclencher TS2559 « no properties in common »
 * (que provoquerait un paramètre 100 % optionnel `{ ruleset?: Ruleset }`) — aucun cast ni changement
 * des types de données existants.
 */
export const rulesetOf = <T extends object>(row: T & { ruleset?: Ruleset }): Ruleset => row.ruleset ?? '5'

/**
 * Clé de dédup `(name, ruleset)` pour les seeds qui préchargent l'existant dans une Map (ex.
 * `spells.ts`, contraint par la limite de requêtes D1). `JSON.stringify([name, ruleset])` = clé
 * anti-collision par construction (l'échappement JSON gère n'importe quel nom). Deux éditions
 * homonymes ⇒ deux clés ⇒ deux lignes (jamais un écrasement de la 2014).
 */
export const nameRulesetKey = <T extends { name: string }>(row: T & { ruleset?: Ruleset }): string =>
  JSON.stringify([row.name, rulesetOf(row)])

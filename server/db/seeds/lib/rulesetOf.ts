import type { Ruleset } from '~~/shared/rules/ruleset'

/**
 * Édition d'une ligne de seed — défaut `'5'` (2014). Tous les upserts de catalogue keyent par
 * `(name, rulesetOf(row))` pour qu'un contenu 5.5 homonyme INSÈRE une ligne au lieu d'écraser la 2014 (D2).
 */
export const rulesetOf = <T extends object>(row: T & { ruleset?: Ruleset }): Ruleset => row.ruleset ?? '5'

/** Clé de dédup `(name, ruleset)` pour les seeds qui préchargent l'existant dans une Map (limite D1). */
export const nameRulesetKey = <T extends { name: string }>(row: T & { ruleset?: Ruleset }): string =>
  JSON.stringify([row.name, rulesetOf(row)])

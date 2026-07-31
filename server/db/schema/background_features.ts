import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import backgrounds from './backgrounds'
import features from './features'

/**
 * `background_features` — jointure historique ⇄ feature, calquée sur `species_features`.
 * Aligne les historiques sur le pattern espèce/classe (cf. rules-engine.md §6,
 * decisions.md D3) : un historique POSSÈDE des features (via cette jointure), qui
 * portent effects (grants) et/ou une `progression` (points de choix — dont la triade de
 * caractéristiques 5.5, `kind:'ability_scores'`). Owner d'un point de choix = une feature
 * de l'historique (D4).
 *
 * Schéma d'abord (lot 4d) : la table est posée mais AUCUNE donnée n'est seedée. Le
 * contenu 5.5 (features d'historique + triade + don d'origine) arrive en Phase 2, quand
 * le discriminant `ruleset` (D2) permettra de distinguer un historique 2024 de son
 * homonyme 2014 (Soldat, Sage, Acolyte…).
 *
 * Pas de `relations()` volontairement (même choix qu'en 4c pour progression/character_choices) :
 * rien ne l'interroge encore (le câblage est au point 5/6) et déclarer une relation neuve
 * peut faire planter l'init de `hub:db` (`referencedTable`, cf. CLAUDE.md). La résolution
 * la lira via `.select().from()`.
 */
const backgroundFeatures = sqliteTable(
  'background_features',
  {
    backgroundId: integer('background_id').notNull().references(() => backgrounds.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.backgroundId, table.featureId] })],
)

export default backgroundFeatures

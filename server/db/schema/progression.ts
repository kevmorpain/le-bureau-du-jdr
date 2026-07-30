import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Formula } from '~~/shared/utils/formula'
import type { ChoiceKind, OptionSource } from '~~/shared/rules/choices'
import features from './features'

/**
 * `progression` — la RÉFÉRENCE d'un point de choix : quoi (`kind`), combien (`count`),
 * parmi quoi (`optionSource`), échangeable ou non (`replaceable`). Owner = une
 * `feature` ([D4](../../../docs/decisions.md#d4)) qui porte déjà niveau / classe /
 * ruleset. Une seule source ; builder et level-up la liront (rules-engine.md §4).
 *
 * Pas de `relations()` ici volontairement : rien ne l'interroge encore (le câblage est
 * au point 5/6), et déclarer une relation neuve peut faire planter l'init de `hub:db`
 * (`referencedTable`, cf. CLAUDE.md). La résolution la lira via `.select().from()`.
 */
const progression = sqliteTable(
  'progression',
  {
    id: integer().primaryKey().notNull(),
    // Feature propriétaire du point de choix. Cascade : supprimer la feature retire
    // son point de choix (et, via character_choices, les picks qui s'y rattachent).
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<ChoiceKind>().notNull(),
    // Combien de picks à ce point de choix. JSON<Formula> (shared/utils/formula.ts) ;
    // op `lookup` = table indexée par (class_level - 1). ⚠️ En multiclasse, le contexte
    // de la formule doit utiliser le niveau de la classe PROPRIÉTAIRE (rules-engine.md §4).
    count: text('count', { mode: 'json' }).$type<Formula>().notNull(),
    optionSource: text('option_source', { mode: 'json' }).$type<OptionSource>().notNull(),
    // ex. : une invocation peut être remplacée par une autre à la montée de niveau.
    replaceable: integer('replaceable', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  table => [
    index('progression_feature_id_idx').on(table.featureId),
  ],
)

export default progression

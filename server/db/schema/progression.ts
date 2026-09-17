import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Formula } from '~~/shared/utils/formula'
import type { ChoiceKind, OptionSource } from '~~/shared/rules/choices'
import features from './features'

// Référence d'un point de choix ; owner = une `feature` (D4). Pas de `relations()` : déclarer une
// relation neuve peut faire planter l'init du cache `hub:db` (cf. CLAUDE.md).
const progression = sqliteTable(
  'progression',
  {
    id: integer().primaryKey().notNull(),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<ChoiceKind>().notNull(),
    // ⚠️ En multiclasse, la formule doit être évaluée au niveau de la classe PROPRIÉTAIRE.
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

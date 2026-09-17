import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import backgrounds from './backgrounds'
import features from './features'

// Jointure historique ⇄ feature, calquée sur `species_features`. Pas de `relations()` : déclarer une
// relation neuve peut faire planter l'init du cache `hub:db` (`referencedTable`, cf. CLAUDE.md).
const backgroundFeatures = sqliteTable(
  'background_features',
  {
    backgroundId: integer('background_id').notNull().references(() => backgrounds.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.backgroundId, table.featureId] })],
)

export default backgroundFeatures

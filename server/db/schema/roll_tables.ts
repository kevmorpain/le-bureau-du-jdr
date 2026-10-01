import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { RollTableEntry, RollTableKey } from '~~/shared/rules/rollTables'

// Les entrées sont toujours lues en entier et dans l'ordre : une colonne JSON plutôt qu'une ligne par
// entrée, qui coûterait une requête D1 de seed chacune.
const rollTables = sqliteTable(
  'roll_tables',
  {
    id: integer().primaryKey().notNull(),
    key: text('key').$type<RollTableKey>().notNull(),
    ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
    name: text('name').notNull(),
    die: integer('die').notNull(),
    entries: text('entries', { mode: 'json' }).$type<RollTableEntry[]>().notNull(),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  table => [uniqueIndex('roll_tables_key_ruleset_idx').on(table.key, table.ruleset)],
)

export default rollTables

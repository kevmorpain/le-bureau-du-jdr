import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Source } from '~~/shared/rules/source'
import characterSpecies from './character_species'

// Variante d'une espèce de base (sous-race 2014 / lignée 2024) — symétrique de `subclasses` (D17).
// Pas de colonne `ruleset` : parent-gated par l'espèce. Pas de `relations()` (init du cache `hub:db`).
const speciesLineages = sqliteTable('species_lineages', {
  id: integer().primaryKey().notNull(),
  speciesId: integer('species_id').notNull().references(() => characterSpecies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  // PAS parent-gated (contrairement au ruleset) : une lignée d'extension peut vivre sur une espèce socle.
  source: text('source').$type<Source>().notNull().default('core'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export default speciesLineages

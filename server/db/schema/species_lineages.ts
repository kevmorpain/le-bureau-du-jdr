import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import characterSpecies from './character_species'

/**
 * `species_lineages` — variante d'une espèce de base : sous-race 2014 (Haut-elfe, Nain
 * des montagnes…) ou lignée 2024 (Drow, Haut-elfe…). **Symétrique de `subclasses`** pour
 * les classes (cf. decisions.md D17) : la base (`character_species`) porte les traits
 * communs via `species_features` ; la lignée porte SES features via `features.lineage_id`
 * (gated par `levelRequired`, ex. sorts drow niv.1/3/5) ; le choix d'une lignée passe par
 * `progression` + `character_choices.selected_lineage_id`, comme le choix de sous-classe.
 *
 * Pas de colonne `ruleset` : une lignée est rattachée par FK à une espèce — elle-même
 * datée par son `ruleset` —, donc **parent-gated**, exactement comme `subclasses` l'est par
 * sa classe (cf. shared/rules/ruleset.ts). Pas de `relations()` (calqué sur
 * `background_features`, lot 4c) : évite le crash d'init du cache `hub:db` sur une table
 * neuve (`referencedTable`) ; la résolution se fait par `.select()` explicite.
 */
const speciesLineages = sqliteTable('species_lineages', {
  id: integer().primaryKey().notNull(),
  speciesId: integer('species_id').notNull().references(() => characterSpecies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export default speciesLineages

-- Lot 1 du chantier « lignée » (cf. docs/decisions.md D17) : espèce = base + lignée,
-- sous-entité SYMÉTRIQUE de la sous-classe, unifiée 2014/2024.
--
-- SCHÉMA SEUL, additif (D9/D13) : aucune donnée, aucun re-seed. La restructuration des
-- données (Elfe base + lignées) et la migration des fiches vivantes viennent aux lots
-- suivants, sous tests d'équivalence (D12). Auto-suffisante.
--
--   `species_lineages`  ~ `subclasses` (FK vers l'espèce de base, cascade).
--   `features.lineage_id` ~ `features.subclass_id` : la feature d'une lignée
--                          (`feature_type='lineage_feature'`) pointe sa lignée ; nullable
--                          (set null), la plupart des features n'en ont pas.
--   `character_choices.selected_lineage_id` ~ `selected_subclass_id` : le pick de lignée,
--                          ajouté à l'index d'unicité (idempotence d'un choix, cf. 0082).
--
-- Pas de colonne `ruleset` sur `species_lineages` : parent-gated par l'espèce (elle-même
-- datée), comme `subclasses` par sa classe.

CREATE TABLE `species_lineages` (
	`id` integer PRIMARY KEY NOT NULL,
	`species_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`species_id`) REFERENCES `character_species`(`id`) ON UPDATE no action ON DELETE cascade
);

ALTER TABLE `features` ADD COLUMN `lineage_id` integer REFERENCES species_lineages(id) ON DELETE set null;

CREATE INDEX `features_lineage_id_idx` ON `features` (`lineage_id`);

ALTER TABLE `character_choices` ADD COLUMN `selected_lineage_id` integer REFERENCES species_lineages(id) ON DELETE cascade;

-- On recrée l'index d'unicité `character_choices_unique` (0082) en y incluant
-- `selected_lineage_id`, par COHÉRENCE avec les autres colonnes `selected_*` qu'il couvre
-- déjà : l'index reste le miroir exact de l'ensemble des colonnes de sélection. (Comme pour
-- les autres `selected_*`, il ne bloque que les doublons EXACTS : SQLite traite les NULL
-- comme distincts, donc l'idempotence d'un pick simple relève de la couche applicative.)
DROP INDEX `character_choices_unique`;

CREATE UNIQUE INDEX `character_choices_unique` ON `character_choices` (`character_sheet_id`,`progression_id`,`selected_subclass_id`,`selected_lineage_id`,`selected_feature_id`,`selected_spell_id`,`selected_ability_id`,`selected_value`);

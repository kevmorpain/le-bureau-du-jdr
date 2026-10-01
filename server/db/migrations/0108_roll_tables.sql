-- Tables à lancer (Pic de magie sauvage d100…), consultables depuis la fiche via les capacités qui y
-- renvoient. Une table est partagée : Pic de magie sauvage, Marée du chaos et Chaos contrôlé pointent
-- la même.
--
-- SCHÉMA SEUL, additif (D13) : le contenu vient du seed `rollTables`, puis le seed de classe pose
-- `features.roll_table_id`. Tant qu'ils n'ont pas tourné, la colonne reste NULL et la fiche n'affiche
-- simplement pas de bouton. Jamais BEGIN (D1).

CREATE TABLE `roll_tables` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`ruleset` text DEFAULT '5' NOT NULL,
	`name` text NOT NULL,
	`die` integer NOT NULL,
	`entries` text NOT NULL,
	`created_at` text,
	`updated_at` text
);

CREATE UNIQUE INDEX `roll_tables_key_ruleset_idx` ON `roll_tables` (`key`,`ruleset`);

ALTER TABLE `features` ADD COLUMN `roll_table_id` integer REFERENCES roll_tables(id) ON DELETE set null;

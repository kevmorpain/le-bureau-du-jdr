-- Lot 0 — Fondations du support D&D 5.5 (2024). Voir docs/dnd-5.5.md.
--
-- Introduit le discriminant `ruleset` ('5' = D&D 2014, '5.5' = D&D 2024) qui
-- permet aux deux systèmes de coexister :
--   - `character_sheets` : version de règles figée par personnage.
--   - `character_species` / `classes` / `backgrounds` : deux lignes homonymes
--     (ex. « Elfe » 2014 vs 2024) coexistent comme des entités distinctes, ce
--     qui supprime le matching de nom fragile entre le front et la DB.
--
-- `ADD COLUMN ... NOT NULL DEFAULT '5'` backfille automatiquement toutes les
-- lignes existantes en '5' (SQLite) : les fiches et le catalogue actuels sont
-- donc du 2014 sans action supplémentaire. Les seeds 5.5 poseront '5.5'
-- explicitement.

ALTER TABLE `character_sheets` ADD `ruleset` text DEFAULT '5' NOT NULL;
--> statement-breakpoint
ALTER TABLE `character_species` ADD `ruleset` text DEFAULT '5' NOT NULL;
--> statement-breakpoint
ALTER TABLE `classes` ADD `ruleset` text DEFAULT '5' NOT NULL;
--> statement-breakpoint
ALTER TABLE `backgrounds` ADD `ruleset` text DEFAULT '5' NOT NULL;

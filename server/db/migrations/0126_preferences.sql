-- Préférences (D18) : JSON `{ <clé>?: boolean }` sur la fiche et sur le compte. NULL = « hérite » : jamais de DEFAULT,
-- les fiches existantes héritent donc des défauts du compte sans backfill. AUTO-SUFFISANTE : aucun reseed.
ALTER TABLE `character_sheets` ADD COLUMN `preferences` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `preferences` text;

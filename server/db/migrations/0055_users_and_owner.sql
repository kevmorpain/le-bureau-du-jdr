-- Authentification : table des comptes utilisateurs (OAuth Discord/Google) et
-- rattachement des fiches à leur propriétaire. `owner_id` est nullable pour
-- permettre le backfill manuel des fiches existantes (cf. plan §6) ; toute
-- nouvelle fiche pose toujours l'owner côté endpoint POST.

CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text,
	`name` text NOT NULL,
	`avatar` text,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_provider_identity` ON `users` (`provider`,`provider_user_id`);
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `owner_id` integer REFERENCES users(id);
--> statement-breakpoint
CREATE INDEX `idx_character_sheets_owner` ON `character_sheets` (`owner_id`);

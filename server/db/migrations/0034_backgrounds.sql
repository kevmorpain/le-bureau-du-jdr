CREATE TABLE `backgrounds` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`skill_proficiencies` text DEFAULT '[]' NOT NULL,
	`tool_proficiencies` text DEFAULT '[]' NOT NULL,
	`language_proficiencies` text DEFAULT '[]' NOT NULL,
	`feature_name` text DEFAULT '' NOT NULL,
	`feature_description` text DEFAULT '' NOT NULL,
	`character_sheet_id` integer
);
--> statement-breakpoint
ALTER TABLE `character_sheets` DROP COLUMN `background`;
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `background_id` integer REFERENCES backgrounds(id);
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `personality_traits` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `ideals` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `bonds` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `flaws` text DEFAULT '' NOT NULL;

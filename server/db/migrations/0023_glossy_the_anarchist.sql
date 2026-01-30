CREATE TABLE `effects` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`value` text DEFAULT (json_array())
);
--> statement-breakpoint
CREATE TABLE `species_traits` (
	`species_id` integer NOT NULL,
	`trait_id` integer NOT NULL,
	PRIMARY KEY(`species_id`, `trait_id`),
	FOREIGN KEY (`species_id`) REFERENCES `character_species`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trait_id`) REFERENCES `traits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trait_effects` (
	`trait_id` integer NOT NULL,
	`effect_id` integer NOT NULL,
	PRIMARY KEY(`trait_id`, `effect_id`),
	FOREIGN KEY (`trait_id`) REFERENCES `traits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`effect_id`) REFERENCES `effects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `traits` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text
);
--> statement-breakpoint
ALTER TABLE `character_species` DROP COLUMN `traits`;
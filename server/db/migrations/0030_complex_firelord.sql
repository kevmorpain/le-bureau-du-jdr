ALTER TABLE `trait_effects` RENAME TO `feature_effects`;--> statement-breakpoint
ALTER TABLE `traits` RENAME TO `features`;--> statement-breakpoint
ALTER TABLE `species_traits` RENAME TO `species_features`;--> statement-breakpoint
ALTER TABLE `feature_effects` RENAME COLUMN "trait_id" TO "feature_id";--> statement-breakpoint
ALTER TABLE `species_features` RENAME COLUMN "trait_id" TO "feature_id";--> statement-breakpoint
CREATE TABLE `character_features` (
	`character_sheet_id` integer NOT NULL,
	`feature_id` integer NOT NULL,
	`current_uses` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `feature_id`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subclasses` (
	`id` integer PRIMARY KEY NOT NULL,
	`class_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_feature_effects` (
	`feature_id` integer NOT NULL,
	`effect_id` integer NOT NULL,
	PRIMARY KEY(`feature_id`, `effect_id`),
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`effect_id`) REFERENCES `effects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feature_effects`("feature_id", "effect_id") SELECT "feature_id", "effect_id" FROM `feature_effects`;--> statement-breakpoint
DROP TABLE `feature_effects`;--> statement-breakpoint
ALTER TABLE `__new_feature_effects` RENAME TO `feature_effects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `features` ADD `feature_type` text NOT NULL DEFAULT 'species_trait';--> statement-breakpoint
ALTER TABLE `features` ADD `class_id` integer REFERENCES classes(id);--> statement-breakpoint
ALTER TABLE `features` ADD `subclass_id` integer REFERENCES subclasses(id);--> statement-breakpoint
ALTER TABLE `features` ADD `level_required` integer;--> statement-breakpoint
ALTER TABLE `features` ADD `action_type` text;--> statement-breakpoint
ALTER TABLE `features` ADD `max_uses_formula` text;--> statement-breakpoint
ALTER TABLE `features` ADD `recharge_type` text;--> statement-breakpoint
CREATE TABLE `__new_species_features` (
	`species_id` integer NOT NULL,
	`feature_id` integer NOT NULL,
	PRIMARY KEY(`species_id`, `feature_id`),
	FOREIGN KEY (`species_id`) REFERENCES `character_species`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_species_features`("species_id", "feature_id") SELECT "species_id", "feature_id" FROM `species_features`;--> statement-breakpoint
DROP TABLE `species_features`;--> statement-breakpoint
ALTER TABLE `__new_species_features` RENAME TO `species_features`;
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_character_ability_scores` (
	`character_sheet_id` integer NOT NULL,
	`ability_id` text NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `ability_id`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ability_id`) REFERENCES `ability_scores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_character_ability_scores`("character_sheet_id", "ability_id", "value") SELECT "character_sheet_id", "ability_id", "value" FROM `character_ability_scores`;--> statement-breakpoint
DROP TABLE `character_ability_scores`;--> statement-breakpoint
ALTER TABLE `__new_character_ability_scores` RENAME TO `character_ability_scores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
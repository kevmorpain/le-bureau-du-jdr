CREATE TABLE `character_ability_scores` (
	`character_sheet_id` integer NOT NULL,
	`ability_id` integer NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `ability_id`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ability_id`) REFERENCES `ability_scores`(`id`) ON UPDATE no action ON DELETE cascade
);

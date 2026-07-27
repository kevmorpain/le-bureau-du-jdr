CREATE TABLE `character_skills` (
	`character_sheet_id` integer NOT NULL,
	`skill_key` text NOT NULL,
	`proficiency_level` text DEFAULT 'none' NOT NULL,
	`source` text NOT NULL,
	`is_override` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `skill_key`, `source`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_character_skills_sheet` ON `character_skills` (`character_sheet_id`);
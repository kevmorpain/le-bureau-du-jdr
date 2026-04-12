CREATE TABLE `character_spell_slots` (
	`character_sheet_id` integer NOT NULL,
	`slot_level` integer NOT NULL,
	`slot_type` text NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `slot_level`, `slot_type`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_spells` (
	`character_sheet_id` integer NOT NULL,
	`spell_id` integer NOT NULL,
	`is_known` integer DEFAULT false NOT NULL,
	`is_prepared` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `spell_id`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`spell_id`) REFERENCES `spells`(`id`) ON UPDATE no action ON DELETE cascade
);

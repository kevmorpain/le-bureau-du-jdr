ALTER TABLE `character_sheets` ADD `max_hp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `current_hp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `temporary_hp` integer DEFAULT 0 NOT NULL;
ALTER TABLE `character_classes` ADD `spellcasting_ability` text;--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `exhaustion_level` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `character_sheets` ADD `dragonborn_ancestry` text;--> statement-breakpoint
ALTER TABLE `classes` ADD `spellcasting_ability` text;
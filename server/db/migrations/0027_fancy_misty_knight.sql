CREATE INDEX `idx_character_sheets_species` ON `character_sheets` (`species_id`);--> statement-breakpoint
CREATE INDEX `idx_character_spells_spell` ON `character_spells` (`spell_id`);--> statement-breakpoint
CREATE INDEX `idx_spells_school` ON `spells` (`school_id`);
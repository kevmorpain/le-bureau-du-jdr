ALTER TABLE `subclasses` ADD `spellcasting_ability` text;--> statement-breakpoint
ALTER TABLE `character_classes` ADD `subclass_id` integer REFERENCES subclasses(id) ON DELETE set null;
-- Note: character_classes.spellcasting_ability est conservée (deprecated, plus utilisée). Sera dropped dans une migration ultérieure.

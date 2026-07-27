CREATE INDEX `character_ability_scores_ability_id_idx` ON `character_ability_scores` (`ability_id`);--> statement-breakpoint
CREATE INDEX `character_classes_class_id_idx` ON `character_classes` (`class_id`);--> statement-breakpoint
CREATE INDEX `features_class_id_idx` ON `features` (`class_id`);--> statement-breakpoint
CREATE INDEX `features_subclass_id_idx` ON `features` (`subclass_id`);--> statement-breakpoint
CREATE INDEX `spell_classes_class_id_idx` ON `spell_classes` (`class_id`);
CREATE TABLE `character_ability_score_improvements` (
  `id` integer PRIMARY KEY NOT NULL,
  `character_sheet_id` integer NOT NULL REFERENCES character_sheets(id) ON DELETE cascade,
  `class_id` integer NOT NULL REFERENCES classes(id),
  `class_level` integer NOT NULL,
  `ability` text NOT NULL,
  `amount` integer NOT NULL,
  `created_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_asi_character` ON `character_ability_score_improvements` (`character_sheet_id`);

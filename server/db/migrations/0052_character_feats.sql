CREATE TABLE `character_feats` (
  `id` integer PRIMARY KEY NOT NULL,
  `character_sheet_id` integer NOT NULL REFERENCES character_sheets(id) ON DELETE cascade,
  `feat_id` text NOT NULL,
  `source` text NOT NULL DEFAULT 'asi',
  `class_id` integer REFERENCES classes(id),
  `class_level` integer,
  `created_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_character_feats_sheet` ON `character_feats` (`character_sheet_id`);
--> statement-breakpoint
ALTER TABLE `items` ADD COLUMN `default_magic_effects` text;

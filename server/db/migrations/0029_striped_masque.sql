PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_effects` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_effects`("id", "type", "value") SELECT "id", "type", "value" FROM `effects`;--> statement-breakpoint
DROP TABLE `effects`;--> statement-breakpoint
ALTER TABLE `__new_effects` RENAME TO `effects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
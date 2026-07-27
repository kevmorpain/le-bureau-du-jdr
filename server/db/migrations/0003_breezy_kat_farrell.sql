PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_spells` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`casting_time` text NOT NULL,
	`range` integer NOT NULL,
	`components` text DEFAULT (json_array()) NOT NULL,
	`material` text,
	`ritual` integer DEFAULT false NOT NULL,
	`duration` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_spells`("id", "name", "level", "casting_time", "range", "components", "material", "ritual", "duration", "description", "created_at", "updated_at", "deleted_at") SELECT "id", "name", "level", "casting_time", "range", "components", "material", "ritual", "duration", "description", "created_at", "updated_at", "deleted_at" FROM `spells`;--> statement-breakpoint
DROP TABLE `spells`;--> statement-breakpoint
ALTER TABLE `__new_spells` RENAME TO `spells`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
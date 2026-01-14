CREATE TABLE `character_classes` (
	`character_sheet_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`is_main` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `class_id`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`hit_dice` text NOT NULL
);

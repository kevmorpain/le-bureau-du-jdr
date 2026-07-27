CREATE TABLE `spells` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` integer NOT NULL,
	`casting_time` text NOT NULL,
	`range` integer NOT NULL,
	`components` text,
	`duration` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);

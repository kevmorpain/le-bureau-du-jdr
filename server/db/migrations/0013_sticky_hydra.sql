CREATE TABLE `character_species` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` text NOT NULL,
	`speed` integer NOT NULL,
	`traits` text DEFAULT (json_array()) NOT NULL
);

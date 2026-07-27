CREATE TABLE `character_sheets` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`species_id` integer NOT NULL,
	FOREIGN KEY (`species_id`) REFERENCES `character_species`(`id`) ON UPDATE no action ON DELETE no action
);

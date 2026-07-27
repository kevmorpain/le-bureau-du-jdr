CREATE TABLE `spell_classes` (
	`spell_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	PRIMARY KEY(`spell_id`, `class_id`),
	FOREIGN KEY (`spell_id`) REFERENCES `spells`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `character_inventory` (
	`id` integer PRIMARY KEY NOT NULL,
	`character_sheet_id` integer NOT NULL,
	`item_id` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`equipped` integer DEFAULT false NOT NULL,
	`magic_bonus` integer DEFAULT 0 NOT NULL,
	`magic_effects` text,
	`notes` text,
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_character_inventory_sheet` ON `character_inventory` (`character_sheet_id`);--> statement-breakpoint
CREATE INDEX `idx_character_inventory_item` ON `character_inventory` (`item_id`);--> statement-breakpoint
CREATE TABLE `character_proficiency_overrides` (
	`character_sheet_id` integer NOT NULL,
	`proficiency_type` text NOT NULL,
	`value` text NOT NULL,
	`action` text NOT NULL,
	PRIMARY KEY(`character_sheet_id`, `proficiency_type`, `value`),
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`item_type` text NOT NULL,
	`properties` text NOT NULL,
	`description` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` text,
	`updated_at` text,
	`deleted_at` text
);

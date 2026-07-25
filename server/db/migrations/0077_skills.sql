CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`ability` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text,
	`deleted_at` text
);

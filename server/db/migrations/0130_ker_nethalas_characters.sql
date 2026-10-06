CREATE TABLE `kn_characters` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner_id` integer NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`personal_goals` text DEFAULT '' NOT NULL,
	`health_current` integer DEFAULT 0 NOT NULL,
	`health_max` integer DEFAULT 0 NOT NULL,
	`toughness_current` integer DEFAULT 0 NOT NULL,
	`toughness_max` integer DEFAULT 0 NOT NULL,
	`aether_current` integer DEFAULT 0 NOT NULL,
	`aether_max` integer DEFAULT 0 NOT NULL,
	`sanity_current` integer DEFAULT 0 NOT NULL,
	`sanity_max` integer DEFAULT 0 NOT NULL,
	`exhaustion` integer DEFAULT 0 NOT NULL,
	`damage_modifier` integer DEFAULT 0 NOT NULL,
	`resistances` text NOT NULL,
	`skills` text NOT NULL,
	`extra_skills` text DEFAULT '[]' NOT NULL,
	`masteries` text DEFAULT '' NOT NULL,
	`perks` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_kn_characters_owner` ON `kn_characters` (`owner_id`);

-- Cleanup de la migration 0052 (table character_feats abandonnée au profit
-- de character_features étendue, colonnes JSON sur items remplacées par une
-- vraie table de jointure item_effects).

DROP TABLE IF EXISTS `character_feats`;
--> statement-breakpoint
ALTER TABLE `items` DROP COLUMN `default_magic_effects`;
--> statement-breakpoint

-- Table de jointure items ↔ effects (mêmes conventions que feature_effects).
CREATE TABLE `item_effects` (
  `item_id` integer NOT NULL REFERENCES items(id) ON DELETE cascade,
  `effect_id` integer NOT NULL REFERENCES effects(id) ON DELETE cascade,
  PRIMARY KEY (`item_id`, `effect_id`)
);
--> statement-breakpoint

-- Traçabilité des dons stockés via character_features (source='asi'|'bonus').
ALTER TABLE `character_features` ADD COLUMN `source` text;
--> statement-breakpoint
ALTER TABLE `character_features` ADD COLUMN `class_level` integer;
--> statement-breakpoint
-- Choix résolus du don (ex : caractéristique +1 pour Observateur/Résilient/…).
-- JSON : { "ability": "wis" } pour l'instant, extensible.
ALTER TABLE `character_features` ADD COLUMN `choices` text;
--> statement-breakpoint

-- La colonne magic_effects sur character_inventory devient obsolète : tous les
-- effets viennent désormais de item_effects (fixés à la création de l'item,
-- pas d'override per-instance). Pour personnaliser, le MJ crée un nouvel item.
ALTER TABLE `character_inventory` DROP COLUMN `magic_effects`;

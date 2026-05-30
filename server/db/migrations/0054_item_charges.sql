-- Charges d'objets magiques (nombre d'utilisations + recharge).
-- max_uses / recharge_type / recharge_dice définissent l'objet ;
-- current_uses (sur character_inventory) est l'état par instance (charges dépensées).

ALTER TABLE `items` ADD COLUMN `max_uses` integer;
--> statement-breakpoint
ALTER TABLE `items` ADD COLUMN `recharge_type` text;
--> statement-breakpoint
-- recharge_dice : null = recharge complète (toutes les charges) ;
-- sinon expression de dés (ex : "1d6+4") = recharge partielle.
ALTER TABLE `items` ADD COLUMN `recharge_dice` text;
--> statement-breakpoint
ALTER TABLE `character_inventory` ADD COLUMN `current_uses` integer DEFAULT 0 NOT NULL;

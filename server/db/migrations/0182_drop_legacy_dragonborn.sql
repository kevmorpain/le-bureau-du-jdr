-- Le Drakéide 2014 vit en base + 10 lignées, chacune portant son type de dégâts : l'espèce « Drakéide (2014) », dont
-- l'ascendance se résolvait par la colonne `character_sheets.dragonborn_ancestry`, disparaît avec la colonne.
-- Ses capacités et les effets qu'elle seule utilise partent avec elle ; rien n'est supprimé tant qu'une fiche la porte.

DELETE FROM `effects`
WHERE `id` IN (
    SELECT fe.`effect_id` FROM `feature_effects` fe
    JOIN `species_features` sf ON sf.`feature_id` = fe.`feature_id`
    JOIN `character_species` sp ON sp.`id` = sf.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  )
  AND `id` NOT IN (
    SELECT fe.`effect_id` FROM `feature_effects` fe
    WHERE fe.`feature_id` NOT IN (
      SELECT sf.`feature_id` FROM `species_features` sf
      JOIN `character_species` sp ON sp.`id` = sf.`species_id`
      WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
    )
  )
  AND `id` NOT IN (SELECT `effect_id` FROM `item_effects`)
  AND NOT EXISTS (
    SELECT 1 FROM `character_sheets` cs JOIN `character_species` sp ON sp.`id` = cs.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  );
--> statement-breakpoint
DELETE FROM `feature_effects`
WHERE `feature_id` IN (
    SELECT sf.`feature_id` FROM `species_features` sf
    JOIN `character_species` sp ON sp.`id` = sf.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  )
  AND NOT EXISTS (
    SELECT 1 FROM `character_sheets` cs JOIN `character_species` sp ON sp.`id` = cs.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  );
--> statement-breakpoint
DELETE FROM `features`
WHERE `id` IN (
    SELECT sf.`feature_id` FROM `species_features` sf
    JOIN `character_species` sp ON sp.`id` = sf.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  )
  AND NOT EXISTS (
    SELECT 1 FROM `character_sheets` cs JOIN `character_species` sp ON sp.`id` = cs.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  );
--> statement-breakpoint
DELETE FROM `species_features`
WHERE `species_id` IN (SELECT `id` FROM `character_species` WHERE `name` = 'Drakéide (2014)' AND `ruleset` = '5')
  AND NOT EXISTS (
    SELECT 1 FROM `character_sheets` cs JOIN `character_species` sp ON sp.`id` = cs.`species_id`
    WHERE sp.`name` = 'Drakéide (2014)' AND sp.`ruleset` = '5'
  );
--> statement-breakpoint
DELETE FROM `character_species`
WHERE `name` = 'Drakéide (2014)' AND `ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `character_sheets` cs WHERE cs.`species_id` = `character_species`.`id`);
--> statement-breakpoint
ALTER TABLE `character_sheets` DROP COLUMN `dragonborn_ancestry`;

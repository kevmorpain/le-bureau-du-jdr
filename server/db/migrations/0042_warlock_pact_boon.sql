ALTER TABLE `character_classes` ADD `pact_boon` text;--> statement-breakpoint
ALTER TABLE `character_inventory` ADD `is_pact_weapon` integer NOT NULL DEFAULT 0;--> statement-breakpoint
INSERT OR IGNORE INTO `spells` (`name`, `level`, `casting_time`, `range`, `components`, `material`, `ritual`, `duration`, `concentration`, `description`, `school_id`)
VALUES (
  'Appel de familier', 1, '1 heure', 3,
  json_array('V','S','M'),
  'charbon, encens et herbes aromatiques d''une valeur de 10 po, consumés par les flammes',
  1, 'Instantanée', 0,
  'Vous gagnez les services d''un familier, un esprit qui prend la forme d''un animal de votre choix : crapaud, rat, corbeau, chat, faucon, lézard, pieuvre ou vipère. Apparu dans un espace inoccupé à portée, il possède les statistiques de l''animal choisi bien qu''il s''agisse d''une créature céleste, féérique ou fiélonne (votre choix). Il agit indépendamment de vous mais obéit à vos ordres. Il ne peut pas attaquer. S''il tombe à 0 PV, il disparaît et renaît quand vous relancez ce sort. Vous ne pouvez avoir qu''un seul familier à la fois.',
  2
);--> statement-breakpoint
INSERT OR IGNORE INTO `spell_classes` (`spell_id`, `class_id`)
SELECT s.`id`, c.`id`
FROM `spells` s JOIN `classes` c ON c.`name` = 'Magicien'
WHERE s.`name` = 'Appel de familier';

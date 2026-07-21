-- Refacto multi-dégâts : la colonne `damage` (un seul type de dégâts par sort)
-- devient `damages` (tableau JSON d'entrées, chacune avec son type/dés/déclencheur).
-- Permet de modéliser les sorts à plusieurs types de dégâts (ex. Voracité de Hadar :
-- froid à l'entrée + acide en fin de tour).
ALTER TABLE `spells` ADD `damages` text;
UPDATE `spells` SET `damages` = json_array(json(`damage`)) WHERE `damage` IS NOT NULL;
ALTER TABLE `spells` DROP COLUMN `damage`;

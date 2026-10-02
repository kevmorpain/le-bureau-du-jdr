-- Concentration libre : `concentrating_spell_id` est une clé étrangère vers `spells`, donc se concentrer sur un effet de monstre, un sort
-- non seedé ou du homebrew était inexprimable. Un libellé libre l'accompagne ; au plus un des deux est renseigné.
-- Jamais BEGIN (D1).

ALTER TABLE `character_sheets` ADD COLUMN `concentrating_on` text;

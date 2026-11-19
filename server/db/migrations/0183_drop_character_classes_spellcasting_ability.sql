-- La caractéristique d'incantation vient de `classes` / `subclasses` : la copie par fiche n'est plus lue ni écrite.
ALTER TABLE `character_classes` DROP COLUMN `spellcasting_ability`;

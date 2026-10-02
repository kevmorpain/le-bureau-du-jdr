-- Classe qui a donné le sort (`character_spells.class_id`) : DD, bonus d'attaque et caractéristique
-- d'incantation deviennent propres à chaque sort en multiclasse lanceur. NULL = sort sans classe
-- (espèce, don, ajout manuel antérieur) ou classe indéterminable.
--
-- Rattrapage des lignes existantes :
--  - sorts sans `source` : la classe lanceuse de la fiche, seulement s'il n'y en a qu'une (multiclasse
--    lanceur : ambigu, la fiche retombe sur sa classe active) ;
--  - sorts d'Occultiste (pacte, manifestations, arcanum, livre des secrets anciens) : l'Occultiste de la fiche.
-- « Lanceuse » = caractéristique d'incantation sur la sous-classe ou la classe, comme le front.
--
-- Jamais BEGIN (D1).

ALTER TABLE `character_spells` ADD COLUMN `class_id` integer REFERENCES `classes`(`id`) ON DELETE SET NULL;

UPDATE `character_spells`
SET `class_id` = (
  SELECT cc.`class_id`
  FROM `character_classes` cc
  JOIN `classes` c ON c.`id` = cc.`class_id`
  LEFT JOIN `subclasses` s ON s.`id` = cc.`subclass_id`
  WHERE cc.`character_sheet_id` = `character_spells`.`character_sheet_id`
    AND COALESCE(s.`spellcasting_ability`, c.`spellcasting_ability`) IS NOT NULL
)
WHERE `source` IS NULL
  AND (
    SELECT COUNT(*)
    FROM `character_classes` cc
    JOIN `classes` c ON c.`id` = cc.`class_id`
    LEFT JOIN `subclasses` s ON s.`id` = cc.`subclass_id`
    WHERE cc.`character_sheet_id` = `character_spells`.`character_sheet_id`
      AND COALESCE(s.`spellcasting_ability`, c.`spellcasting_ability`) IS NOT NULL
  ) = 1;

UPDATE `character_spells`
SET `class_id` = (
  SELECT cc.`class_id`
  FROM `character_classes` cc
  JOIN `classes` c ON c.`id` = cc.`class_id`
  WHERE cc.`character_sheet_id` = `character_spells`.`character_sheet_id`
    AND c.`name` = 'Occultiste'
)
WHERE `source` IN ('pact_chain', 'pact_tome', 'invocation', 'arcanum_6', 'arcanum_7', 'arcanum_8', 'arcanum_9', 'book_of_ancient_secrets');

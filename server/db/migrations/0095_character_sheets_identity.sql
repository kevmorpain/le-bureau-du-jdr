-- Identité & description : champs libres de la fiche officielle (apparence p.1,
-- histoire / alliés p.2) qui n'existaient nulle part (ni schéma, ni builder, ni fiche).
-- Même pattern que personality_traits/ideals/bonds/flaws et notes : colonnes texte
-- sur character_sheets, persistées par le deep watch → PUT /api/character_sheets/{id}.
ALTER TABLE `character_sheets` ADD COLUMN `age` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `height` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `weight` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `eyes` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `hair` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `skin` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `deity` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `backstory` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `allies` text DEFAULT '' NOT NULL;
ALTER TABLE `character_sheets` ADD COLUMN `portrait_url` text DEFAULT '' NOT NULL;

-- Notes de session : texte libre, persisté en DB au lieu du localStorage
-- (cross-device, cross-session, cohérent avec personalityTraits/ideals/bonds/flaws).
ALTER TABLE `character_sheets` ADD COLUMN `notes` text DEFAULT '' NOT NULL;

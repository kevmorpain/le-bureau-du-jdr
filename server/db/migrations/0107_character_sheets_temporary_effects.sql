-- Effets temporaires de la fiche (bénédiction, malédiction, sort reçu) : liste JSON
-- `{ id, name, active, effects: Effect[] }[]`, persistée par le deep watch → PUT /api/character_sheets/{id}
-- comme les autres colonnes de la fiche. AUTO-SUFFISANTE : le DEFAULT '[]' couvre les fiches existantes.
ALTER TABLE `character_sheets` ADD COLUMN `temporary_effects` text DEFAULT '[]' NOT NULL;

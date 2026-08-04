-- Phase 2, étape 1 : poser le discriminant `ruleset` ('5' | '5.5'). Enablement PUR —
-- ça ne sert qu'à *distinguer* les éditions qui cohabitent (cf. docs/dnd-5.5.md §3,
-- docs/decisions.md D1/D2), posé juste avant le contenu 5.5. Ensemble fermé canonique :
-- shared/rules/ruleset.ts.
--
-- Migration AUTO-SUFFISANTE (cf. decisions.md D9/D13) : le DEFAULT '5' backfille toutes
-- les lignes existantes (= toutes les données actuelles sont en 2014), donc AUCUN
-- re-seed prod nécessaire. Une colonne par table : `character_sheets` (le ruleset est
-- figé par personnage, D2) + les tables du catalogue (`character_species`, `classes`,
-- `backgrounds`, `features`, `spell_classes`) pour que deux entités homonymes (Elfe 5
-- vs Elfe 5.5) coexistent sans matching de nom fragile.
--
-- Les ALTER ne passent qu'une fois (rôle de `_hub_migrations`) ; jamais de
-- db.transaction() / BEGIN (D1 le rejette, cf. decisions.md D14).

ALTER TABLE `character_sheets` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

ALTER TABLE `character_species` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

ALTER TABLE `classes` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

ALTER TABLE `backgrounds` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

ALTER TABLE `features` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

ALTER TABLE `spell_classes` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

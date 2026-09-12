-- Poser le discriminant `source` (provenance / gating de VISIBILITÉ), orthogonal à
-- `ruleset` (édition). Enablement PUR — ça ne fait que *distinguer* le socle toujours
-- visible ('core') du contenu d'extension gaté (tasha, xanathar…), posé juste avant
-- l'ajout de contenu d'extension. Ensemble fermé canonique : shared/rules/source.ts.
--
-- Migration AUTO-SUFFISANTE (cf. decisions.md D9/D13) : le DEFAULT 'core' backfille toutes
-- les lignes existantes (= tout l'existant reste visible), donc AUCUN re-seed prod. Une
-- colonne par table d'entité du catalogue qu'un joueur choisit. ⚠️ `subclasses` et
-- `species_lineages` portent LEUR propre `source` (pas parent-gated comme le ruleset) :
-- une sous-classe / lignée d'extension peut vivre sur une classe / espèce socle.
--
-- Les ALTER ne passent qu'une fois (rôle de `_hub_migrations`) ; jamais de
-- db.transaction() / BEGIN (D1 le rejette, cf. decisions.md D14).

ALTER TABLE `character_species` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `species_lineages` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `classes` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `subclasses` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `backgrounds` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `features` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `spells` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

ALTER TABLE `items` ADD COLUMN `source` text DEFAULT 'core' NOT NULL;

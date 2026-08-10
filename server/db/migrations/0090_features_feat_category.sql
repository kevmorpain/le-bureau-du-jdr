-- Lot B+C, sous-lot C2 : catégoriser les dons 2024 (Origine / Général / Style / Faveur épique)
-- via une colonne d'identité `features.feat_category` (cf. shared/rules/featCategories.ts,
-- rules-engine.md §3 « identité → colonne »). Pilote quel point de choix peut proposer un don :
-- un historique 2024 grante un don d'ORIGINE, un palier d'ASI un don GÉNÉRAL, etc.
--
-- Migration AUTO-SUFFISANTE : colonne NULLABLE (pas de DEFAULT) — les dons 2014 restent NULL,
-- ce qui est correct (un `optionSource:{feats}` sans catégorie les propose tous → iso-2014).
-- Aucun re-seed. Jamais de db.transaction() / BEGIN (D1 le rejette, decisions.md D14).

ALTER TABLE `features` ADD COLUMN `feat_category` text;

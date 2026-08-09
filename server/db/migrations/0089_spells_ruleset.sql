-- Lot A (pré-requis 5.5) : poser le discriminant `ruleset` ('5' | '5.5') sur `spells`.
-- Complète 0084 (qui l'avait posé sur `spell_classes` = appartenance d'un sort à la LISTE
-- d'une classe par édition) : ici le discriminant est porté par le SORT lui-même, car sa
-- description et ses effets peuvent DIFFÉRER entre 2014 et 2024 → chaque édition a ses
-- propres lignes de sort (« Boule de feu » 5 vs 5.5), et la fiche/le picker rendent
-- toujours le texte de la bonne édition (cf. shared/rules/ruleset.ts, decisions.md D2).
--
-- Migration AUTO-SUFFISANTE (cf. decisions.md D9/D13) : le DEFAULT '5' backfille toutes
-- les lignes existantes (tous les sorts actuels sont en 2014) → AUCUN re-seed prod. L'ALTER
-- ne passe qu'une fois (rôle de `_hub_migrations`) ; jamais de db.transaction() / BEGIN (D14).

ALTER TABLE `spells` ADD COLUMN `ruleset` text DEFAULT '5' NOT NULL;

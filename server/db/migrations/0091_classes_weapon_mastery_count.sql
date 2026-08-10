-- Lot B+C, sous-lot C4 : maîtrise d'armes 5.5 (classes martiales). Colonne d'identité
-- `classes.weapon_mastery_count` = nombre d'armes maîtrisées (repère de classe ; le `count`
-- effectif par niveau vit sur la progression `weapon_mastery`). Cf. rules-engine.md §3
-- (« identité → colonne »), shared/rules/masteryProperties.ts.
--
-- Migration AUTO-SUFFISANTE : colonne NULLABLE (pas de DEFAULT) — NULL = pas de maîtrise
-- d'armes, ce qui est correct pour TOUTES les classes 2014 (et les non-martiales 5.5). Aucun
-- re-seed. Jamais de db.transaction() / BEGIN (D1 le rejette, decisions.md D14).

ALTER TABLE `classes` ADD COLUMN `weapon_mastery_count` integer;

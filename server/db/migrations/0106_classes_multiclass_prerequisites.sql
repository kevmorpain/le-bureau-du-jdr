-- Prérequis de caractéristiques du multiclassage (PHB 2014, tableau « Prérequis pour le multiclassage » —
-- https://www.aidedd.org/regles/personnalisation/multiclassage/). Alternatives (OU) de minimums (ET) :
-- Guerrier « Force 13 ou Dextérité 13 », Moine « Dextérité 13 et Sagesse 13 ». Fait d'identité → colonne
-- (rules-engine §3), lue par l'étape Classe du level-up via /api/catalog/classes.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) : pose la colonne ET la remplit. Défaut `[]` = aucun prérequis,
-- sûr pour une classe inconnue. UPDATE limité à l'édition 2014 : un homonyme 5.5 n'hérite pas d'une règle
-- non vérifiée. Pendant du seed (server/db/seeds/data/classes.ts) : test/unit/classesIdentity.test.ts.
-- Jamais BEGIN (D1).

ALTER TABLE `classes` ADD `multiclass_prerequisites` text DEFAULT '[]' NOT NULL;

UPDATE `classes` SET `multiclass_prerequisites` = '[{"str":13}]' WHERE `name` = 'Barbare' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"cha":13}]' WHERE `name` = 'Barde' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"wis":13}]' WHERE `name` = 'Clerc' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"wis":13}]' WHERE `name` = 'Druide' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"str":13},{"dex":13}]' WHERE `name` = 'Guerrier' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"dex":13,"wis":13}]' WHERE `name` = 'Moine' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"str":13,"cha":13}]' WHERE `name` = 'Paladin' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"dex":13,"wis":13}]' WHERE `name` = 'Rôdeur' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"dex":13}]' WHERE `name` = 'Roublard' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"cha":13}]' WHERE `name` = 'Ensorceleur' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"cha":13}]' WHERE `name` = 'Occultiste' AND `ruleset` = '5';
UPDATE `classes` SET `multiclass_prerequisites` = '[{"int":13}]' WHERE `name` = 'Magicien' AND `ruleset` = '5';

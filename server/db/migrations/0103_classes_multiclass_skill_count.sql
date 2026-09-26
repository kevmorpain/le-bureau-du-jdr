-- Compétences gagnées en REJOIGNANT une classe par multiclassage (PHB 2014, tableau des maîtrises du
-- multiclassage — https://www.aidedd.org/regles/personnalisation/multiclassage/) : Barde « une compétence
-- de votre choix », Rôdeur et Roublard « une compétence choisie dans la liste de la classe », aucune pour
-- les autres. Fait d'identité → colonne (rules-engine §3) ; la LISTE reste la progression `skill` (0099).
--
-- AUTO-SUFFISANTE (pas de re-seed prod) : pose la colonne ET la remplit. Défaut 0 = sûr pour une classe
-- inconnue. UPDATE limité à l'édition 2014 : un homonyme 5.5 n'hérite pas d'une règle non vérifiée.
-- Pendant du seed (server/db/seeds/data/classes.ts) : test/unit/classesIdentity.test.ts. Jamais BEGIN (D1).

ALTER TABLE `classes` ADD `multiclass_skill_count` integer DEFAULT 0 NOT NULL;

UPDATE `classes` SET `multiclass_skill_count` = 1 WHERE `name` IN ('Barde', 'Rôdeur', 'Roublard') AND `ruleset` = '5';

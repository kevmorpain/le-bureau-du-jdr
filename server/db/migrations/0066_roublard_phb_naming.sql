-- Aligne le Roublard sur le PHB FR 2014 (D&D 5e 2014) — audit structurel.
-- Source de validation : https://www.aidedd.org/regles/classes/roublard/
--
-- Corrections : base sans capstone « Coup de chance » (L20, ajoutée par le reseed) ;
-- archétypes Assassin et Escroc arcanique avec des aptitudes au mauvais niveau ou
-- inventées -> purge + ré-insertion propre. Renommage des sous-classes Voleur
-- (ex-« Escroc ») et Escroc arcanique (ex-« Filou arcanique »).

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Jargon des voleurs'
  WHERE `name` = 'Argot des voleurs' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');
UPDATE `features` SET `name` = 'Savoir-faire'
  WHERE `name` = 'Fiabilité' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');
UPDATE `features` SET `name` = 'Perception aveugle'
  WHERE `name` = 'Sens aveugle' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');
UPDATE `features` SET `name` = 'Esprit fuyant'
  WHERE `name` = 'Glisseur d''esprit' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');

-- ── Archétypes (sous-classes) ───────────────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Voleur'          WHERE `name` = 'Escroc'          AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');
UPDATE `subclasses` SET `name` = 'Escroc arcanique' WHERE `name` = 'Filou arcanique' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard');

-- ── Reconstruction : purge des aptitudes d'archétype (ré-insérées par le reseed)
DELETE FROM `features`
  WHERE `subclass_id` IN (SELECT `id` FROM `subclasses` WHERE `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Roublard'));

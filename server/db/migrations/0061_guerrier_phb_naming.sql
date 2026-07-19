-- Aligne le Guerrier sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/guerrier/
-- Renommages scopés sur le Guerrier uniquement (cf. 0056).
--
-- Corrige aussi 2 bugs latents du builder (noms qui ne matchaient pas la base) :
--   'Maître de bataille' (builder) vs 'Maître de combat' (base) -> 'Maître de guerre'
--   'Chevalier éldritique' (builder) vs 'Chevalier mystique' (base) -> 'Chevalier occulte'

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Second souffle'
  WHERE `name` = 'Second Souffle' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier');
UPDATE `features` SET `name` = 'Fougue'
  WHERE `name` = 'Regain d''action' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier');
UPDATE `features` SET `name` = 'Inflexible'
  WHERE `name` = 'Indomptable' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier');

-- ── Sous-classes (archétypes martiaux) ──────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Chevalier occulte'
  WHERE `name` = 'Chevalier mystique' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier');
UPDATE `subclasses` SET `name` = 'Maître de guerre'
  WHERE `name` = 'Maître de combat' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier');

-- ── Champion ────────────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Athlète accompli'
  WHERE `name` = 'Athlète remarquable'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Champion' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));

-- ── Chevalier occulte ───────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Incantation'
  WHERE `name` = 'Lanceur de sorts'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chevalier occulte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));
UPDATE `features` SET `name` = 'Lien avec une arme'
  WHERE `name` = 'Lien d''arme'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chevalier occulte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));
UPDATE `features` SET `name` = 'Magie de guerre'
  WHERE `name` = 'Guerre magique'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chevalier occulte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));
UPDATE `features` SET `name` = 'Frappe occulte'
  WHERE `name` = 'Élixir de vie'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chevalier occulte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));
UPDATE `features` SET `name` = 'Magie de guerre améliorée'
  WHERE `name` = 'Maîtrise mystique'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chevalier occulte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));

-- ── Maître de guerre ────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Observation de l''ennemi'
  WHERE `name` = 'Connais ton ennemi'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Maître de guerre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));

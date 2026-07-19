-- Aligne le Druide sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/druide/
-- Renommages scopés sur le Druide uniquement (cf. 0056). Les noms des 2 cercles
-- étaient déjà corrects ; descriptions déjà exactes.

-- ── Aptitude de classe (base) ───────────────────────────────────────────────
UPDATE `features` SET `name` = 'Forme sauvage'
  WHERE `name` = 'Forme Sauvage' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide');

-- ── Cercle de la terre ──────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Sort mineur supplémentaire'
  WHERE `name` = 'Magie de terre naturelle'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la terre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Sorts de cercle'
  WHERE `name` = 'Magie de cercle'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la terre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Foulée tellurique'
  WHERE `name` = 'Pas de la terre'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la terre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Protégé de dame Nature'
  WHERE `name` = 'Sanctuaire naturel'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la terre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));

-- ── Cercle de la lune ───────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Forme sauvage de combat'
  WHERE `name` = 'Combat en forme sauvage'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la lune' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Formes du cercle'
  WHERE `name` = 'Formes de la lune'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la lune' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Frappe primitive'
  WHERE `name` = 'Forme de bête primitive'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la lune' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Forme sauvage élémentaire'
  WHERE `name` = 'Forme élémentaire'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la lune' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));
UPDATE `features` SET `name` = 'Mille formes'
  WHERE `name` = 'Druide millénaire'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Cercle de la lune' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Druide'));

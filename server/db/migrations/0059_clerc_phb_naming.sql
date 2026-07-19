-- Aligne le Clerc sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/clerc/
-- Renommages scopés sur le Clerc uniquement (cf. 0056). Les 7 domaines PHB sont
-- reformatés « Domaine X » -> « Domaine de la/du X » (dont Tromperie -> duperie,
-- Connaissance -> savoir). Les noms des aptitudes de domaine sont conservés.

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Incantation'
  WHERE `name` = 'Lanceur de sorts' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `features` SET `name` = 'Conduit divin'
  WHERE `name` = 'Channeling divin' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');

-- ── Domaines divins (sous-classes) ──────────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Domaine de la vie'      WHERE `name` = 'Domaine Vie'          AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine de la lumière'  WHERE `name` = 'Domaine Lumière'      AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine de la guerre'   WHERE `name` = 'Domaine Guerre'       AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine de la tempête'  WHERE `name` = 'Domaine Tempête'      AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine de la nature'   WHERE `name` = 'Domaine Nature'       AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine de la duperie'  WHERE `name` = 'Domaine Tromperie'    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');
UPDATE `subclasses` SET `name` = 'Domaine du savoir'      WHERE `name` = 'Domaine Connaissance' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Clerc');

-- Aligne le Barde sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/barde/
-- Renommages scopés sur le Barde uniquement (cf. 0056). Descriptions déjà exactes.

-- ── Sous-classes ────────────────────────────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Collège du savoir'
  WHERE `name` = 'Collège du Savoir'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde');
UPDATE `subclasses` SET `name` = 'Collège de la vaillance'
  WHERE `name` = 'Collège de Bravoure'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde');

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Incantation'
  WHERE `name` = 'Lanceur de sorts' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde');
UPDATE `features` SET `name` = 'Inspiration supérieure'
  WHERE `name` = 'Maîtrise bardique' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde');

-- ── Collège du savoir ───────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Maîtrises supplémentaires'
  WHERE `name` = 'Compétences supplémentaires'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Collège du savoir' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde'));
UPDATE `features` SET `name` = 'Mots cinglants'
  WHERE `name` = 'Mots acérés'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Collège du savoir' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde'));
UPDATE `features` SET `name` = 'Compétence hors-pair'
  WHERE `name` = 'Gloire inégalée'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Collège du savoir' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde'));

-- ── Collège de la vaillance ─────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Inspiration martiale'
  WHERE `name` = 'Inspiration de combat'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Collège de la vaillance' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde'));
UPDATE `features` SET `name` = 'Magie de combat'
  WHERE `name` = 'Sorts de bataille'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Collège de la vaillance' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barde'));

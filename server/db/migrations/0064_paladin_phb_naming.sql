-- Aligne le Paladin sur le PHB FR 2014 (D&D 5e 2014) — audit structurel.
-- Source de validation : https://www.aidedd.org/regles/classes/paladin/
--
-- Le seed du Paladin était structurellement cassé : base sans « Attaque
-- supplémentaire » (L5) et avec un faux capstone de base « Âme sacrée » (L20,
-- qui est en réalité le Nimbe sacré de la Dévotion) ; plusieurs options de
-- Conduit divin et aptitudes de serment mal nommées ou avec la mauvaise mécanique.
-- On reconstruit :
--   • Renommage de 2 aptitudes de base (liens perso préservés).
--   • Suppression du faux capstone de base « Âme sacrée ».
--   • « Attaque supplémentaire » (L5) ré-insérée par le reseed.
--   • Renommage des 3 serments PHB, puis purge + ré-insertion propre de leurs
--     aptitudes par le reseed (nombreuses mécaniques à corriger).

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Conduit divin'
  WHERE `name` = 'Channeling divin' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');
UPDATE `features` SET `name` = 'Contact purifiant'
  WHERE `name` = 'Châtiment purifiant' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');
DELETE FROM `features`
  WHERE `name` = 'Âme sacrée' AND `subclass_id` IS NULL
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');

-- ── Serments sacrés (sous-classes) ──────────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Serment de dévotion'  WHERE `name` = 'Serment de Dévotion' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');
UPDATE `subclasses` SET `name` = 'Serment des anciens'  WHERE `name` = 'Serment des Anciens' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');
UPDATE `subclasses` SET `name` = 'Serment de vengeance' WHERE `name` = 'Serment de Vengeance' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin');

-- ── Reconstruction : purge des aptitudes de serment (ré-insérées par le reseed)
DELETE FROM `features`
  WHERE `subclass_id` IN (SELECT `id` FROM `subclasses` WHERE `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Paladin'));

-- Aligne le Magicien sur le PHB FR 2014 (D&D 5e 2014) — audit STRUCTUREL.
-- Source de validation : https://www.aidedd.org/regles/classes/magicien/
--
-- Le seed du Magicien était structurellement cassé (features au mauvais niveau,
-- manquantes ou inventées, écoles incomplètes, sous-classe Xanathar). On corrige :
--   • 3 aptitudes de base renommées (liens perso préservés via UPDATE).
--   • 8 écoles PHB renommées (casse + Conjuration -> invocation) pour que le reseed
--     les retrouve.
--   • Toutes les features de sous-classe du Magicien sont SUPPRIMÉES puis ré-insérées
--     proprement par le reseed (jeu complet et correct). Le FK character_features
--     est ON DELETE CASCADE : cela détache les features des fiches sans les détruire.
--   • Suppression de la sous-classe 'Sorcier de guerre' (Magie de guerre = Xanathar,
--     hors PHB 2014 ; elle n'était pas sélectionnable dans le builder).

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Incantation'
  WHERE `name` = 'Lanceur de sorts' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `features` SET `name` = 'Restauration arcanique'
  WHERE `name` = 'Récupération arcanique' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `features` SET `name` = 'Sorts de prédilection'
  WHERE `name` = 'Signature de sorts' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');

-- ── Écoles (sous-classes) : renommage vers les noms PHB ─────────────────────
UPDATE `subclasses` SET `name` = 'École d''abjuration'    WHERE `name` = 'École d''Abjuration'    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École de divination'    WHERE `name` = 'École de Divination'    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École d''enchantement'  WHERE `name` = 'École d''Enchantement'  AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École d''évocation'     WHERE `name` = 'École d''Évocation'     AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École d''illusion'      WHERE `name` = 'École d''Illusion'      AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École de nécromancie'   WHERE `name` = 'École de Nécromancie'   AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École de transmutation' WHERE `name` = 'École de Transmutation' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');
UPDATE `subclasses` SET `name` = 'École d''invocation'    WHERE `name` = 'École de Conjuration'   AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien');

-- ── Reconstruction : purge des features de sous-classe (ré-insérées par le reseed)
DELETE FROM `features`
  WHERE `subclass_id` IN (SELECT `id` FROM `subclasses` WHERE `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien'));

-- ── Suppression de la sous-classe hors-PHB 'Sorcier de guerre' ───────────────
DELETE FROM `subclasses`
  WHERE `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Magicien') AND `name` = 'Sorcier de guerre';

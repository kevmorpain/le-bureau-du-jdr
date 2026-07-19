-- Aligne le Rôdeur sur le PHB FR 2014 (D&D 5e 2014) — audit structurel.
-- Source de validation : https://www.aidedd.org/regles/classes/rodeur/
--
-- Corrections structurelles de la base :
--   • Camouflage naturel (Hide in Plain Sight) était placé à L8 -> remis à L10.
--   • « Détection des failles » (L10) n'est pas une aptitude de rôdeur -> supprimée.
--   • « Tueur implacable » (Foe Slayer, L20) était manquante -> ajoutée par le reseed.
-- Renommages scopés sur le Rôdeur (cf. 0056).

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Explorateur-né'
  WHERE `name` = 'Explorateur né' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur');
UPDATE `features` SET `name` = 'Foulée tellurique'
  WHERE `name` = 'Déplacement des terres' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur');
UPDATE `features` SET `name` = 'Camouflage naturel', `level_required` = 10
  WHERE `name` = 'Cachette des terres' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur');
UPDATE `features` SET `name` = 'Sens sauvages'
  WHERE `name` = 'Sens cachés' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur');
DELETE FROM `features`
  WHERE `name` = 'Détection des failles' AND `subclass_id` IS NULL
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur');

-- ── Chasseur ────────────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Attaques multiples'
  WHERE `name` = 'Attaque multiple'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Chasseur' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur'));

-- ── Maître des bêtes ────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Compagnon du rôdeur'
  WHERE `name` = 'Compagnon animal'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Maître des bêtes' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur'));
UPDATE `features` SET `name` = 'Fureur bestiale'
  WHERE `name` = 'Attaque bestiale'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Maître des bêtes' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Rôdeur'));

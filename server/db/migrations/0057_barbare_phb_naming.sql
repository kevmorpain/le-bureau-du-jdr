-- Aligne le Barbare sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/barbare/
--
-- Renommages scopés sur le Barbare uniquement (cf. 0056 pour le raisonnement
-- idempotence). Les descriptions du Barbare étaient déjà mécaniquement correctes,
-- seuls les noms changent ici.

-- ── Sous-classes ────────────────────────────────────────────────────────────
UPDATE `subclasses` SET `name` = 'Voie du berserker'
  WHERE `name` = 'Voie du Berserker'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `subclasses` SET `name` = 'Voie du guerrier totem'
  WHERE `name` = 'Voie du Totem guerrier'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Attaque téméraire'
  WHERE `name` = 'Témérité' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `features` SET `name` = 'Instinct sauvage'
  WHERE `name` = 'Instinct animal' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `features` SET `name` = 'Critique brutal'
  WHERE `name` = 'Attaque brute' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `features` SET `name` = 'Rage persistante'
  WHERE `name` = 'Résistance brutale' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `features` SET `name` = 'Puissance indomptable'
  WHERE `name` = 'Persistance' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');
UPDATE `features` SET `name` = 'Champion primitif'
  WHERE `name` = 'Force indétrônable' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare');

-- ── Voie du berserker ───────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Rage aveugle'
  WHERE `name` = 'Rage insensée'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du berserker' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));
UPDATE `features` SET `name` = 'Représailles'
  WHERE `name` = 'Vengeance'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du berserker' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));

-- ── Voie du guerrier totem ──────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Quêteur spirituel'
  WHERE `name` = 'Chercheur de totem'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du guerrier totem' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));
UPDATE `features` SET `name` = 'Aspect de la bête'
  WHERE `name` = 'Aspect du totem'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du guerrier totem' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));
UPDATE `features` SET `name` = 'Marcheur spirituel'
  WHERE `name` = 'Marcheur de l''esprit'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du guerrier totem' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));
UPDATE `features` SET `name` = 'Lien totémique'
  WHERE `name` = 'Attaque du totem'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie du guerrier totem' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Barbare'));

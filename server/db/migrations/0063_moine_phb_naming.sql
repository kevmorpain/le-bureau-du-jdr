-- Aligne le Moine sur le PHB FR 2014 (D&D 5e 2014) — audit structurel.
-- Source de validation : https://www.aidedd.org/regles/classes/moine/
-- Renommages scopés sur le Moine (cf. 0056). Les 4 features de base manquantes
-- (Chute ralentie L4, Frappes de ki L6, Langue du soleil et de la lune L13,
-- Âme de diamant L14) sont ajoutées par le reseed (INSERT), pas ici.

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Ki'                    WHERE `name` = 'Points de ki'              AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Parade de projectiles' WHERE `name` = 'Déviation des projectiles' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Esquive totale'        WHERE `name` = 'Réflexes du moine'         AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Sérénité'              WHERE `name` = 'Immobilisation du corps'   AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Pureté physique'       WHERE `name` = 'Corps de diamant'          AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Jeunesse éternelle'    WHERE `name` = 'Déplacement sans âge'      AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `features` SET `name` = 'Désertion de l''âme'   WHERE `name` = 'Vide parfait'              AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');

-- ── Traditions monastiques (sous-classes) ───────────────────────────────────
UPDATE `subclasses` SET `name` = 'Voie de la paume'          WHERE `name` = 'Voie de la Paume Ouverte' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `subclasses` SET `name` = 'Voie de l''ombre'          WHERE `name` = 'Voie de l''Ombre'         AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');
UPDATE `subclasses` SET `name` = 'Voie des quatre éléments'  WHERE `name` = 'Voie des Quatre Éléments' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine');

-- ── Voie de la paume ────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Technique de la paume'
  WHERE `name` = 'Technique de la paume ouverte'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de la paume' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Plénitude physique'
  WHERE `name` = 'Corps et âme'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de la paume' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Tranquillité'
  WHERE `name` = 'Frappe spectrale'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de la paume' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Paume frémissante'
  WHERE `name` = 'Paume tremblante'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de la paume' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));

-- ── Voie de l'ombre ─────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Arts des ombres'
  WHERE `name` = 'Sorts de l''ombre'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de l''ombre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Foulée d''ombre'
  WHERE `name` = 'Ombres furtives'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de l''ombre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Linceul d''ombre'
  WHERE `name` = 'Manteau de l''ombre'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de l''ombre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));
UPDATE `features` SET `name` = 'Opportuniste'
  WHERE `name` = 'Assassin silencieux'
    AND `subclass_id` = (SELECT `id` FROM `subclasses` WHERE `name` = 'Voie de l''ombre' AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Moine'));

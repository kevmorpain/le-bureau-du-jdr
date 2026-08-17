-- F2 — backfill du point de choix de SOUS-CLASSE sur les bases DÉPLOYÉES (pendant du seed :
-- server/db/seeds/data/subclassChoice.ts, injecté par seedClass pour les 12 classes). L'identité
-- (classes.subclass_level) est déjà posée (0080) ; on ajoute ici la « décision → progression »
-- manquante (rules-engine.md §4).
--
-- Pour chaque classe (édition '5'), une feature owner `choice_carrier` — INVISIBLE : jamais
-- matérialisée sur la fiche (le sweep de grants passifs filtre `class_feature`) — au niveau d'accès,
-- portant une progression `kind:'subclass'` / optionSource {subclasses}. `buildCatalog` la lit malgré
-- le type non matérialisé (il ne filtre pas featureType).
--
-- Idempotent (gardes NOT EXISTS) : sans effet si le seed a déjà créé owner/progression. Tolérant base
-- vierge : INSERT ... SELECT FROM `classes` (vide pendant les migrations) → 0 ligne (le seed s'en
-- charge). Descriptions identiques au seed (convergence au mot près). Jamais BEGIN (D1) — statements
-- séquentiels.

-- Barbare (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Voie primitive', 'Au niveau 3, vous choisissez votre spécialisation (Voie primitive). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Voie primitive' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5' AND f.`name` = 'Voie primitive' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Barde (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Collège bardique', 'Au niveau 3, vous choisissez votre spécialisation (Collège bardique). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Barde' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Collège bardique' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Barde' AND c.`ruleset` = '5' AND f.`name` = 'Collège bardique' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Clerc (niv 1)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Domaine divin', 'Au niveau 1, vous choisissez votre spécialisation (Domaine divin). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Clerc' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Domaine divin' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Clerc' AND c.`ruleset` = '5' AND f.`name` = 'Domaine divin' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Druide (niv 2)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Cercle druidique', 'Au niveau 2, vous choisissez votre spécialisation (Cercle druidique). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 2
FROM `classes` c
WHERE c.`name` = 'Druide' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Cercle druidique' AND f.`level_required` = 2);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Druide' AND c.`ruleset` = '5' AND f.`name` = 'Cercle druidique' AND f.`level_required` = 2
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Guerrier (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Archétype martial', 'Au niveau 3, vous choisissez votre spécialisation (Archétype martial). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Guerrier' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Archétype martial' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Guerrier' AND c.`ruleset` = '5' AND f.`name` = 'Archétype martial' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Magicien (niv 2)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Tradition arcanique', 'Au niveau 2, vous choisissez votre spécialisation (Tradition arcanique). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 2
FROM `classes` c
WHERE c.`name` = 'Magicien' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Tradition arcanique' AND f.`level_required` = 2);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Magicien' AND c.`ruleset` = '5' AND f.`name` = 'Tradition arcanique' AND f.`level_required` = 2
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Moine (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Tradition monastique', 'Au niveau 3, vous choisissez votre spécialisation (Tradition monastique). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Moine' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Tradition monastique' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Moine' AND c.`ruleset` = '5' AND f.`name` = 'Tradition monastique' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Paladin (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Serment sacré', 'Au niveau 3, vous choisissez votre spécialisation (Serment sacré). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Paladin' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Serment sacré' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Paladin' AND c.`ruleset` = '5' AND f.`name` = 'Serment sacré' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Rôdeur (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Archétype de rôdeur', 'Au niveau 3, vous choisissez votre spécialisation (Archétype de rôdeur). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Rôdeur' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Archétype de rôdeur' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Rôdeur' AND c.`ruleset` = '5' AND f.`name` = 'Archétype de rôdeur' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Roublard (niv 3)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Archétype de roublard', 'Au niveau 3, vous choisissez votre spécialisation (Archétype de roublard). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 3
FROM `classes` c
WHERE c.`name` = 'Roublard' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Archétype de roublard' AND f.`level_required` = 3);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Roublard' AND c.`ruleset` = '5' AND f.`name` = 'Archétype de roublard' AND f.`level_required` = 3
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Ensorceleur (niv 1)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Origine magique', 'Au niveau 1, vous choisissez votre spécialisation (Origine magique). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Ensorceleur' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Origine magique' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Ensorceleur' AND c.`ruleset` = '5' AND f.`name` = 'Origine magique' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- Occultiste (niv 1)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Protecteur d''outre-monde', 'Au niveau 1, vous choisissez votre spécialisation (Protecteur d''outre-monde). Ce choix vous octroie des aptitudes propres à mesure que vous gagnez des niveaux.', 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Protecteur d''outre-monde' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'subclass', '{"op":"fixed","value":1}', '{"type":"subclasses"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5' AND f.`name` = 'Protecteur d''outre-monde' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'subclass');

-- F3 tranche 3 — backfill du point de choix de COMPÉTENCES DE CLASSE sur les bases DÉPLOYÉES
-- (pendant du seed : server/db/seeds/data/classSkills.ts, injecté par seedClass). Une feature owner
-- `choice_carrier` INVISIBLE (jamais matérialisée) au niveau 1 par classe, portant une progression
-- `kind:'skill'` / optionSource {type:'skills', from:[...]}. Créée par MIGRATION (pas seed manuel)
-- pour éviter la fenêtre déploiement→reseed : le pick d'un joueur (character_choices) exige que la
-- progression existe, sinon il serait perdu (choix, pas donnée fixe re-dérivable).
--
-- Idempotent (NOT EXISTS) : no-op si le seed a déjà créé owner/progression. Tolérant base vierge :
-- INSERT ... SELECT FROM `classes` (vide pendant les migrations) → 0 ligne. Jamais BEGIN (D1).

-- Barbare
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["animal_handling","athletics","intimidation","nature","perception","survival"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Barde
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Barde' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":3}', '{"type":"skills","from":"all"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Barde' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Clerc
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Clerc' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["history","insight","medicine","persuasion","religion"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Clerc' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Druide
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Druide' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","animal_handling","insight","medicine","nature","perception","religion","survival"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Druide' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Guerrier
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Guerrier' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["acrobatics","animal_handling","athletics","history","insight","intimidation","perception","survival"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Guerrier' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Moine
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Moine' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["acrobatics","athletics","history","insight","religion","stealth"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Moine' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Paladin
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Paladin' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["athletics","insight","intimidation","medicine","persuasion","religion"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Paladin' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Rôdeur
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Rôdeur' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":3}', '{"type":"skills","from":["animal_handling","athletics","insight","investigation","nature","perception","stealth","survival"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Rôdeur' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Roublard
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Roublard' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":4}', '{"type":"skills","from":["acrobatics","athletics","deception","insight","intimidation","investigation","perception","performance","persuasion","sleight_of_hand","stealth"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Roublard' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Ensorceleur
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Ensorceleur' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","deception","insight","intimidation","persuasion","religion"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Ensorceleur' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Occultiste
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","deception","history","intimidation","investigation","nature","religion"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

-- Magicien
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT 'Compétences de classe', NULL, 'choice_carrier', c.`id`, 1
FROM `classes` c
WHERE c.`name` = 'Magicien' AND c.`ruleset` = '5'
  AND NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1);
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'skill', '{"op":"fixed","value":2}', '{"type":"skills","from":["arcana","history","insight","investigation","medicine","religion"]}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Magicien' AND c.`ruleset` = '5' AND f.`name` = 'Compétences de classe' AND f.`level_required` = 1
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'skill');

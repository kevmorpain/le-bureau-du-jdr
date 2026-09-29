-- Maîtrises reçues en REJOIGNANT une classe par multiclassage (PHB 2014, tableau des maîtrises du
-- multiclassage — https://www.aidedd.org/regles/personnalisation/multiclassage/). Pendant du seed :
-- champ `multiclass` de shared/rules/classProficiencies.ts → porteur « Maîtrises de multiclassage »
-- (`multiclass_proficiency_grant`), que la fiche dérive pour les classes NON principales à la place des
-- maîtrises de départ. Sans cette migration, une classe rejointe n'accorderait plus rien en prod
-- jusqu'au reseed. Ensorceleur et Magicien n'accordent rien : pas de porteur (comme le seed).
--
-- Idempotent (NOT EXISTS / OR IGNORE sur la PK de feature_effects). Tolérant base vierge : tout part de
-- `classes` (vide pendant les migrations) → 0 ligne. Limité à l'édition 2014. Les valeurs JSON doivent
-- rester identiques à la sérialisation du seed, sinon `_seedEffects` créerait un second effet. La liste
-- est répétée par instruction (une CTE ne survit pas au `;`). Jamais BEGIN (D1).

WITH `grants` (`class_name`, `type`, `value`) AS (VALUES
  ('Barbare', 'proficiency', '"shield"'),
  ('Barbare', 'weapon_proficiency', '"simple_weapons"'),
  ('Barbare', 'weapon_proficiency', '"martial_weapons"'),
  ('Barde', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"medium"'),
  ('Clerc', 'proficiency', '"shield"'),
  ('Druide', 'proficiency', '"light"'),
  ('Druide', 'proficiency', '"medium"'),
  ('Druide', 'proficiency', '"shield"'),
  ('Guerrier', 'proficiency', '"light"'),
  ('Guerrier', 'proficiency', '"medium"'),
  ('Guerrier', 'proficiency', '"shield"'),
  ('Guerrier', 'weapon_proficiency', '"simple_weapons"'),
  ('Guerrier', 'weapon_proficiency', '"martial_weapons"'),
  ('Moine', 'weapon_proficiency', '"simple_weapons"'),
  ('Moine', 'weapon_proficiency', '"Épée courte"'),
  ('Paladin', 'proficiency', '"light"'),
  ('Paladin', 'proficiency', '"medium"'),
  ('Paladin', 'proficiency', '"shield"'),
  ('Paladin', 'weapon_proficiency', '"simple_weapons"'),
  ('Paladin', 'weapon_proficiency', '"martial_weapons"'),
  ('Rôdeur', 'proficiency', '"light"'),
  ('Rôdeur', 'proficiency', '"medium"'),
  ('Rôdeur', 'proficiency', '"shield"'),
  ('Rôdeur', 'weapon_proficiency', '"simple_weapons"'),
  ('Rôdeur', 'weapon_proficiency', '"martial_weapons"'),
  ('Roublard', 'proficiency', '"light"'),
  ('Roublard', 'tool_proficiency', '"Outils de voleur"'),
  ('Occultiste', 'proficiency', '"light"'),
  ('Occultiste', 'weapon_proficiency', '"simple_weapons"')
)
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`)
SELECT DISTINCT 'Maîtrises de multiclassage', NULL, 'multiclass_proficiency_grant', c.`id`, 1
FROM `grants` g
JOIN `classes` c ON c.`name` = g.`class_name` AND c.`ruleset` = '5'
WHERE NOT EXISTS (SELECT 1 FROM `features` f WHERE f.`class_id` = c.`id` AND f.`feature_type` = 'multiclass_proficiency_grant');

WITH `grants` (`class_name`, `type`, `value`) AS (VALUES
  ('Barbare', 'proficiency', '"shield"'),
  ('Barbare', 'weapon_proficiency', '"simple_weapons"'),
  ('Barbare', 'weapon_proficiency', '"martial_weapons"'),
  ('Barde', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"medium"'),
  ('Clerc', 'proficiency', '"shield"'),
  ('Druide', 'proficiency', '"light"'),
  ('Druide', 'proficiency', '"medium"'),
  ('Druide', 'proficiency', '"shield"'),
  ('Guerrier', 'proficiency', '"light"'),
  ('Guerrier', 'proficiency', '"medium"'),
  ('Guerrier', 'proficiency', '"shield"'),
  ('Guerrier', 'weapon_proficiency', '"simple_weapons"'),
  ('Guerrier', 'weapon_proficiency', '"martial_weapons"'),
  ('Moine', 'weapon_proficiency', '"simple_weapons"'),
  ('Moine', 'weapon_proficiency', '"Épée courte"'),
  ('Paladin', 'proficiency', '"light"'),
  ('Paladin', 'proficiency', '"medium"'),
  ('Paladin', 'proficiency', '"shield"'),
  ('Paladin', 'weapon_proficiency', '"simple_weapons"'),
  ('Paladin', 'weapon_proficiency', '"martial_weapons"'),
  ('Rôdeur', 'proficiency', '"light"'),
  ('Rôdeur', 'proficiency', '"medium"'),
  ('Rôdeur', 'proficiency', '"shield"'),
  ('Rôdeur', 'weapon_proficiency', '"simple_weapons"'),
  ('Rôdeur', 'weapon_proficiency', '"martial_weapons"'),
  ('Roublard', 'proficiency', '"light"'),
  ('Roublard', 'tool_proficiency', '"Outils de voleur"'),
  ('Occultiste', 'proficiency', '"light"'),
  ('Occultiste', 'weapon_proficiency', '"simple_weapons"')
)
INSERT INTO `effects` (`type`, `value`)
SELECT DISTINCT g.`type`, g.`value`
FROM `grants` g
JOIN `classes` c ON c.`name` = g.`class_name` AND c.`ruleset` = '5'
WHERE NOT EXISTS (SELECT 1 FROM `effects` e WHERE e.`type` = g.`type` AND e.`value` = g.`value`);

WITH `grants` (`class_name`, `type`, `value`) AS (VALUES
  ('Barbare', 'proficiency', '"shield"'),
  ('Barbare', 'weapon_proficiency', '"simple_weapons"'),
  ('Barbare', 'weapon_proficiency', '"martial_weapons"'),
  ('Barde', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"light"'),
  ('Clerc', 'proficiency', '"medium"'),
  ('Clerc', 'proficiency', '"shield"'),
  ('Druide', 'proficiency', '"light"'),
  ('Druide', 'proficiency', '"medium"'),
  ('Druide', 'proficiency', '"shield"'),
  ('Guerrier', 'proficiency', '"light"'),
  ('Guerrier', 'proficiency', '"medium"'),
  ('Guerrier', 'proficiency', '"shield"'),
  ('Guerrier', 'weapon_proficiency', '"simple_weapons"'),
  ('Guerrier', 'weapon_proficiency', '"martial_weapons"'),
  ('Moine', 'weapon_proficiency', '"simple_weapons"'),
  ('Moine', 'weapon_proficiency', '"Épée courte"'),
  ('Paladin', 'proficiency', '"light"'),
  ('Paladin', 'proficiency', '"medium"'),
  ('Paladin', 'proficiency', '"shield"'),
  ('Paladin', 'weapon_proficiency', '"simple_weapons"'),
  ('Paladin', 'weapon_proficiency', '"martial_weapons"'),
  ('Rôdeur', 'proficiency', '"light"'),
  ('Rôdeur', 'proficiency', '"medium"'),
  ('Rôdeur', 'proficiency', '"shield"'),
  ('Rôdeur', 'weapon_proficiency', '"simple_weapons"'),
  ('Rôdeur', 'weapon_proficiency', '"martial_weapons"'),
  ('Roublard', 'proficiency', '"light"'),
  ('Roublard', 'tool_proficiency', '"Outils de voleur"'),
  ('Occultiste', 'proficiency', '"light"'),
  ('Occultiste', 'weapon_proficiency', '"simple_weapons"')
)
INSERT OR IGNORE INTO `feature_effects` (`feature_id`, `effect_id`)
SELECT f.`id`, (SELECT MIN(e.`id`) FROM `effects` e WHERE e.`type` = g.`type` AND e.`value` = g.`value`)
FROM `grants` g
JOIN `classes` c ON c.`name` = g.`class_name` AND c.`ruleset` = '5'
JOIN `features` f ON f.`class_id` = c.`id` AND f.`feature_type` = 'multiclass_proficiency_grant';

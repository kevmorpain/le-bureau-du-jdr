-- Outils FIXES de classe (AideDD, ligne « Outils » des pages de classe : Roublard « outils de voleur »,
-- Druide « kit d'herboriste »), pendant du seed (shared/rules/classProficiencies.ts → porteur
-- « Maîtrises de la classe »). Posés par migration pour que la prod n'attende pas de reseed.
--
-- Idempotent (NOT EXISTS / OR IGNORE sur la PK de feature_effects). Tolérant base vierge : gardé par
-- l'existence du porteur → 0 ligne, le seed pose alors l'effet. La valeur JSON doit rester identique à
-- la sérialisation du seed, sinon `_seedEffects` créerait un second effet. Jamais BEGIN (D1).

WITH `grants` (`class_name`, `value`) AS (VALUES ('Roublard', '"Outils de voleur"'), ('Druide', '"Kit d''herboriste"'))
INSERT INTO `effects` (`type`, `value`)
SELECT DISTINCT 'tool_proficiency', g.`value`
FROM `grants` g
JOIN `classes` c ON c.`name` = g.`class_name` AND c.`ruleset` = '5'
JOIN `features` f ON f.`class_id` = c.`id` AND f.`feature_type` = 'proficiency_grant'
WHERE NOT EXISTS (SELECT 1 FROM `effects` e WHERE e.`type` = 'tool_proficiency' AND e.`value` = g.`value`);

WITH `grants` (`class_name`, `value`) AS (VALUES ('Roublard', '"Outils de voleur"'), ('Druide', '"Kit d''herboriste"'))
INSERT OR IGNORE INTO `feature_effects` (`feature_id`, `effect_id`)
SELECT f.`id`, (SELECT MIN(e.`id`) FROM `effects` e WHERE e.`type` = 'tool_proficiency' AND e.`value` = g.`value`)
FROM `grants` g
JOIN `classes` c ON c.`name` = g.`class_name` AND c.`ruleset` = '5'
JOIN `features` f ON f.`class_id` = c.`id` AND f.`feature_type` = 'proficiency_grant';

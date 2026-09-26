-- Défenses captivantes (Archifée, niv. 10) : immunité à l'état charmé (PHB 2014), pendant du seed
-- warlock.ts. Posée par migration pour que la prod n'attende pas de reseed.
--
-- Idempotent (NOT EXISTS / OR IGNORE sur la PK de feature_effects). Tolérant base vierge : gardé par
-- l'existence de la feature → 0 ligne, le seed pose alors le lien. La valeur JSON doit rester
-- identique à la sérialisation du seed, sinon `_seedEffects` créerait un second effet.

INSERT INTO `effects` (`type`, `value`)
SELECT 'condition_immunity', '{"condition":"charmed"}'
FROM `features` f
JOIN `subclasses` s ON f.`subclass_id` = s.`id`
JOIN `classes` c ON s.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5' AND s.`name` = 'L''Archifée'
  AND f.`name` = 'Défenses captivantes' AND f.`level_required` = 10
  AND NOT EXISTS (SELECT 1 FROM `effects` WHERE `type` = 'condition_immunity' AND `value` = '{"condition":"charmed"}');
INSERT OR IGNORE INTO `feature_effects` (`feature_id`, `effect_id`)
SELECT f.`id`, e.`id`
FROM `features` f
JOIN `subclasses` s ON f.`subclass_id` = s.`id`
JOIN `classes` c ON s.`class_id` = c.`id`
JOIN `effects` e ON e.`type` = 'condition_immunity' AND e.`value` = '{"condition":"charmed"}'
WHERE c.`name` = 'Occultiste' AND c.`ruleset` = '5' AND s.`name` = 'L''Archifée'
  AND f.`name` = 'Défenses captivantes' AND f.`level_required` = 10;

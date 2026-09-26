-- Champion primitif (Barbare, niv. 20) : « Votre maximum dans ces valeurs de caractéristique est
-- maintenant de 24 » → relèvement de +4 du maximum de FOR et CON, pendant du seed barbare.ts. Posé par
-- migration : la fiche plafonne désormais les scores, un Barbare 20 retomberait à 20 en attendant un reseed.
--
-- Idempotent (NOT EXISTS / OR IGNORE sur la PK de feature_effects). Tolérant base vierge : gardé par
-- l'existence de la feature → 0 ligne, le seed pose alors le lien. La valeur JSON doit rester
-- identique à la sérialisation du seed, sinon `_seedEffects` créerait un second effet.

INSERT INTO `effects` (`type`, `value`)
SELECT 'ability_max_increase', v.`value`
FROM (SELECT '{"ability":"str","amount":4}' AS `value` UNION ALL SELECT '{"ability":"con","amount":4}') v
WHERE EXISTS (
    SELECT 1 FROM `features` f
    JOIN `classes` c ON f.`class_id` = c.`id`
    WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5'
      AND f.`name` = 'Champion primitif' AND f.`level_required` = 20
  )
  AND NOT EXISTS (SELECT 1 FROM `effects` e WHERE e.`type` = 'ability_max_increase' AND e.`value` = v.`value`);
INSERT OR IGNORE INTO `feature_effects` (`feature_id`, `effect_id`)
SELECT f.`id`, e.`id`
FROM `features` f
JOIN `classes` c ON f.`class_id` = c.`id`
JOIN `effects` e ON e.`type` = 'ability_max_increase'
  AND e.`value` IN ('{"ability":"str","amount":4}', '{"ability":"con","amount":4}')
WHERE c.`name` = 'Barbare' AND c.`ruleset` = '5'
  AND f.`name` = 'Champion primitif' AND f.`level_required` = 20;

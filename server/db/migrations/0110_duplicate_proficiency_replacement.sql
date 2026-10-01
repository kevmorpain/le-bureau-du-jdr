-- Remplacement d'une maîtrise reçue en double (AideDD, Historiques : « Si un personnage gagne une même
-- maîtrise de deux sources différentes, il peut choisir une autre maîtrise de même nature (compétence ou
-- outil) à la place. »). Point de choix général : porteur `choice_carrier` sans propriétaire, deux
-- progressions dont le nombre dû vient du personnage (`duplicate_skills`, `duplicate_tools`). Pendant du
-- seed : server/db/seeds/lib/seedDuplicateReplacement.ts. Par migration et non par reseed : sans la
-- progression au déploiement, un pick serait refusé (leçon F3).
--
-- Idempotent (NOT EXISTS). Tolérant base vierge : créé seulement si le catalogue 2014 est seedé
-- (`backgrounds` non vide). Jamais BEGIN (D1).

INSERT INTO `features` (`name`, `feature_type`)
SELECT 'Maîtrise en double', 'choice_carrier'
WHERE EXISTS (SELECT 1 FROM `backgrounds` WHERE `ruleset` = '5' AND `character_sheet_id` IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM `features`
    WHERE `name` = 'Maîtrise en double' AND `feature_type` = 'choice_carrier' AND `class_id` IS NULL
  );

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, c.`kind`, c.`count`, c.`option_source`, 0
FROM `features` f
JOIN (
  SELECT 'skill' AS `kind`, '{"op":"var","name":"duplicate_skills"}' AS `count`, '{"type":"skills","from":"all"}' AS `option_source`
  UNION ALL
  SELECT 'tool', '{"op":"var","name":"duplicate_tools"}', '{"type":"tools"}'
) c
WHERE f.`name` = 'Maîtrise en double' AND f.`feature_type` = 'choice_carrier' AND f.`class_id` IS NULL
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = c.`kind`);

-- Choix des traits d'espèce et de lignée 2014 : Polyvalence du Demi-elfe (#107), outil du Nain (#133),
-- langue au choix de l'Humain, du Demi-elfe, du Haut-elfe et de la Fadette (#134), sort mineur du
-- Haut-elfe (#135). L'effet « au choix » du trait, que rien ne lisait, devient un point de choix
-- (`progression`) sur le même trait : le pick va en `character_choices`, la maîtrise est dérivée à la
-- lecture. Pendant du seed : champ `choice` des traits (server/db/seeds/data/speciesChoices.ts). Par
-- migration et non par reseed : sans la progression au déploiement, un pick serait refusé (leçon F3).
--
-- Piloté par les effets existants : tolérant base vierge (0 ligne) et idempotent (NOT EXISTS). Limité aux
-- traits d'espèce et de lignée : le don Linguiste garde son effet, lu avec les choix du don. Les
-- `option_source` reprennent la sérialisation du seed. Jamais BEGIN (D1).

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT fe.`feature_id`, 'skill', json_object('op', 'fixed', 'value', json_extract(e.`value`, '$.count')), '{"type":"skills","from":"all"}', 0
FROM `feature_effects` fe
JOIN `effects` e ON e.`id` = fe.`effect_id`
JOIN `features` f ON f.`id` = fe.`feature_id`
WHERE e.`type` = 'skill_proficiency_choice' AND f.`feature_type` IN ('species_trait', 'lineage_feature')
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = fe.`feature_id` AND p.`kind` = 'skill');

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT fe.`feature_id`, 'language', json_object('op', 'fixed', 'value', json_extract(e.`value`, '$.count')), '{"type":"languages"}', 0
FROM `feature_effects` fe
JOIN `effects` e ON e.`id` = fe.`effect_id`
JOIN `features` f ON f.`id` = fe.`feature_id`
WHERE e.`type` = 'language_proficiency_choice' AND f.`feature_type` IN ('species_trait', 'lineage_feature')
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = fe.`feature_id` AND p.`kind` = 'language');

-- L'effet du Nain portait des jetons faux (`artisan_tools`…) : la liste vient d'AideDD, noms du catalogue d'outils.
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT fe.`feature_id`, 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de forgeron","Matériel de brasseur","Outils de maçon"]}', 0
FROM `feature_effects` fe
JOIN `effects` e ON e.`id` = fe.`effect_id`
JOIN `features` f ON f.`id` = fe.`feature_id`
WHERE e.`type` = 'tool_proficiency_choice' AND f.`feature_type` IN ('species_trait', 'lineage_feature')
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = fe.`feature_id` AND p.`kind` = 'tool');

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT fe.`feature_id`, 'cantrip', json_object('op', 'fixed', 'value', json_extract(e.`value`, '$.count')), '{"type":"spells","spellClass":"wizard","cantripsOnly":true}', 0
FROM `feature_effects` fe
JOIN `effects` e ON e.`id` = fe.`effect_id`
JOIN `features` f ON f.`id` = fe.`feature_id`
WHERE e.`type` = 'spell_choice' AND json_extract(e.`value`, '$.class') = 'wizard' AND json_extract(e.`value`, '$.level') = 0
  AND f.`feature_type` IN ('species_trait', 'lineage_feature')
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = fe.`feature_id` AND p.`kind` = 'cantrip');

-- Après les INSERT, qui lisent ces liens.
DELETE FROM `feature_effects`
WHERE `effect_id` IN (SELECT `id` FROM `effects` WHERE `type` IN ('skill_proficiency_choice', 'language_proficiency_choice', 'tool_proficiency_choice', 'spell_choice'))
  AND `feature_id` IN (SELECT `id` FROM `features` WHERE `feature_type` IN ('species_trait', 'lineage_feature'));

-- Fadette : trait « Langues » absent (AideDD, UA « Peuples de la Féerie », « Créer votre personnage » :
-- le commun et une autre langue). La description, propre à ce trait, sert de clé aux instructions suivantes.
INSERT INTO `features` (`name`, `description`, `feature_type`)
SELECT 'Langues', 'Vous parlez, lisez et écrivez le commun et une autre langue que vous et votre MD reconnaissez comme appropriée pour le personnage.', 'species_trait'
FROM `character_species` s
WHERE s.`name` = 'Fadette' AND s.`ruleset` = '5'
  AND NOT EXISTS (
    SELECT 1 FROM `features` f JOIN `species_features` sf ON sf.`feature_id` = f.`id`
    WHERE sf.`species_id` = s.`id` AND f.`name` = 'Langues'
  );

INSERT OR IGNORE INTO `species_features` (`species_id`, `feature_id`)
SELECT s.`id`, f.`id`
FROM `character_species` s, `features` f
WHERE s.`name` = 'Fadette' AND s.`ruleset` = '5'
  AND f.`name` = 'Langues' AND f.`feature_type` = 'species_trait'
  AND f.`description` = 'Vous parlez, lisez et écrivez le commun et une autre langue que vous et votre MD reconnaissez comme appropriée pour le personnage.';

INSERT INTO `effects` (`type`, `value`)
SELECT 'language_proficiency', '"common"'
WHERE EXISTS (SELECT 1 FROM `character_species` WHERE `name` = 'Fadette' AND `ruleset` = '5')
  AND NOT EXISTS (SELECT 1 FROM `effects` WHERE `type` = 'language_proficiency' AND `value` = '"common"');

INSERT OR IGNORE INTO `feature_effects` (`feature_id`, `effect_id`)
SELECT f.`id`, (SELECT MIN(e.`id`) FROM `effects` e WHERE e.`type` = 'language_proficiency' AND e.`value` = '"common"')
FROM `features` f
WHERE f.`name` = 'Langues' AND f.`feature_type` = 'species_trait'
  AND f.`description` = 'Vous parlez, lisez et écrivez le commun et une autre langue que vous et votre MD reconnaissez comme appropriée pour le personnage.';

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'language', '{"op":"fixed","value":1}', '{"type":"languages"}', 0
FROM `features` f
WHERE f.`name` = 'Langues' AND f.`feature_type` = 'species_trait'
  AND f.`description` = 'Vous parlez, lisez et écrivez le commun et une autre langue que vous et votre MD reconnaissez comme appropriée pour le personnage.'
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'language');

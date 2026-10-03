-- Fadette, Magie des fées (#227) : la caractéristique d'incantation est au choix du joueur (AideDD, UA « Peuples
-- de la Féerie » : « l'Intelligence, la Sagesse ou le Charisme »), mais le seed la figeait au Charisme. Le trait
-- devient un point de choix `spellcasting_ability` ; le Charisme des effets `spell_grant` reste la valeur par
-- défaut des fiches sans pick. Pendant du seed : `fairyCastingAbilityChoice` (server/db/seeds/data/
-- speciesChoices.ts). Par migration et non par reseed : sans la progression au déploiement, un pick serait
-- refusé (leçon F3).
--
-- Idempotent (NOT EXISTS, REPLACE sans effet une fois la phrase changée). Tolérant base vierge : tout part de
-- `character_species` (vide pendant les migrations) → 0 ligne. Jamais BEGIN (D1).

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'spellcasting_ability', '{"op":"fixed","value":1}', '{"type":"enum","values":["int","wis","cha"]}', 0
FROM `features` f
JOIN `species_features` sf ON sf.`feature_id` = f.`id`
JOIN `character_species` s ON s.`id` = sf.`species_id` AND s.`name` = 'Fadette' AND s.`ruleset` = '5'
WHERE f.`name` = 'Magie des fées' AND f.`feature_type` = 'species_trait'
  AND NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'spellcasting_ability');

UPDATE `features`
SET `description` = REPLACE(`description`, ' (choisie à la création — ici le Charisme).', ', au choix.')
WHERE `name` = 'Magie des fées' AND `feature_type` = 'species_trait'
  AND `id` IN (
    SELECT sf.`feature_id` FROM `species_features` sf
    JOIN `character_species` s ON s.`id` = sf.`species_id` AND s.`name` = 'Fadette' AND s.`ruleset` = '5'
  );

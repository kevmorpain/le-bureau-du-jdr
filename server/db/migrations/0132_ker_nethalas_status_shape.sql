-- Reforme l'état en cours des survivants : une liste d'influences d'Overseer (une par événement 81-100) au lieu d'une
-- seule, et des compétences perdues en objets `{ skill }` pour pouvoir attendre le choix du joueur.
-- `json(...)` rétablit le sous-type JSON que les sous-requêtes et CASE font perdre ; sans lui, `json_set` écrirait du texte.
UPDATE `kn_characters`
SET `status` = json_set(
  json_remove(`status`, '$.domain.overseerInfluence'),
  '$.domain.overseerInfluences',
  json(CASE
    WHEN json_extract(`status`, '$.domain.overseerInfluence') IS NULL THEN '[]'
    ELSE json_array(json_extract(`status`, '$.domain.overseerInfluence'))
  END),
  '$.madness.lostSkills',
  json((SELECT json_group_array(json_object('skill', `value`)) FROM json_each(`status`, '$.madness.lostSkills')))
);

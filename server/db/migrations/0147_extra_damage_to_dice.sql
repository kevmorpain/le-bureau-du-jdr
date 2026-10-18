-- Demi-orc — Attaques sauvages : un dé de l'arme en plus au critique en mêlée, comme Critique brutal (`critical_extra_dice`)
INSERT INTO effects (type, value) SELECT 'critical_extra_dice', '{"dice":{"op":"fixed","value":1}}' WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'species_trait' AND name = 'Attaques sauvages') AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'critical_extra_dice' AND value = '{"dice":{"op":"fixed","value":1}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'critical_extra_dice' AND e.value = '{"dice":{"op":"fixed","value":1}}' WHERE f.feature_type = 'species_trait' AND f.name = 'Attaques sauvages';
DELETE FROM feature_effects WHERE effect_id IN (SELECT id FROM effects WHERE type = 'extra_damage' AND json_extract(value, '$.trigger') IS NOT NULL);
DELETE FROM effects WHERE type = 'extra_damage' AND json_extract(value, '$.trigger') IS NOT NULL;

-- Objets personnalisés : l'éditeur écrivait `extra_damage {die_count_notation, damage_type}`, que rien ne lisait. Même effet, sous la forme
-- que lit le Mode Combat (`weapon_damage_dice`), ligne par ligne pour garder les liens des objets. Une notation autre que « NdM » reste telle quelle.
UPDATE effects SET
  type = 'weapon_damage_dice',
  value = json_object(
    'name', 'Dégâts supplémentaires',
    'dice', json_object('op', 'fixed', 'value', CAST(substr(json_extract(value, '$.die_count_notation'), 1, instr(json_extract(value, '$.die_count_notation'), 'd') - 1) AS INTEGER)),
    'sides', CAST(substr(json_extract(value, '$.die_count_notation'), instr(json_extract(value, '$.die_count_notation'), 'd') + 1) AS INTEGER),
    'damageType', json_extract(value, '$.damage_type'),
    'weapons', 'all',
    'limit', 'each_hit'
  )
WHERE type = 'extra_damage'
  AND json_extract(value, '$.die_count_notation') GLOB '[1-9]*d[1-9]*'
  AND json_extract(value, '$.die_count_notation') NOT GLOB '*[^0-9d]*'
  AND length(json_extract(value, '$.die_count_notation')) - length(replace(json_extract(value, '$.die_count_notation'), 'd', '')) = 1
  AND json_extract(value, '$.damage_type') IS NOT NULL;

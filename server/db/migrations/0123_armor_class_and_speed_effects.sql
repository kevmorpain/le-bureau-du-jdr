-- CA sans armure et vitesse (lot 4 : #136 E7, #140 E11, #141 C1, #148 C8, #157 R10, #160 O3). Pose sur les features
-- déployées les effets `unarmored_defense` (Barbare, Moine, Résistance draconique) et `speed_bonus` (Déplacement rapide,
-- Déplacement sans armure), puis requalifie en `speed_bonus` les `walking_speed` utilisés comme BONUS (don Mobile, objets
-- personnalisés) : `walking_speed` reste la vitesse de base ABSOLUE des traits d'espèce et de lignée, que la fiche ne doit
-- jamais additionner. Pendant du seed : test/nuxt/armorClassSpeedMigration.test.ts compare les deux chemins.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (NOT EXISTS / INSERT OR IGNORE / UPDATE OR IGNORE). Limitée à
-- l'édition 2014 ; tolérante base vierge : rien n'est posé si la feature n'existe pas encore, le seed s'en charge alors.
-- Jamais BEGIN (D1).

-- Barbare — Défense sans armure (niv. 1) : 10 + DEX + CON, bouclier permis
INSERT INTO effects (type, value) SELECT 'unarmored_defense', '{"base":10,"abilities":["dex","con"],"shield":true}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Défense sans armure' AND f.level_required = 1) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'unarmored_defense' AND value = '{"base":10,"abilities":["dex","con"],"shield":true}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Défense sans armure' AND f.level_required = 1) fi JOIN effects e ON e.type = 'unarmored_defense' AND e.value = '{"base":10,"abilities":["dex","con"],"shield":true}';

-- Barbare — Déplacement rapide (niv. 5) : +3 m sans armure lourde
INSERT INTO effects (type, value) SELECT 'speed_bonus', '{"amount":{"op":"fixed","value":3},"while":"no_heavy_armor"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Déplacement rapide' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'speed_bonus' AND value = '{"amount":{"op":"fixed","value":3},"while":"no_heavy_armor"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Déplacement rapide' AND f.level_required = 5) fi JOIN effects e ON e.type = 'speed_bonus' AND e.value = '{"amount":{"op":"fixed","value":3},"while":"no_heavy_armor"}';

-- Moine — Défense sans armure (niv. 1) : 10 + DEX + SAG, ni armure ni bouclier
INSERT INTO effects (type, value) SELECT 'unarmored_defense', '{"base":10,"abilities":["dex","wis"],"shield":false}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Défense sans armure' AND f.level_required = 1) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'unarmored_defense' AND value = '{"base":10,"abilities":["dex","wis"],"shield":false}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Défense sans armure' AND f.level_required = 1) fi JOIN effects e ON e.type = 'unarmored_defense' AND e.value = '{"base":10,"abilities":["dex","wis"],"shield":false}';

-- Moine — Déplacement sans armure (niv. 2) : +3 m, +4,5 au 6, +6 au 10, +7,5 au 14, +9 au 18 (AideDD, « Mouvement sans armure »)
INSERT INTO effects (type, value) SELECT 'speed_bonus', '{"amount":{"op":"lookup","table":[0,3,3,3,3,4.5,4.5,4.5,4.5,6,6,6,6,7.5,7.5,7.5,7.5,9,9,9]},"while":"no_armor_no_shield"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Déplacement sans armure' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'speed_bonus' AND value = '{"amount":{"op":"lookup","table":[0,3,3,3,3,4.5,4.5,4.5,4.5,6,6,6,6,7.5,7.5,7.5,7.5,9,9,9]},"while":"no_armor_no_shield"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Déplacement sans armure' AND f.level_required = 2) fi JOIN effects e ON e.type = 'speed_bonus' AND e.value = '{"amount":{"op":"lookup","table":[0,3,3,3,3,4.5,4.5,4.5,4.5,6,6,6,6,7.5,7.5,7.5,7.5,9,9,9]},"while":"no_armor_no_shield"}';

-- Ensorceleur / Lignée draconique — Résistance draconique (niv. 1) : 13 + DEX sans armure
INSERT INTO effects (type, value) SELECT 'unarmored_defense', '{"base":13,"abilities":["dex"],"shield":true}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Lignée draconique' AND f.name = 'Résistance draconique' AND f.level_required = 1) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'unarmored_defense' AND value = '{"base":13,"abilities":["dex"],"shield":true}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Lignée draconique' AND f.name = 'Résistance draconique' AND f.level_required = 1) fi JOIN effects e ON e.type = 'unarmored_defense' AND e.value = '{"base":13,"abilities":["dex"],"shield":true}';

-- `walking_speed` utilisé comme bonus (don Mobile, objets personnalisés) → `speed_bonus`. Les liens des traits d'espèce ne
-- sont pas touchés : une même ligne `effects` peut servir une espèce (9) et un objet (9).
INSERT INTO effects (type, value)
SELECT DISTINCT 'speed_bonus', '{"amount":{"op":"fixed","value":' || e.value || '}}'
FROM effects e
WHERE e.type = 'walking_speed'
  AND (e.id IN (SELECT effect_id FROM item_effects)
    OR e.id IN (SELECT fe.effect_id FROM feature_effects fe JOIN features f ON f.id = fe.feature_id WHERE f.feature_type = 'feat'))
  AND NOT EXISTS (SELECT 1 FROM effects x WHERE x.type = 'speed_bonus' AND x.value = '{"amount":{"op":"fixed","value":' || e.value || '}}');

UPDATE OR IGNORE item_effects
SET effect_id = (SELECT n.id FROM effects n JOIN effects o ON o.id = item_effects.effect_id WHERE n.type = 'speed_bonus' AND n.value = '{"amount":{"op":"fixed","value":' || o.value || '}}')
WHERE effect_id IN (SELECT id FROM effects WHERE type = 'walking_speed');
DELETE FROM item_effects WHERE effect_id IN (SELECT id FROM effects WHERE type = 'walking_speed');

UPDATE OR IGNORE feature_effects
SET effect_id = (SELECT n.id FROM effects n JOIN effects o ON o.id = feature_effects.effect_id WHERE n.type = 'speed_bonus' AND n.value = '{"amount":{"op":"fixed","value":' || o.value || '}}')
WHERE effect_id IN (SELECT id FROM effects WHERE type = 'walking_speed')
  AND feature_id IN (SELECT id FROM features WHERE feature_type = 'feat');
DELETE FROM feature_effects
WHERE effect_id IN (SELECT id FROM effects WHERE type = 'walking_speed')
  AND feature_id IN (SELECT id FROM features WHERE feature_type = 'feat');

DELETE FROM effects
WHERE type = 'walking_speed'
  AND id NOT IN (SELECT effect_id FROM feature_effects)
  AND id NOT IN (SELECT effect_id FROM item_effects);

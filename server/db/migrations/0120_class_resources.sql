-- Ressources de classe (lot 11 : #142 C2, #143 C3, #144 C4, #145 C5, #146 C6, #147 C7). Pose sur les features déployées
-- les compteurs (`max_uses_formula`), les métadonnées (`meta` : clé de réserve, dépenses, effets de la Rage…) et les effets
-- typés (attaques par action, dés de dégâts, dé d'Inspiration bardique, regain au repos, Châtiment divin, Forme sauvage)
-- que déclarent les seeds de classe. Pendant du seed : test/fixtures/classResourcePatches.ts, gardé par
-- test/nuxt/classResourcesMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (UPDATE de valeurs fixes, NOT EXISTS / INSERT OR IGNORE). Limitée à
-- l'édition 2014 ; tolérante base vierge : rien n'est posé si la feature n'existe pas encore, le seed s'en charge alors.
-- Jamais BEGIN (D1).

-- Barbare — Rage (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"lookup","table":[2,2,3,3,3,4,4,4,4,4,4,5,5,5,5,5,6,6,6,6]}', meta = '{"resource":"rage","unlimitedFromClassLevel":20,"suspendedByHeavyArmor":true,"whileActive":[{"type":"damage_resistance","value":{"damageType":"bludgeoning"}},{"type":"damage_resistance","value":{"damageType":"piercing"}},{"type":"damage_resistance","value":{"damageType":"slashing"}},{"type":"melee_strength_damage_bonus","value":{"amount":{"op":"lookup","table":[2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,4,4,4]}}}]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Rage' AND f.level_required = 1);

-- Barbare — Attaque supplémentaire (niv. 5)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"fixed","value":2}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"fixed","value":2}}';

-- Barde — Inspiration bardique (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"var","name":"cha_mod"}}', meta = '{"resource":"bardic_inspiration"}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Inspiration bardique' AND f.level_required = 1);
INSERT INTO effects (type, value) SELECT 'resource_die', '{"sides":{"op":"lookup","table":[6,6,6,6,8,8,8,8,8,10,10,10,10,10,12,12,12,12,12,12]}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Inspiration bardique' AND f.level_required = 1) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'resource_die' AND value = '{"sides":{"op":"lookup","table":[6,6,6,6,8,8,8,8,8,10,10,10,10,10,12,12,12,12,12,12]}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Inspiration bardique' AND f.level_required = 1) fi JOIN effects e ON e.type = 'resource_die' AND e.value = '{"sides":{"op":"lookup","table":[6,6,6,6,8,8,8,8,8,10,10,10,10,10,12,12,12,12,12,12]}}';

-- Barde — Source d'inspiration (niv. 5)
INSERT INTO effects (type, value) SELECT 'resource_regain', '{"resource":"bardic_inspiration","amount":"all","on":"short_rest"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Source d''inspiration' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'resource_regain' AND value = '{"resource":"bardic_inspiration","amount":"all","on":"short_rest"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Source d''inspiration' AND f.level_required = 5) fi JOIN effects e ON e.type = 'resource_regain' AND e.value = '{"resource":"bardic_inspiration","amount":"all","on":"short_rest"}';

-- Barde / Collège de la vaillance — Attaque supplémentaire (niv. 6)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"fixed","value":2}}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND s.name = 'Collège de la vaillance' AND f.name = 'Attaque supplémentaire' AND f.level_required = 6) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND s.name = 'Collège de la vaillance' AND f.name = 'Attaque supplémentaire' AND f.level_required = 6) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"fixed","value":2}}';

-- Clerc — Conduit divin (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"lookup","table":[1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3]}', meta = '{"resource":"channel_divinity"}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND f.name = 'Conduit divin' AND f.level_required = 2);

-- Druide — Forme sauvage (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":2}', meta = '{"resource":"wild_shape"}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND f.name = 'Forme sauvage' AND f.level_required = 2);
INSERT INTO effects (type, value) SELECT 'beast_shape', '{"hoursDivisor":2,"tiers":[{"fromClassLevel":2,"maxChallenge":0.25,"flying":false,"swimming":false},{"fromClassLevel":4,"maxChallenge":0.5,"flying":false,"swimming":true},{"fromClassLevel":8,"maxChallenge":1,"flying":true,"swimming":true}]}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND f.name = 'Forme sauvage' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'beast_shape' AND value = '{"hoursDivisor":2,"tiers":[{"fromClassLevel":2,"maxChallenge":0.25,"flying":false,"swimming":false},{"fromClassLevel":4,"maxChallenge":0.5,"flying":false,"swimming":true},{"fromClassLevel":8,"maxChallenge":1,"flying":true,"swimming":true}]}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND f.name = 'Forme sauvage' AND f.level_required = 2) fi JOIN effects e ON e.type = 'beast_shape' AND e.value = '{"hoursDivisor":2,"tiers":[{"fromClassLevel":2,"maxChallenge":0.25,"flying":false,"swimming":false},{"fromClassLevel":4,"maxChallenge":0.5,"flying":false,"swimming":true},{"fromClassLevel":8,"maxChallenge":1,"flying":true,"swimming":true}]}';

-- Druide / Cercle de la lune — Formes du cercle (niv. 2)
INSERT INTO effects (type, value) SELECT 'beast_shape_challenge', '{"maxChallenge":{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"floor","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":3}}}}}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND s.name = 'Cercle de la lune' AND f.name = 'Formes du cercle' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'beast_shape_challenge' AND value = '{"maxChallenge":{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"floor","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":3}}}}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND s.name = 'Cercle de la lune' AND f.name = 'Formes du cercle' AND f.level_required = 2) fi JOIN effects e ON e.type = 'beast_shape_challenge' AND e.value = '{"maxChallenge":{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"floor","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":3}}}}}';

-- Ensorceleur — Source de magie (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"var","name":"class_level"}', meta = '{"resource":"sorcery_points","pool":true}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Source de magie' AND f.level_required = 2);

-- Ensorceleur — Restauration ensorcelée (niv. 20)
INSERT INTO effects (type, value) SELECT 'resource_regain', '{"resource":"sorcery_points","amount":4,"on":"short_rest"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Restauration ensorcelée' AND f.level_required = 20) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'resource_regain' AND value = '{"resource":"sorcery_points","amount":4,"on":"short_rest"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Restauration ensorcelée' AND f.level_required = 20) fi JOIN effects e ON e.type = 'resource_regain' AND e.value = '{"resource":"sorcery_points","amount":4,"on":"short_rest"}';

-- Ensorceleur — Sort accéléré (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":2}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort accéléré' AND f.level_required = 3);

-- Ensorceleur — Sort ample (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort ample' AND f.level_required = 3);

-- Ensorceleur — Sort étendu (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort étendu' AND f.level_required = 3);

-- Ensorceleur — Sort intensifié (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":3}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort intensifié' AND f.level_required = 3);

-- Ensorceleur — Sort jumeau (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":"spell_level"}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort jumeau' AND f.level_required = 3);

-- Ensorceleur — Sort prévenant (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort prévenant' AND f.level_required = 3);

-- Ensorceleur — Sort renforcé (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort renforcé' AND f.level_required = 3);

-- Ensorceleur — Sort subtil (niv. 3)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Sort subtil' AND f.level_required = 3);

-- Ensorceleur / Lignée draconique — Affinité élémentaire (niv. 6)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Lignée draconique' AND f.name = 'Affinité élémentaire' AND f.level_required = 6);

-- Ensorceleur / Lignée draconique — Présence draconique (niv. 18)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":5}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Lignée draconique' AND f.name = 'Présence draconique' AND f.level_required = 18);

-- Ensorceleur / Magie sauvage — Chance forcée (niv. 6)
UPDATE features SET meta = '{"cost":{"resource":"sorcery_points","amount":2}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Magie sauvage' AND f.name = 'Chance forcée' AND f.level_required = 6);

-- Guerrier — Second souffle (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND f.name = 'Second souffle' AND f.level_required = 1);

-- Guerrier — Fougue (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"lookup","table":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND f.name = 'Fougue' AND f.level_required = 2);

-- Guerrier — Attaque supplémentaire (niv. 5)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"lookup","table":[1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4]}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"lookup","table":[1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4]}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"lookup","table":[1,1,1,1,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,4]}}';

-- Guerrier — Inflexible (niv. 9)
UPDATE features SET max_uses_formula = '{"op":"lookup","table":[1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,3,3,3]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND f.name = 'Inflexible' AND f.level_required = 9);

-- Moine — Ki (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"var","name":"class_level"}', meta = '{"resource":"ki","pool":true,"saveDcAbility":"wis","spends":[{"label":"Défense patiente","amount":1},{"label":"Déluge de coups","amount":1},{"label":"Déplacement aérien","amount":1},{"label":"Parade de projectiles (renvoi)","amount":1,"minClassLevel":3},{"label":"Frappe étourdissante","amount":1,"minClassLevel":5}]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Ki' AND f.level_required = 2);

-- Moine — Attaque supplémentaire (niv. 5)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"fixed","value":2}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"fixed","value":2}}';

-- Paladin — Imposition des mains (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"mul","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":5}}', meta = '{"resource":"lay_on_hands","pool":true,"spends":[{"label":"Guérir une maladie ou neutraliser un poison","amount":5}]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Imposition des mains' AND f.level_required = 1);

-- Paladin — Châtiment divin (niv. 2)
UPDATE features SET description = 'À partir du niveau 2, quand vous touchez une créature avec une arme de corps à corps, vous pouvez utiliser n''importe quel emplacement de sort (de paladin ou autre) pour châtier cette créature et lui infliger des dégâts radiants supplémentaires : 2d8 pour un emplacement de niveau 1, plus 1d8 pour chaque niveau d''emplacement au-delà du 1er, jusqu''à un maximum de 5d8. Si la créature est un mort-vivant ou un fiélon, les dégâts augmentent de 1d8, jusqu''à un maximum de 6d8.' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Châtiment divin' AND f.level_required = 2);
INSERT INTO effects (type, value) SELECT 'slot_damage_dice', '{"name":"Châtiment divin","sides":8,"damageType":"radiant","baseDice":2,"maxDice":5,"bonus":{"when":"Mort-vivant ou fiélon","dice":1,"maxDice":6}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Châtiment divin' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'slot_damage_dice' AND value = '{"name":"Châtiment divin","sides":8,"damageType":"radiant","baseDice":2,"maxDice":5,"bonus":{"when":"Mort-vivant ou fiélon","dice":1,"maxDice":6}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Châtiment divin' AND f.level_required = 2) fi JOIN effects e ON e.type = 'slot_damage_dice' AND e.value = '{"name":"Châtiment divin","sides":8,"damageType":"radiant","baseDice":2,"maxDice":5,"bonus":{"when":"Mort-vivant ou fiélon","dice":1,"maxDice":6}}';

-- Paladin — Conduit divin (niv. 3)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', meta = '{"resource":"channel_divinity"}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Conduit divin' AND f.level_required = 3);

-- Paladin — Attaque supplémentaire (niv. 5)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"fixed","value":2}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"fixed","value":2}}';

-- Paladin — Châtiment divin amélioré (niv. 11)
INSERT INTO effects (type, value) SELECT 'weapon_damage_dice', '{"name":"Châtiment divin amélioré","dice":{"op":"fixed","value":1},"sides":8,"damageType":"radiant","weapons":"melee","limit":"each_hit"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Châtiment divin amélioré' AND f.level_required = 11) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'weapon_damage_dice' AND value = '{"name":"Châtiment divin amélioré","dice":{"op":"fixed","value":1},"sides":8,"damageType":"radiant","weapons":"melee","limit":"each_hit"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Châtiment divin amélioré' AND f.level_required = 11) fi JOIN effects e ON e.type = 'weapon_damage_dice' AND e.value = '{"name":"Châtiment divin amélioré","dice":{"op":"fixed","value":1},"sides":8,"damageType":"radiant","weapons":"melee","limit":"each_hit"}';

-- Rôdeur — Attaque supplémentaire (niv. 5)
INSERT INTO effects (type, value) SELECT 'extra_attack', '{"attacks":{"op":"fixed","value":2}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Rôdeur' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'extra_attack' AND value = '{"attacks":{"op":"fixed","value":2}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Rôdeur' AND c.ruleset = '5' AND f.name = 'Attaque supplémentaire' AND f.level_required = 5) fi JOIN effects e ON e.type = 'extra_attack' AND e.value = '{"attacks":{"op":"fixed","value":2}}';

-- Roublard — Attaque sournoise (niv. 1)
INSERT INTO effects (type, value) SELECT 'weapon_damage_dice', '{"name":"Attaque sournoise","dice":{"op":"ceil","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":2}}},"sides":6,"weapons":"finesse_or_ranged","limit":"once_per_turn","condition":"Avantage au jet d''attaque, ou un ennemi de la cible à 1,50 m ou moins (non incapable d''agir) sans désavantage"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Attaque sournoise' AND f.level_required = 1) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'weapon_damage_dice' AND value = '{"name":"Attaque sournoise","dice":{"op":"ceil","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":2}}},"sides":6,"weapons":"finesse_or_ranged","limit":"once_per_turn","condition":"Avantage au jet d''attaque, ou un ennemi de la cible à 1,50 m ou moins (non incapable d''agir) sans désavantage"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Attaque sournoise' AND f.level_required = 1) fi JOIN effects e ON e.type = 'weapon_damage_dice' AND e.value = '{"name":"Attaque sournoise","dice":{"op":"ceil","value":{"op":"div","left":{"op":"var","name":"class_level"},"right":{"op":"fixed","value":2}}},"sides":6,"weapons":"finesse_or_ranged","limit":"once_per_turn","condition":"Avantage au jet d''attaque, ou un ennemi de la cible à 1,50 m ou moins (non incapable d''agir) sans désavantage"}';

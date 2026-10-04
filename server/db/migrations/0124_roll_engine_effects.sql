-- Moteur de jets (lot 5 : #108 R1, #132 E2, #140 E11, #149 C9, #150 R2). Pose sur les features déployées les effets que le
-- lanceur de dés applique : demi-maîtrise (Touche-à-tout, Athlète accompli), plancher de Savoir-faire, plage de critique du
-- Champion, dés supplémentaires de Critique brutal, Esquive instinctive, avantage de l'initiative (Instinct sauvage) et de la
-- Rage (Force). Corrige aussi la description de Critique brutal : AideDD ne la limite pas à la rage. Pendant du seed :
-- test/nuxt/rollEffectsMigration.test.ts compare les deux chemins.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (NOT EXISTS / INSERT OR IGNORE / garde LIKE sur la Rage). Limitée à
-- l'édition 2014 ; tolérante base vierge : rien n'est posé si la feature n'existe pas encore, le seed s'en charge alors.
-- Jamais BEGIN (D1).

-- Barde — Touche-à-tout (niv. 2) : moitié de la maîtrise, arrondie à l'inférieur
INSERT INTO effects (type, value) SELECT 'half_proficiency', '{"abilities":"all","rounding":"down"}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Touche-à-tout' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'half_proficiency' AND value = '{"abilities":"all","rounding":"down"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Touche-à-tout' AND f.level_required = 2) fi JOIN effects e ON e.type = 'half_proficiency' AND e.value = '{"abilities":"all","rounding":"down"}';

-- Guerrier / Champion — Critique amélioré (niv. 3) : critique dès 19
INSERT INTO effects (type, value) SELECT 'critical_range', '{"from":19}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Critique amélioré' AND f.level_required = 3) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'critical_range' AND value = '{"from":19}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Critique amélioré' AND f.level_required = 3) fi JOIN effects e ON e.type = 'critical_range' AND e.value = '{"from":19}';

-- Guerrier / Champion — Athlète accompli (niv. 7) : moitié de la maîtrise, arrondie au supérieur, à Force / Dextérité / Constitution
INSERT INTO effects (type, value) SELECT 'half_proficiency', '{"abilities":["str","dex","con"],"rounding":"up"}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Athlète accompli' AND f.level_required = 7) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'half_proficiency' AND value = '{"abilities":["str","dex","con"],"rounding":"up"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Athlète accompli' AND f.level_required = 7) fi JOIN effects e ON e.type = 'half_proficiency' AND e.value = '{"abilities":["str","dex","con"],"rounding":"up"}';

-- Guerrier / Champion — Critique supérieur (niv. 15) : critique dès 18
INSERT INTO effects (type, value) SELECT 'critical_range', '{"from":18}' WHERE EXISTS (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Critique supérieur' AND f.level_required = 15) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'critical_range' AND value = '{"from":18}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Guerrier' AND c.ruleset = '5' AND s.name = 'Champion' AND f.name = 'Critique supérieur' AND f.level_required = 15) fi JOIN effects e ON e.type = 'critical_range' AND e.value = '{"from":18}';

-- Roublard — Esquive instinctive (niv. 5) : réaction, dégâts ÷ 2
INSERT INTO effects (type, value) SELECT 'halve_damage_reaction', '{}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Esquive instinctive' AND f.level_required = 5) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'halve_damage_reaction' AND value = '{}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Esquive instinctive' AND f.level_required = 5) fi JOIN effects e ON e.type = 'halve_damage_reaction' AND e.value = '{}';

-- Roublard — Savoir-faire (niv. 11) : plancher de 10 aux jets de compétence maîtrisée
INSERT INTO effects (type, value) SELECT 'proficient_check_minimum', '{"minimum":10}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Savoir-faire' AND f.level_required = 11) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'proficient_check_minimum' AND value = '{"minimum":10}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Savoir-faire' AND f.level_required = 11) fi JOIN effects e ON e.type = 'proficient_check_minimum' AND e.value = '{"minimum":10}';

-- Barbare — Instinct sauvage (niv. 7) : avantage à l'initiative
INSERT INTO effects (type, value) SELECT 'advantage', '{"rollType":"initiative","ability":"all","condition":""}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Instinct sauvage' AND f.level_required = 7) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'advantage' AND value = '{"rollType":"initiative","ability":"all","condition":""}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Instinct sauvage' AND f.level_required = 7) fi JOIN effects e ON e.type = 'advantage' AND e.value = '{"rollType":"initiative","ability":"all","condition":""}';

-- Barbare — Critique brutal (niv. 9) : 1 / 2 / 3 dés de l'arme en plus au critique en mêlée
INSERT INTO effects (type, value) SELECT 'critical_extra_dice', '{"dice":{"op":"lookup","table":[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3]}}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Critique brutal' AND f.level_required = 9) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'critical_extra_dice' AND value = '{"dice":{"op":"lookup","table":[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3]}}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Critique brutal' AND f.level_required = 9) fi JOIN effects e ON e.type = 'critical_extra_dice' AND e.value = '{"dice":{"op":"lookup","table":[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3]}}';

-- Barbare — Critique brutal : description d'AideDD (le bonus ne dépend pas de la rage)
UPDATE features SET description = 'À partir du niveau 9, vous pouvez lancer un dé de dégâts de votre arme en plus lorsque vous déterminez les dégâts supplémentaires que vous infligez sur un coup critique réussi avec une attaque au corps à corps. Ce bonus aux dégâts passe à deux dés au niveau 13 et à trois dés au niveau 17.' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Critique brutal' AND f.level_required = 9);

-- Barbare — Rage (niv. 1) : avantage aux jets de caractéristique et de sauvegarde de Force, tant qu'elle est active
UPDATE features SET meta = json_insert(meta, '$.whileActive[#]', json('{"type":"advantage","value":{"rollType":"check","ability":"str","condition":""}}')) WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Rage' AND f.level_required = 1) AND meta IS NOT NULL AND meta NOT LIKE '%"rollType":"check","ability":"str"%';
UPDATE features SET meta = json_insert(meta, '$.whileActive[#]', json('{"type":"advantage","value":{"rollType":"saving_throw","ability":"str","condition":""}}')) WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Rage' AND f.level_required = 1) AND meta IS NOT NULL AND meta NOT LIKE '%"rollType":"saving_throw","ability":"str"%';

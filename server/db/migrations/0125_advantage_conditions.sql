-- Conditions d'avantage et bonus de dégâts de sorts (lot 5, suite : #140 E11). Rend interprétables les avantages que le
-- moteur de jets ne savait pas lire : Attaque téméraire devient une capacité qui s'active (avantage aux attaques de mêlée
-- avec la Force, jusqu'au « Nouveau tour »), Sens du danger gagne sa restriction (ni aveuglé, ni assourdi, ni incapable
-- d'agir), et l'Attaque sournoise sait qu'elle dépend de l'avantage au jet d'attaque. Corrige aussi la description
-- d'Attaque téméraire (« premier tour de chaque combat » : AideDD dit « première attaque de votre tour »). Pendant du seed :
-- test/nuxt/advantageConditionsMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (UPDATE de valeurs fixes, NOT EXISTS / INSERT OR IGNORE, garde sur
-- l'effet de la Sournoise). Limitée à l'édition 2014 ; tolérante base vierge : rien n'est posé si la feature n'existe pas
-- encore, le seed s'en charge alors. Jamais BEGIN (D1).

-- Barbare — Attaque téméraire (niv. 2) : capacité activable, avantage d'attaque de mêlée avec la Force
UPDATE features SET action_type = 'free', meta = '{"whileActive":[{"type":"advantage","value":{"rollType":"attack","ability":"all","condition":"","scope":"strength_melee"}}],"endsOnNewTurn":true}', description = 'À partir du niveau 2, vous pouvez mettre de côté votre défense pour attaquer avec toute la violence du désespoir. Lorsque vous effectuez la première attaque de votre tour, vous pouvez décider d''effectuer une Attaque téméraire. Vous obtenez ainsi un avantage aux jets d''attaque au corps à corps avec une arme utilisant la Force durant ce tour, mais les attaques effectuées contre vous ont également un avantage jusqu''à votre prochain tour.' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Attaque téméraire' AND f.level_required = 2);

-- Barbare — Sens du danger (niv. 2) : avantage aux sauvegardes de Dextérité contre les effets visibles, sauf aveuglé / assourdi / incapable d'agir
INSERT INTO effects (type, value) SELECT 'advantage', '{"rollType":"saving_throw","ability":"dex","condition":"visible_effects","unless":["blinded","deafened","incapacitated"]}' WHERE EXISTS (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Sens du danger' AND f.level_required = 2) AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'advantage' AND value = '{"rollType":"saving_throw","ability":"dex","condition":"visible_effects","unless":["blinded","deafened","incapacitated"]}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT fi.id, e.id FROM (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barbare' AND c.ruleset = '5' AND f.name = 'Sens du danger' AND f.level_required = 2) fi JOIN effects e ON e.type = 'advantage' AND e.value = '{"rollType":"saving_throw","ability":"dex","condition":"visible_effects","unless":["blinded","deafened","incapacitated"]}';

-- Roublard — Attaque sournoise : l'avantage au jet d'attaque suffit à la déclencher
UPDATE effects SET value = json_set(value, '$.needsAdvantage', json('true')) WHERE type = 'weapon_damage_dice' AND json_extract(value, '$.name') = 'Attaque sournoise' AND json_extract(value, '$.needsAdvantage') IS NULL AND id IN (SELECT fe.effect_id FROM feature_effects fe WHERE fe.feature_id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Attaque sournoise' AND f.level_required = 1));

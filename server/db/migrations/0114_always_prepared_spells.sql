-- Sorts de domaine du Clerc et de serment du Paladin : toujours préparés, hors de la limite quotidienne
-- (AideDD, tableaux « sorts de domaine » et « sorts de serment »). Posés comme effets `always_prepared_spell`
-- sur la feature qui les décrit ; la fiche les DÉRIVE de la sous-classe et du niveau de classe (rien n'est
-- matérialisé, donc rien à rattraper sur les fiches existantes ni quand le catalogue gagne un sort).
-- Pendant du seed : server/db/seeds/data/alwaysPreparedSpells.ts, gardé par test/nuxt/alwaysPreparedMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (NOT EXISTS / INSERT OR IGNORE). Limitée à l'édition
-- 2014 ; tolérante base vierge : un effet n'est créé que si la feature qui le porte existe. Jamais BEGIN (D1).

-- Domaine de la vie
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Bénédiction","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Bénédiction","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Soins","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Soins","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Arme spirituelle","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Arme spirituelle","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Restauration partielle","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Restauration partielle","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lueur d''espoir","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lueur d''espoir","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Retour à la vie","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Retour à la vie","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Gardien de la foi","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Gardien de la foi","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Protection contre la mort","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Protection contre la mort","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Rappel à la vie","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Rappel à la vie","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Soins de groupe","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Soins de groupe","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Bénédiction","unlockLevel":1}',
  '{"spellName":"Soins","unlockLevel":1}',
  '{"spellName":"Arme spirituelle","unlockLevel":3}',
  '{"spellName":"Restauration partielle","unlockLevel":3}',
  '{"spellName":"Lueur d''espoir","unlockLevel":5}',
  '{"spellName":"Retour à la vie","unlockLevel":5}',
  '{"spellName":"Gardien de la foi","unlockLevel":7}',
  '{"spellName":"Protection contre la mort","unlockLevel":7}',
  '{"spellName":"Rappel à la vie","unlockLevel":9}',
  '{"spellName":"Soins de groupe","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Vie' AND s.name = 'Domaine de la vie' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine de la lumière
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lueurs féeriques","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lueurs féeriques","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mains brûlantes","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mains brûlantes","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Rayon ardent","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Rayon ardent","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Sphère de feu","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Sphère de feu","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Boule de feu","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Boule de feu","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lumière du jour","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lumière du jour","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Gardien de la foi","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Gardien de la foi","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mur de feu","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mur de feu","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Colonne de flamme","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Colonne de flamme","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Scrutation","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Scrutation","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Lueurs féeriques","unlockLevel":1}',
  '{"spellName":"Mains brûlantes","unlockLevel":1}',
  '{"spellName":"Rayon ardent","unlockLevel":3}',
  '{"spellName":"Sphère de feu","unlockLevel":3}',
  '{"spellName":"Boule de feu","unlockLevel":5}',
  '{"spellName":"Lumière du jour","unlockLevel":5}',
  '{"spellName":"Gardien de la foi","unlockLevel":7}',
  '{"spellName":"Mur de feu","unlockLevel":7}',
  '{"spellName":"Colonne de flamme","unlockLevel":9}',
  '{"spellName":"Scrutation","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Lumière' AND s.name = 'Domaine de la lumière' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine de la guerre
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Bouclier de la foi","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Bouclier de la foi","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Faveur divine","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Faveur divine","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Arme magique","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Arme magique","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Arme spirituelle","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Arme spirituelle","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Aura du croisé","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Aura du croisé","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Esprits gardiens","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Esprits gardiens","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Peau de pierre","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Peau de pierre","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Colonne de flamme","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Colonne de flamme","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Immobilisation de monstre","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Immobilisation de monstre","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Bouclier de la foi","unlockLevel":1}',
  '{"spellName":"Faveur divine","unlockLevel":1}',
  '{"spellName":"Arme magique","unlockLevel":3}',
  '{"spellName":"Arme spirituelle","unlockLevel":3}',
  '{"spellName":"Aura du croisé","unlockLevel":5}',
  '{"spellName":"Esprits gardiens","unlockLevel":5}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7}',
  '{"spellName":"Peau de pierre","unlockLevel":7}',
  '{"spellName":"Colonne de flamme","unlockLevel":9}',
  '{"spellName":"Immobilisation de monstre","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Guerre' AND s.name = 'Domaine de la guerre' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine de la tempête
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Nappe de brouillard","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Nappe de brouillard","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Vague tonnante","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Vague tonnante","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Bourrasque","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Bourrasque","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fracassement","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fracassement","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Appel de la foudre","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Appel de la foudre","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Tempête de neige","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Tempête de neige","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Contrôle de l''eau","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Contrôle de l''eau","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Tempête de grêle","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Tempête de grêle","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Vague destructrice","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Vague destructrice","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Nappe de brouillard","unlockLevel":1}',
  '{"spellName":"Vague tonnante","unlockLevel":1}',
  '{"spellName":"Bourrasque","unlockLevel":3}',
  '{"spellName":"Fracassement","unlockLevel":3}',
  '{"spellName":"Appel de la foudre","unlockLevel":5}',
  '{"spellName":"Tempête de neige","unlockLevel":5}',
  '{"spellName":"Contrôle de l''eau","unlockLevel":7}',
  '{"spellName":"Tempête de grêle","unlockLevel":7}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9}',
  '{"spellName":"Vague destructrice","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Tempête' AND s.name = 'Domaine de la tempête' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine de la nature
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Amitié avec les animaux","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Amitié avec les animaux","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communication avec les animaux","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communication avec les animaux","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance d''épines","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance d''épines","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Peau d''écorce","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Peau d''écorce","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance végétale","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance végétale","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mur de vent","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mur de vent","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Domination de bête","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Domination de bête","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liane avide","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liane avide","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passage par les arbres","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passage par les arbres","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Amitié avec les animaux","unlockLevel":1}',
  '{"spellName":"Communication avec les animaux","unlockLevel":1}',
  '{"spellName":"Croissance d''épines","unlockLevel":3}',
  '{"spellName":"Peau d''écorce","unlockLevel":3}',
  '{"spellName":"Croissance végétale","unlockLevel":5}',
  '{"spellName":"Mur de vent","unlockLevel":5}',
  '{"spellName":"Domination de bête","unlockLevel":7}',
  '{"spellName":"Liane avide","unlockLevel":7}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9}',
  '{"spellName":"Passage par les arbres","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Nature' AND s.name = 'Domaine de la nature' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine de la duperie
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Charme-personne","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Charme-personne","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Déguisement","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Déguisement","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Image miroir","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Image miroir","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passage sans trace","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passage sans trace","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Clignotement","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Clignotement","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Dissipation de la magie","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Dissipation de la magie","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Métamorphose","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Métamorphose","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Porte dimensionnelle","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Porte dimensionnelle","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Domination de personne","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Domination de personne","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Modification de mémoire","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Modification de mémoire","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Charme-personne","unlockLevel":1}',
  '{"spellName":"Déguisement","unlockLevel":1}',
  '{"spellName":"Image miroir","unlockLevel":3}',
  '{"spellName":"Passage sans trace","unlockLevel":3}',
  '{"spellName":"Clignotement","unlockLevel":5}',
  '{"spellName":"Dissipation de la magie","unlockLevel":5}',
  '{"spellName":"Métamorphose","unlockLevel":7}',
  '{"spellName":"Porte dimensionnelle","unlockLevel":7}',
  '{"spellName":"Domination de personne","unlockLevel":9}',
  '{"spellName":"Modification de mémoire","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Tromperie' AND s.name = 'Domaine de la duperie' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Domaine du savoir
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Identification","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Identification","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Injonction","unlockLevel":1}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Injonction","unlockLevel":1}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Augure","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Augure","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Suggestion","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Suggestion","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Antidétection","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Antidétection","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communication avec les morts","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communication avec les morts","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Confusion","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Confusion","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Œil magique","unlockLevel":7}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Œil magique","unlockLevel":7}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mythes et légendes","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mythes et légendes","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Scrutation","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Scrutation","unlockLevel":9}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Identification","unlockLevel":1}',
  '{"spellName":"Injonction","unlockLevel":1}',
  '{"spellName":"Augure","unlockLevel":3}',
  '{"spellName":"Suggestion","unlockLevel":3}',
  '{"spellName":"Antidétection","unlockLevel":5}',
  '{"spellName":"Communication avec les morts","unlockLevel":5}',
  '{"spellName":"Confusion","unlockLevel":7}',
  '{"spellName":"Œil magique","unlockLevel":7}',
  '{"spellName":"Mythes et légendes","unlockLevel":9}',
  '{"spellName":"Scrutation","unlockLevel":9}'
)
WHERE f.name = 'Sorts de domaine Connaissance' AND s.name = 'Domaine du savoir' AND c.name = 'Clerc' AND c.ruleset = '5';

-- Serment de dévotion
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Protection contre le mal et le bien","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Protection contre le mal et le bien","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Sanctuaire","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Sanctuaire","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Restauration partielle","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Restauration partielle","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Zone de vérité","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Zone de vérité","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Dissipation de la magie","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Dissipation de la magie","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lueur d''espoir","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lueur d''espoir","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Gardien de la foi","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Gardien de la foi","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Colonne de flamme","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Colonne de flamme","unlockLevel":17}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communion","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communion","unlockLevel":17}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Protection contre le mal et le bien","unlockLevel":3}',
  '{"spellName":"Sanctuaire","unlockLevel":3}',
  '{"spellName":"Restauration partielle","unlockLevel":5}',
  '{"spellName":"Zone de vérité","unlockLevel":5}',
  '{"spellName":"Dissipation de la magie","unlockLevel":9}',
  '{"spellName":"Lueur d''espoir","unlockLevel":9}',
  '{"spellName":"Gardien de la foi","unlockLevel":13}',
  '{"spellName":"Liberté de mouvement","unlockLevel":13}',
  '{"spellName":"Colonne de flamme","unlockLevel":17}',
  '{"spellName":"Communion","unlockLevel":17}'
)
WHERE f.name = 'Sorts du serment de dévotion' AND s.name = 'Serment de dévotion' AND c.name = 'Paladin' AND c.ruleset = '5';

-- Serment des anciens
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communication avec les animaux","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communication avec les animaux","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Frappe piégeuse","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Frappe piégeuse","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Foulée brumeuse","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Foulée brumeuse","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Rayon de lune","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Rayon de lune","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance végétale","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance végétale","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Protection contre une énergie","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Protection contre une énergie","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Peau de pierre","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Peau de pierre","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Tempête de grêle","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Tempête de grêle","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communion avec la nature","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communion avec la nature","unlockLevel":17}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passage par les arbres","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passage par les arbres","unlockLevel":17}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Communication avec les animaux","unlockLevel":3}',
  '{"spellName":"Frappe piégeuse","unlockLevel":3}',
  '{"spellName":"Foulée brumeuse","unlockLevel":5}',
  '{"spellName":"Rayon de lune","unlockLevel":5}',
  '{"spellName":"Croissance végétale","unlockLevel":9}',
  '{"spellName":"Protection contre une énergie","unlockLevel":9}',
  '{"spellName":"Peau de pierre","unlockLevel":13}',
  '{"spellName":"Tempête de grêle","unlockLevel":13}',
  '{"spellName":"Communion avec la nature","unlockLevel":17}',
  '{"spellName":"Passage par les arbres","unlockLevel":17}'
)
WHERE f.name = 'Sorts du serment des anciens' AND s.name = 'Serment des anciens' AND c.name = 'Paladin' AND c.ruleset = '5';

-- Serment de vengeance
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Marque du chasseur","unlockLevel":3}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Marque du chasseur","unlockLevel":3}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Foulée brumeuse","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Foulée brumeuse","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Immobilisation de personne","unlockLevel":5}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Immobilisation de personne","unlockLevel":5}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Hâte","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Hâte","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Protection contre une énergie","unlockLevel":9}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Protection contre une énergie","unlockLevel":9}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Bannissement","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Bannissement","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Porte dimensionnelle","unlockLevel":13}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Porte dimensionnelle","unlockLevel":13}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Immobilisation de monstre","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Immobilisation de monstre","unlockLevel":17}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Scrutation","unlockLevel":17}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Scrutation","unlockLevel":17}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Fléau","unlockLevel":3}',
  '{"spellName":"Marque du chasseur","unlockLevel":3}',
  '{"spellName":"Foulée brumeuse","unlockLevel":5}',
  '{"spellName":"Immobilisation de personne","unlockLevel":5}',
  '{"spellName":"Hâte","unlockLevel":9}',
  '{"spellName":"Protection contre une énergie","unlockLevel":9}',
  '{"spellName":"Bannissement","unlockLevel":13}',
  '{"spellName":"Porte dimensionnelle","unlockLevel":13}',
  '{"spellName":"Immobilisation de monstre","unlockLevel":17}',
  '{"spellName":"Scrutation","unlockLevel":17}'
)
WHERE f.name = 'Sorts du serment de vengeance' AND s.name = 'Serment de vengeance' AND c.name = 'Paladin' AND c.ruleset = '5';


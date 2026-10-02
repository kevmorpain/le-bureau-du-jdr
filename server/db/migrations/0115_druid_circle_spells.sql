-- Cercle de la terre : le terrain choisi en rejoignant le cercle décide des sorts de cercle, toujours préparés
-- (AideDD, « sorts de cercle »). Pose le point de choix `terrain` (porteur invisible, niveau 2 = niveau de
-- sous-classe du Druide), les effets `always_prepared_spell` conditionnés par le terrain sur « Sorts de cercle »,
-- et corrige la description de cette feature (l'exemple de la forêt reprenait la liste du domaine de la Nature).
-- Pendant du seed : server/db/seeds/data/druide.ts + alwaysPreparedSpells.ts, gardé par
-- test/nuxt/circleSpellsMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente, limitée à l'édition 2014 et tolérante base vierge : rien n'est
-- créé sans la sous-classe. Jamais BEGIN (D1).

INSERT INTO features (name, description, feature_type, subclass_id, level_required)
SELECT 'Terrain du cercle', 'Terrain choisi en rejoignant le cercle : il décide des sorts de cercle.', 'choice_carrier', s.id, 2
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Terrain du cercle');

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'terrain', '{"op":"fixed","value":1}', '{"type":"enum","values":["Arctique","Désert","Forêt","Littoral","Marais","Montagne","Outreterre","Plaine"]}', 0
FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
WHERE f.name = 'Terrain du cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'terrain');

UPDATE features SET description = 'Votre connexion à la terre vous apporte des sorts supplémentaires selon le terrain que vous avez choisi en rejoignant le cercle (toujours préparés, ils ne comptent pas dans votre limite) :

- Arctique : niv 3 Croissance d''épines, Immobilisation de personne ; niv 5 Lenteur, Tempête de neige ; niv 7 Liberté de mouvement, Tempête de grêle ; niv 9 Communion avec la nature, Cône de froid
- Désert : niv 3 Flou, Silence ; niv 5 Création de nourriture et d''eau, Protection contre une énergie ; niv 7 Flétrissement, Terrain hallucinatoire ; niv 9 Fléau d''insectes, Mur de pierre
- Forêt : niv 3 Pattes d''araignée, Peau d''écorce ; niv 5 Appel de la foudre, Croissance végétale ; niv 7 Divination, Liberté de mouvement ; niv 9 Communion avec la nature, Passage par les arbres
- Littoral : niv 3 Foulée brumeuse, Image miroir ; niv 5 Marche sur l''eau, Respiration aquatique ; niv 7 Contrôle de l''eau, Liberté de mouvement ; niv 9 Invocation d''élémentaire, Scrutation
- Marais : niv 3 Flèche acide de Melf, Ténèbres ; niv 5 Marche sur l''eau, Nuage nauséabond ; niv 7 Liberté de mouvement, Localisation de créature ; niv 9 Fléau d''insectes, Scrutation
- Montagne : niv 3 Croissance d''épines, Pattes d''araignée ; niv 5 Éclair, Fusion dans la pierre ; niv 7 Façonnage de la pierre, Peau de pierre ; niv 9 Mur de pierre, Passe-muraille
- Outreterre : niv 3 Pattes d''araignée, Toile d''araignée ; niv 5 Forme gazeuse, Nuage nauséabond ; niv 7 Façonnage de la pierre, Invisibilité supérieure ; niv 9 Brume mortelle, Fléau d''insectes
- Plaine : niv 3 Invisibilité, Passage sans trace ; niv 5 Hâte, Lumière du jour ; niv 7 Divination, Liberté de mouvement ; niv 9 Fléau d''insectes, Songe'
WHERE name = 'Sorts de cercle'
  AND subclass_id IN (SELECT s.id FROM subclasses s JOIN classes c ON c.id = s.class_id WHERE s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5');

INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Immobilisation de personne","unlockLevel":3,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Immobilisation de personne","unlockLevel":3,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lenteur","unlockLevel":5,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lenteur","unlockLevel":5,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Tempête de neige","unlockLevel":5,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Tempête de neige","unlockLevel":5,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Tempête de grêle","unlockLevel":7,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Tempête de grêle","unlockLevel":7,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Cône de froid","unlockLevel":9,"terrain":"Arctique"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Cône de froid","unlockLevel":9,"terrain":"Arctique"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Flou","unlockLevel":3,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Flou","unlockLevel":3,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Silence","unlockLevel":3,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Silence","unlockLevel":3,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Création de nourriture et d''eau","unlockLevel":5,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Création de nourriture et d''eau","unlockLevel":5,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Protection contre une énergie","unlockLevel":5,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Protection contre une énergie","unlockLevel":5,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Flétrissement","unlockLevel":7,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Flétrissement","unlockLevel":7,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Terrain hallucinatoire","unlockLevel":7,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Terrain hallucinatoire","unlockLevel":7,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Désert"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Désert"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Peau d''écorce","unlockLevel":3,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Peau d''écorce","unlockLevel":3,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Appel de la foudre","unlockLevel":5,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Appel de la foudre","unlockLevel":5,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance végétale","unlockLevel":5,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance végétale","unlockLevel":5,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Divination","unlockLevel":7,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Divination","unlockLevel":7,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passage par les arbres","unlockLevel":9,"terrain":"Forêt"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passage par les arbres","unlockLevel":9,"terrain":"Forêt"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Foulée brumeuse","unlockLevel":3,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Foulée brumeuse","unlockLevel":3,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Image miroir","unlockLevel":3,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Image miroir","unlockLevel":3,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Respiration aquatique","unlockLevel":5,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Respiration aquatique","unlockLevel":5,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Contrôle de l''eau","unlockLevel":7,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Contrôle de l''eau","unlockLevel":7,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Invocation d''élémentaire","unlockLevel":9,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Invocation d''élémentaire","unlockLevel":9,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Littoral"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Littoral"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Flèche acide de Melf","unlockLevel":3,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Flèche acide de Melf","unlockLevel":3,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Ténèbres","unlockLevel":3,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Ténèbres","unlockLevel":3,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Localisation de créature","unlockLevel":7,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Localisation de créature","unlockLevel":7,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Marais"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Marais"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Éclair","unlockLevel":5,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Éclair","unlockLevel":5,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fusion dans la pierre","unlockLevel":5,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fusion dans la pierre","unlockLevel":5,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Peau de pierre","unlockLevel":7,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Peau de pierre","unlockLevel":7,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passe-muraille","unlockLevel":9,"terrain":"Montagne"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passe-muraille","unlockLevel":9,"terrain":"Montagne"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Toile d''araignée","unlockLevel":3,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Toile d''araignée","unlockLevel":3,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Forme gazeuse","unlockLevel":5,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Forme gazeuse","unlockLevel":5,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Invisibilité supérieure","unlockLevel":7,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Invisibilité supérieure","unlockLevel":7,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Brume mortelle","unlockLevel":9,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Brume mortelle","unlockLevel":9,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Outreterre"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Outreterre"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Invisibilité","unlockLevel":3,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Invisibilité","unlockLevel":3,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Passage sans trace","unlockLevel":3,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Passage sans trace","unlockLevel":3,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Hâte","unlockLevel":5,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Hâte","unlockLevel":5,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Lumière du jour","unlockLevel":5,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Lumière du jour","unlockLevel":5,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Divination","unlockLevel":7,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Divination","unlockLevel":7,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Plaine"}');
INSERT INTO effects (type, value) SELECT 'always_prepared_spell', '{"spellName":"Songe","unlockLevel":9,"terrain":"Plaine"}'
WHERE EXISTS (SELECT 1 FROM features f
  JOIN subclasses s ON s.id = f.subclass_id
  JOIN classes c ON c.id = s.class_id
  WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'always_prepared_spell' AND value = '{"spellName":"Songe","unlockLevel":9,"terrain":"Plaine"}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN subclasses s ON s.id = f.subclass_id
JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'always_prepared_spell' AND e.value IN (
  '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Arctique"}',
  '{"spellName":"Immobilisation de personne","unlockLevel":3,"terrain":"Arctique"}',
  '{"spellName":"Lenteur","unlockLevel":5,"terrain":"Arctique"}',
  '{"spellName":"Tempête de neige","unlockLevel":5,"terrain":"Arctique"}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Arctique"}',
  '{"spellName":"Tempête de grêle","unlockLevel":7,"terrain":"Arctique"}',
  '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Arctique"}',
  '{"spellName":"Cône de froid","unlockLevel":9,"terrain":"Arctique"}',
  '{"spellName":"Flou","unlockLevel":3,"terrain":"Désert"}',
  '{"spellName":"Silence","unlockLevel":3,"terrain":"Désert"}',
  '{"spellName":"Création de nourriture et d''eau","unlockLevel":5,"terrain":"Désert"}',
  '{"spellName":"Protection contre une énergie","unlockLevel":5,"terrain":"Désert"}',
  '{"spellName":"Flétrissement","unlockLevel":7,"terrain":"Désert"}',
  '{"spellName":"Terrain hallucinatoire","unlockLevel":7,"terrain":"Désert"}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Désert"}',
  '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Désert"}',
  '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Forêt"}',
  '{"spellName":"Peau d''écorce","unlockLevel":3,"terrain":"Forêt"}',
  '{"spellName":"Appel de la foudre","unlockLevel":5,"terrain":"Forêt"}',
  '{"spellName":"Croissance végétale","unlockLevel":5,"terrain":"Forêt"}',
  '{"spellName":"Divination","unlockLevel":7,"terrain":"Forêt"}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Forêt"}',
  '{"spellName":"Communion avec la nature","unlockLevel":9,"terrain":"Forêt"}',
  '{"spellName":"Passage par les arbres","unlockLevel":9,"terrain":"Forêt"}',
  '{"spellName":"Foulée brumeuse","unlockLevel":3,"terrain":"Littoral"}',
  '{"spellName":"Image miroir","unlockLevel":3,"terrain":"Littoral"}',
  '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Littoral"}',
  '{"spellName":"Respiration aquatique","unlockLevel":5,"terrain":"Littoral"}',
  '{"spellName":"Contrôle de l''eau","unlockLevel":7,"terrain":"Littoral"}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Littoral"}',
  '{"spellName":"Invocation d''élémentaire","unlockLevel":9,"terrain":"Littoral"}',
  '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Littoral"}',
  '{"spellName":"Flèche acide de Melf","unlockLevel":3,"terrain":"Marais"}',
  '{"spellName":"Ténèbres","unlockLevel":3,"terrain":"Marais"}',
  '{"spellName":"Marche sur l''eau","unlockLevel":5,"terrain":"Marais"}',
  '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Marais"}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Marais"}',
  '{"spellName":"Localisation de créature","unlockLevel":7,"terrain":"Marais"}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Marais"}',
  '{"spellName":"Scrutation","unlockLevel":9,"terrain":"Marais"}',
  '{"spellName":"Croissance d''épines","unlockLevel":3,"terrain":"Montagne"}',
  '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Montagne"}',
  '{"spellName":"Éclair","unlockLevel":5,"terrain":"Montagne"}',
  '{"spellName":"Fusion dans la pierre","unlockLevel":5,"terrain":"Montagne"}',
  '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Montagne"}',
  '{"spellName":"Peau de pierre","unlockLevel":7,"terrain":"Montagne"}',
  '{"spellName":"Mur de pierre","unlockLevel":9,"terrain":"Montagne"}',
  '{"spellName":"Passe-muraille","unlockLevel":9,"terrain":"Montagne"}',
  '{"spellName":"Pattes d''araignée","unlockLevel":3,"terrain":"Outreterre"}',
  '{"spellName":"Toile d''araignée","unlockLevel":3,"terrain":"Outreterre"}',
  '{"spellName":"Forme gazeuse","unlockLevel":5,"terrain":"Outreterre"}',
  '{"spellName":"Nuage nauséabond","unlockLevel":5,"terrain":"Outreterre"}',
  '{"spellName":"Façonnage de la pierre","unlockLevel":7,"terrain":"Outreterre"}',
  '{"spellName":"Invisibilité supérieure","unlockLevel":7,"terrain":"Outreterre"}',
  '{"spellName":"Brume mortelle","unlockLevel":9,"terrain":"Outreterre"}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Outreterre"}',
  '{"spellName":"Invisibilité","unlockLevel":3,"terrain":"Plaine"}',
  '{"spellName":"Passage sans trace","unlockLevel":3,"terrain":"Plaine"}',
  '{"spellName":"Hâte","unlockLevel":5,"terrain":"Plaine"}',
  '{"spellName":"Lumière du jour","unlockLevel":5,"terrain":"Plaine"}',
  '{"spellName":"Divination","unlockLevel":7,"terrain":"Plaine"}',
  '{"spellName":"Liberté de mouvement","unlockLevel":7,"terrain":"Plaine"}',
  '{"spellName":"Fléau d''insectes","unlockLevel":9,"terrain":"Plaine"}',
  '{"spellName":"Songe","unlockLevel":9,"terrain":"Plaine"}'
)
WHERE f.name = 'Sorts de cercle' AND s.name = 'Cercle de la terre' AND c.name = 'Druide' AND c.ruleset = '5';


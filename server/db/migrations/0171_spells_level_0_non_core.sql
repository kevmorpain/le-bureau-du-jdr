-- Sorts de niveau 0 hors socle (Xanathar, Tasha) (#176 D1) : les 12 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_0.ts, gardé par test/nuxt/spellsLevelHorsSocle0Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Coup de tonnerre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Coup de tonnerre', 0, '1 action', 1.5, '["S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous émettez un grondement de tonnerre audible à 30 mètres. Toute autre créature à portée doit réussir un jet de sauvegarde de Constitution, sans quoi elle subit 1d6 dégâts de tonnerre.

Les dégâts augmentent de 1d6 aux niveaux 5 (2d6), 11 (3d6) et 17 (4d6).', 5, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"thunder","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Coup de tonnerre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Coup de tonnerre' AND s.ruleset = '5';

-- Embrasement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Embrasement', 0, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous allumez un feu de joie magique sur un sol que vous voyez à portée. Il occupe un cube de 1,50 mètre d''arête jusqu''à la fin du sort. Une créature présente dans cet espace à l''incantation doit réussir un jet de sauvegarde de Dextérité, sans quoi elle subit 1d8 dégâts de feu ; le même jet est exigé quand une créature y entre pour la première fois d''un tour ou y termine son tour.

Le feu enflamme les objets inflammables de la zone qui ne sont ni tenus ni portés.

Les dégâts augmentent de 1d8 aux niveaux 5 (2d8), 11 (3d8) et 17 (4d8).', 2, '{"ability":"dex","success":"none"}', NULL, '{"shape":"cube","size":1.5}', '[{"damage_type":"fire","damage_at_character_level":{"1":"1d8","5":"2d8","11":"3d8","17":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Embrasement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Embrasement' AND s.ruleset = '5';

-- Éruption de lames
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Éruption de lames', 0, '1 action', 0, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un cercle de lames spectrales surgit un instant autour de vous. Toute autre créature à 1,50 mètre ou moins de vous doit réussir un jet de sauvegarde de Dextérité, sans quoi elle subit 1d6 dégâts de force.

Les dégâts augmentent de 1d6 aux niveaux 5 (2d6), 11 (3d6) et 17 (4d6).', 2, '{"ability":"dex","success":"none"}', NULL, '{"shape":"emanation","size":1.5}', '[{"damage_type":"force","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Éruption de lames' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Éruption de lames' AND s.ruleset = '5';

-- Façonnage de l'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Façonnage de l''eau', 0, '1 action', 9, '["S"]', NULL, NULL, 0, 'Instantanée ou 1 heure', 'special', NULL, 0, 'Vous choisissez à portée un volume d''eau visible, d''au plus 1,50 mètre d''arête, et vous le façonnez de l''une de ces façons :

- Vous le déplacez instantanément, ou vous en changez le courant, sur 1,50 mètre au plus dans la direction de votre choix, sans force suffisante pour blesser.
- Vous y faites apparaître des formes simples que vous animez à votre guise ; cela dure 1 heure.
- Vous changez uniformément la couleur ou l''opacité de l''eau ; cela dure 1 heure.
- Vous la gelez, si elle ne contient aucune créature ; elle dégèle au bout de 1 heure.

Si vous lancez ce sort plusieurs fois, seuls deux de ces effets non instantanés peuvent être actifs en même temps, et vous pouvez en dissiper un par une action.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Façonnage de l''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Façonnage de l''eau' AND s.ruleset = '5';

-- Façonnage de la terre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Façonnage de la terre', 0, '1 action', 9, '["S"]', NULL, NULL, 0, 'Instantanée ou 1 heure', 'special', NULL, 0, 'Vous choisissez à portée une portion de terre ou de pierre visible, d''au plus un cube de 1,50 mètre d''arête, et vous la façonnez de l''une de ces façons :

- Sur de la terre meuble, vous la creusez et la déplacez instantanément, jusqu''à 1,50 mètre plus loin, sans force suffisante pour blesser.
- Vous y faites apparaître des formes ou des couleurs (mots, images, motifs) ; cela dure 1 heure.
- Sur un sol de terre ou de pierre, vous le transformez en terrain difficile, ou vous rendez normal un terrain difficile ; cela dure 1 heure.

Si vous lancez ce sort plusieurs fois, jusqu''à deux de ces effets non instantanés peuvent être actifs en même temps, et vous pouvez en dissiper un par une action.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Façonnage de la terre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Façonnage de la terre' AND s.ruleset = '5';

-- Ferrage foudroyant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Ferrage foudroyant', 0, '1 action', 0, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une décharge de foudre fouette une créature de votre choix que vous voyez dans un rayon de 4,50 mètres autour de vous. Elle doit réussir un jet de sauvegarde de Force, sans quoi elle est tirée en ligne droite de 3 mètres vers vous ; si elle se retrouve alors à 1,50 mètre ou moins de vous, elle subit 1d8 dégâts de foudre.

Les dégâts augmentent de 1d8 aux niveaux 5 (2d8), 11 (3d8) et 17 (4d8).', 5, '{"ability":"str","success":"none"}', NULL, '{"shape":"emanation","size":4.5}', '[{"damage_type":"lightning","damage_at_character_level":{"1":"1d8","5":"2d8","11":"3d8","17":"4d8"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ferrage foudroyant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Ferrage foudroyant' AND s.ruleset = '5';

-- Gelure
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Gelure', 0, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un gel engourdissant recouvre une créature que vous voyez à portée. Elle doit réussir un jet de sauvegarde de Constitution, sans quoi elle subit 1d6 dégâts de froid et a un désavantage à son prochain jet d''attaque avec une arme avant la fin de son prochain tour.

Les dégâts augmentent de 1d6 aux niveaux 5 (2d6), 11 (3d6) et 17 (4d6).', 5, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"cold","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Gelure' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Gelure' AND s.ruleset = '5';

-- Infestation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Infestation', 0, '1 action', 9, '["V","S","M"]', 'une puce vivante', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un nuage de parasites (puces, mites…) apparaît un instant sur une créature que vous voyez à portée. Elle doit réussir un jet de sauvegarde de Constitution, sans quoi elle subit 1d6 dégâts de poison puis, si elle peut se déplacer et que sa vitesse est d''au moins 1,50 mètre, se déplace de 1,50 mètre dans une direction aléatoire (jetez un d4 : 1 nord, 2 sud, 3 est, 4 ouest). Ce déplacement ne provoque pas d''attaque d''opportunité, et la cible reste sur place si la direction est bloquée.

Les dégâts augmentent de 1d6 aux niveaux 5 (2d6), 11 (3d6) et 17 (4d6).', 2, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"poison","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Infestation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Infestation' AND s.ruleset = '5';

-- Mot de radiance
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mot de radiance', 0, '1 action', 1.5, '["V","M"]', 'un symbole sacré', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous prononcez un mot divin et une lueur brûlante jaillit de vous. Chaque créature de votre choix que vous voyez à portée doit réussir un jet de sauvegarde de Constitution, sans quoi elle subit 1d6 dégâts radiants.

Les dégâts augmentent de 1d6 aux niveaux 5 (2d6), 11 (3d6) et 17 (4d6).', 5, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"radiant","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de radiance' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Mot de radiance' AND s.ruleset = '5';

-- Pierre magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Pierre magique', 0, '1 action bonus', 1.5, '["V","S"]', NULL, NULL, 0, '1 minute', 'minute', 1, 0, 'Vous imprégnez de magie un à trois cailloux que vous touchez. Vous, ou une autre créature, pouvez attaquer avec l''un d''eux par une attaque à distance avec un sort, en le jetant (portée de 18 mètres) ou en le lançant avec une fronde. Une autre créature ajoute à son jet d''attaque le modificateur de votre caractéristique d''incantation, pas le sien. En cas de réussite, la cible subit 1d6 dégâts contondants + le modificateur de votre caractéristique d''incantation. Quoi qu''il arrive, le caillou perd sa magie après l''attaque.

Si vous relancez ce sort, la magie des cailloux encore imprégnés prend fin.', 8, NULL, 'ranged', NULL, '[{"damage_type":"bludgeoning","isSpellcastingModifierAdded":true,"damage_at_character_level":{"1":"1d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Pierre magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Pierre magique' AND s.ruleset = '5';

-- Saute de vent
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Saute de vent', 0, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous saisissez l''air pour produire, en un point que vous voyez à portée, l''un de ces effets :

- Une créature de taille M ou inférieure que vous choisissez doit réussir un jet de sauvegarde de Force, sans quoi elle est repoussée de 1,50 mètre en s''éloignant de vous.
- Une brève explosion d''air repousse de 3 mètres, en l''éloignant de vous, un objet non tenu ni porté pesant 2,5 kg au plus, sans force suffisante pour blesser.
- Un effet sensoriel inoffensif, comme faire bruisser des feuilles, claquer des volets ou onduler des vêtements.', 8, '{"ability":"str","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Saute de vent' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Saute de vent' AND s.ruleset = '5';

-- Sauvagerie primitive
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sauvagerie primitive', 0, '1 action', 0, '["S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous canalisez la magie primale pour aiguiser vos dents ou vos ongles. Faites une attaque au corps à corps avec un sort contre une créature à 1,50 mètre ou moins de vous ; en cas de réussite, elle subit 1d10 dégâts d''acide. Ensuite, vos dents ou vos ongles redeviennent normaux.

Les dégâts augmentent de 1d10 aux niveaux 5 (2d10), 11 (3d10) et 17 (4d10).', 8, NULL, 'melee', NULL, '[{"damage_type":"acid","damage_at_character_level":{"1":"1d10","5":"2d10","11":"3d10","17":"4d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sauvagerie primitive' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Sauvagerie primitive' AND s.ruleset = '5';

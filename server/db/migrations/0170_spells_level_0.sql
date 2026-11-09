-- Sorts de niveau 0 du socle (tours de magie) (#176 D1) : les 16 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_0.ts, gardé par test/nuxt/spellsLevel0Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Amis
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Amis', 0, '1 action', 0, '["S","M"]', 'une petite quantité de maquillage appliquée sur le visage durant l''incantation', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Pour la durée du sort, vous avez un avantage à tous vos jets de Charisme effectués contre une créature de votre choix qui n''a pas une attitude hostile envers vous. Lorsque le sort prend fin, la créature réalise que vous avez utilisé la magie pour l''influencer et devient hostile à votre égard. Une créature plutôt violente risque de vous attaquer. D''autres créatures peuvent vous demander de l''argent ou un service (à la discrétion du MD), cela dépend de la nature de l''échange que vous avez eu avec la créature.', 4, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Amis' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Amis' AND s.ruleset = '5';

-- Aspersion d'acide
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aspersion d''acide', 0, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous propulsez une bulle d''acide. Choisissez une ou deux créatures que vous pouvez voir, à 1,50 mètre ou moins l''une de l''autre, dans la portée du sort. La cible doit réussir un jet de sauvegarde de Dextérité ou subir 1d6 dégâts d''acide.

Les dégâts de ce sort augmentent de 1d6 lorsque vous atteignez le niveau 5 (2d6), le niveau 11 (3d6) et le niveau 17 (4d6).', 2, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"acid","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aspersion d''acide' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Aspersion d''acide' AND s.ruleset = '5';

-- Coup au but
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Coup au but', 0, '1 action', 9, '["S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 round', 'round', 1, 1, 'Vous tendez votre main et pointez un doigt en direction d''une cible à portée. Votre magie vous aide à trouver une petite faille dans les défenses de votre cible. Lors de votre prochain tour, vous obtenez un avantage pour votre premier jet d''attaque contre la cible, à condition que le sort ne soit pas déjà terminé.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Coup au but' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Coup au but' AND s.ruleset = '5';

-- Flammes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Flammes', 0, '1 action', 0, '["V","S"]', NULL, NULL, 0, '10 minutes', 'minute', 10, 0, 'Une flamme vacillante apparaît dans votre main. La flamme y reste pour la durée du sort et n''endommage pas votre équipement, ni ne vous blesse. La flamme diffuse une lumière vive dans un rayon de 3 mètres et une lumière faible dans un rayon supplémentaire de 3 mètres. Le sort prend fin si vous l''annulez par une action ou si vous le lancez de nouveau.

Vous pouvez également attaquer avec la flamme, mettant ainsi un terme au sort. Lorsque vous incantez ce sort, ou en utilisant une action lors d''un tour suivant, vous pouvez lancer la flamme sur une créature située à 9 mètres de vous maximum. Faites une attaque à distance avec un sort. En cas de réussite, la cible subit 1d8 dégâts de feu.

Les dégâts de ce sort augmentent de 1d8 lorsque vous atteignez le niveau 5 (2d8), le niveau 11 (3d8) et le niveau 17 (4d8).', 2, NULL, 'ranged', NULL, '[{"damage_type":"fire","damage_at_character_level":{"1":"1d8","5":"2d8","11":"3d8","17":"4d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flammes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Flammes' AND s.ruleset = '5';

-- Fouet épineux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fouet épineux', 0, '1 action', 9, '["V","S","M"]', 'la tige d''une plante avec des épines', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous créez une longue et épaisse liane ressemblant à de la vigne et recouverte d''épines qui, selon vos ordres, s''accroche à une créature à portée. Effectuez une attaque au corps à corps avec un sort contre la cible. Si l''attaque touche, la créature subit 1d6 dégâts perforants, et si la créature est de taille G ou inférieure, vous la tirez de jusqu''à 3 mètres vers vous.

Les dégâts de ce sort augmentent de 1d6 lorsque vous atteignez le niveau 5 (2d6), le niveau 11 (3d6) et le niveau 17 (4d6).', 8, NULL, 'melee', NULL, '[{"damage_type":"piercing","damage_at_character_level":{"1":"1d6","5":"2d6","11":"3d6","17":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fouet épineux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Fouet épineux' AND s.ruleset = '5';

-- Gourdin magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Gourdin magique', 0, '1 action bonus', 1.5, '["V","S","M"]', 'du gui, une feuille de trèfle et un bâton ou un gourdin', NULL, 0, '1 minute', 'minute', 1, 0, 'Le bois du bâton ou du gourdin que vous tenez est altéré par les pouvoirs de la nature. Pour la durée du sort, vous pouvez utiliser votre caractéristique d''incantation plutôt que votre Force pour les jets d''attaque au corps à corps et de dégâts avec cette arme, et les dégâts de l''arme deviennent des d8. De plus, l''arme devient une arme magique, si ce n''est pas déjà le cas. Ce sort se termine si vous le lancez de nouveau ou si vous lâchez l''arme enchantée.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Gourdin magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Gourdin magique' AND s.ruleset = '5';

-- Lumières dansantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Lumières dansantes', 0, '1 action', 36, '["V","S","M"]', 'un peu de phosphore ou d''écorce d''orme blanc, ou bien un ver luisant', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Ce sort permet de créer jusqu''à quatre lumières, de la taille de torches, qui peuvent revêtir l''apparence de torches, de lanternes ou d''orbes brillantes qui flottent dans les airs. Il est possible de combiner les quatre lumières en une forme vaguement humanoïde brillante de taille M. Peu importe la forme choisie, chaque lumière produit une lumière faible qui éclaire dans un rayon de 3 mètres.

Au prix d''une action bonus lors de votre tour, il est possible de déplacer les lumières jusqu''à 18 mètres vers un nouvel emplacement à portée. Une lumière doit se situer à 6 mètres ou moins d''une autre lumière créée par ce sort, et une lumière s''éclipse si elle se trouve au-delà de la portée du sort.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lumières dansantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Lumières dansantes' AND s.ruleset = '5';

-- Main de mage
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Main de mage', 0, '1 action', 9, '["V","S"]', NULL, NULL, 0, '1 minute', 'minute', 1, 0, 'Une main spectrale apparaît à un point précis choisi à portée. La main expire à la fin de la durée du sort ou si elle est révoquée au prix d''une action. La main disparaît si elle se retrouve à plus de 9 mètres du lanceur de sorts ou si ce sort est jeté une nouvelle fois.

Le lanceur de sorts peut utiliser son action pour contrôler la main. La main peut manipuler un objet, ouvrir une porte ou un contenant non verrouillé, ranger ou récupérer un objet d''un contenant ouvert, ou bien verser le contenu d''une fiole. La main peut être déplacée jusqu''à 9 mètres à chaque fois que vous l''utilisez.

La main ne peut attaquer, activer des objets magiques ou transporter plus de 5 kg.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Main de mage' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Main de mage' AND s.ruleset = '5';

-- Message
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Message', 0, '1 action', 36, '["V","S","M"]', 'un petit bout de fil de cuivre', NULL, 0, '1 round', 'round', 1, 0, 'Vous pointez votre doigt en direction d''une créature à portée et murmurez un message. La cible (et seulement la cible) entend le message et peut répondre en un murmure que vous seul pouvez entendre. Vous pouvez lancer ce sort à travers des objets solides si vous connaissez bien la cible et que vous savez qu''elle est derrière l''obstacle. Ce sort est arrêté par un silence magique, 30 cm de pierre, 2,50 cm de métal, une fine feuille de plomb ou 90 cm de bois. Ce sort ne doit pas forcément suivre une ligne droite et peut contourner les angles ou passer par de petites ouvertures.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Message' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Message' AND s.ruleset = '5';

-- Moquerie cruelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Moquerie cruelle', 0, '1 action', 18, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous vomissez un flot d''insultes entremêlées de subtils enchantements sur une créature à portée et que vous pouvez voir. Si la cible peut vous entendre (il n''est pas nécessaire qu''elle comprenne mais juste qu''elle devine votre intention), elle doit réussir un jet de sauvegarde de Sagesse ou subir 1d4 dégâts psychiques et avoir un désavantage au prochain jet d''attaque qu''elle fera avant la fin de son prochain tour.

Les dégâts de ce sort augmentent de 1d4 lorsque vous atteignez le niveau 5 (2d4), le niveau 11 (3d4) et le niveau 17 (4d4).', 4, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_character_level":{"1":"1d4","5":"2d4","11":"3d4","17":"4d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Moquerie cruelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde') AND c.ruleset = '5'
WHERE s.name = 'Moquerie cruelle' AND s.ruleset = '5';

-- Poigne électrique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Poigne électrique', 0, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'La foudre jaillit de votre main pour délivrer un choc électrique à une créature que vous essayez de toucher. Effectuez une attaque au corps à corps avec un sort contre la cible. Vous avez un avantage au jet d''attaque si la cible porte une armure en métal. En cas de réussite, la cible prend 1d8 dégâts de foudre, et elle ne peut pas prendre de réaction jusqu''au début de son prochain tour.

Les dégâts du sort augmentent de 1d8 lorsque vous atteignez le niveau 5 (2d8), le niveau 11 (3d8) et le niveau 17 (4d8).', 5, NULL, 'melee', NULL, '[{"damage_type":"lightning","damage_at_character_level":{"1":"1d8","5":"2d8","11":"3d8","17":"4d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Poigne électrique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Poigne électrique' AND s.ruleset = '5';

-- Protection contre les armes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Protection contre les armes', 0, '1 action', 0, '["V","S"]', NULL, NULL, 0, '1 round', 'round', 1, 0, 'Vous tendez votre main et tracez un symbole de protection dans les airs. Jusqu''à la fin de votre prochain tour, vous obtenez la résistance contre les dégâts contondants, tranchants et perforants infligés par des attaques avec arme.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Protection contre les armes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Protection contre les armes' AND s.ruleset = '5';

-- Réparation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Réparation', 0, '1 minute', 1.5, '["V","S","M"]', 'deux aimants', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Ce sort répare une simple fissure, déchirure ou fêlure sur un objet que vous touchez, comme un maillon de chaîne cassé, une clé brisée en deux morceaux, un accroc sur un manteau ou une fuite sur une outre. Tant que la fissure ou l''accroc n''excède pas 30 cm dans toutes les dimensions, vous le réparez, ne laissant aucune trace de la détérioration passée. Ce sort peut réparer physiquement un objet magique ou un artificiel, mais ne peut pas rendre sa magie à un objet.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Réparation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Réparation' AND s.ruleset = '5';

-- Résistance
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Résistance', 0, '1 action', 1.5, '["V","S","M"]', 'une cape miniature', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous touchez une créature consentante. Une fois avant la fin du sort, la cible peut lancer un d4 et ajouter le résultat du dé à un jet de sauvegarde de son choix. Elle peut lancer le dé avant ou après avoir effectué son jet de sauvegarde. Le sort prend alors fin.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Résistance' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Résistance' AND s.ruleset = '5';

-- Stabilisation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Stabilisation', 0, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez une créature vivante qui est à 0 point de vie. La créature devient stable. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Stabilisation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Stabilisation' AND s.ruleset = '5';

-- Thaumaturgie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Thaumaturgie', 0, '1 action', 9, '["V"]', NULL, NULL, 0, 'Jusqu''à 1 minute', 'minute', 1, 0, 'Vous simulez une chose extraordinaire, un signe de puissance surnaturelle. Vous créez un des effets magiques suivants dans la limite de portée du sort :

- Votre voix devient trois fois plus puissante que la normale pour 1 minute.
- Vous faîtes vaciller des flammes, augmentez ou diminuez leur intensité, ou bien encore vous changez leur couleur pendant 1 minute.
- Vous causez des tremblements inoffensifs dans le sol pendant 1 minute.
- Vous créez un son instantané qui provient d''un point de votre choix dans la limite de portée du sort, tel qu''un grondement de tonnerre, le cri d''un corbeau ou des chuchotements de mauvais augure.
- Vous provoquez instantanément l''ouverture ou le claquement brusque d''une porte ou d''une fenêtre non verrouillée.
- Vous altérez l''apparence de vos yeux pendant 1 minute.

Si vous lancez ce sort plusieurs fois, vous pouvez avoir activement jusqu''à trois de ses effets à la fois, et vous pouvez rompre un effet au prix d''une action.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Thaumaturgie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Thaumaturgie' AND s.ruleset = '5';

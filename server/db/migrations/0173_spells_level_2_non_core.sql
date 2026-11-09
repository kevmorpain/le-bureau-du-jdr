-- Sorts de niveau 2 hors socle (Xanathar, Tasha) (#176 D1) : les 14 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_2.ts, gardé par test/nuxt/spellsLevelHorsSocle2Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Attraction terrestre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Attraction terrestre', 2, '1 action', 90, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez une créature que vous voyez à portée : des bandes d''énergie jaune l''entourent. Elle doit réussir un jet de sauvegarde de Force, sans quoi sa vitesse de vol (si elle en a une) tombe à 0 mètre pour la durée du sort. Une créature volante ainsi affectée descend de 18 mètres par round jusqu''à toucher le sol ou jusqu''à la fin du sort.', 8, '{"ability":"str","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Attraction terrestre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Attraction terrestre' AND s.ruleset = '5';

-- Convocation de bête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de bête', 2, '1 action', 27, '["V","S","M"]', 'une plume, une touffe de fourrure et une queue de poisson dans un gland doré d''une valeur d''au moins 200 po', '{"amount":200,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit bestial, qui se manifeste dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit de bête. À l''incantation, choisissez un milieu : air, terre ou eau ; la créature prend l''apparence d''un animal de ce milieu, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de bête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Convocation de bête' AND s.ruleset = '5';

-- Épine mentale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Épine mentale', 2, '1 action', 18, '["S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous plantez une épine dans l''esprit d''une créature que vous voyez à portée. Elle doit effectuer un jet de sauvegarde de Sagesse : en cas d''échec, elle subit 3d8 dégâts psychiques, et la moitié en cas de réussite. En cas d''échec, vous connaissez sa position jusqu''à la fin du sort tant que vous êtes tous deux sur le même plan d''existence ; elle ne peut alors pas se cacher de vous, et si elle est invisible, elle n''en tire aucun avantage contre vous.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 2.', 3, '{"ability":"wis","success":"half"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"2":"3d8","3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Épine mentale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Épine mentale' AND s.ruleset = '5';

-- Esprit guérisseur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Esprit guérisseur', 2, '1 action bonus', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous appelez un esprit de la nature, immatériel, qui apparaît dans un cube de 1,50 mètre d''arête que vous voyez à portée ; il ressemble à une bête ou à une fée translucide, à votre choix.

Jusqu''à la fin du sort, chaque fois que vous ou une créature que vous voyez entrez dans l''espace de l''esprit pour la première fois d''un tour, ou y commencez votre tour, vous pouvez lui faire rendre 1d6 points de vie à cette créature (aucune action requise). Il ne soigne ni les morts-vivants ni les artificiels, et il peut soigner un nombre de fois égal à 1 + le modificateur de votre caractéristique d''incantation (minimum 2), après quoi il disparaît.

Par une action bonus à votre tour, vous pouvez déplacer l''esprit de 9 mètres au plus vers un espace que vous voyez.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les soins augmentent de 1d6 par niveau d''emplacement au-delà du niveau 2.', 2, NULL, NULL, '{"shape":"cube","size":1.5}', NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"2":"1d6","3":"2d6","4":"3d6","5":"4d6","6":"5d6","7":"6d6","8":"7d6","9":"8d6"}}', 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Esprit guérisseur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Esprit guérisseur' AND s.ruleset = '5';

-- Flambée d'Aganazzar
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Flambée d''Aganazzar', 2, '1 action', 9, '["V","S","M"]', 'une écaille de dragon rouge', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une ligne de flammes rugissantes longue de 9 mètres et large de 1,50 mètre jaillit de vous dans la direction de votre choix. Chaque créature sur sa trajectoire doit effectuer un jet de sauvegarde de Dextérité et subit 3d8 dégâts de feu en cas d''échec, la moitié en cas de réussite.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 2.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"2":"3d8","3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flambée d''Aganazzar' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Flambée d''Aganazzar' AND s.ruleset = '5';

-- Fouet mental de Tasha
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Fouet mental de Tasha', 2, '1 action', 27, '["V"]', NULL, NULL, 0, '1 round', 'round', 1, 0, 'Vous cinglez l''esprit d''une créature que vous voyez à portée. Elle doit effectuer un jet de sauvegarde d''Intelligence. En cas d''échec, elle subit 3d6 dégâts psychiques, ne peut pas utiliser sa réaction avant la fin de son prochain tour et, à ce tour, doit choisir entre se déplacer, agir ou utiliser une action bonus : elle n''en fait qu''un seul. En cas de réussite, elle ne subit que la moitié des dégâts et aucun autre effet.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, vous pouvez cibler une créature de plus par niveau d''emplacement au-delà du niveau 2, à condition que les cibles soient à 9 mètres ou moins les unes des autres.', 4, '{"ability":"int","success":"half"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"2":"3d6"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fouet mental de Tasha' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Fouet mental de Tasha' AND s.ruleset = '5';

-- Lame d'ombres
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Lame d''ombres', 2, '1 action bonus', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tissez des fils d''ombre en une épée de ténèbres solidifiées dans votre main, qui dure jusqu''à la fin du sort. Elle compte comme une arme courante de corps à corps que vous maîtrisez, inflige 2d8 dégâts psychiques si vous touchez, et possède les propriétés finesse, légère et lancer (portée 6/18). Vous attaquez avec avantage une cible située dans une lumière faible ou dans les ténèbres. Si vous lâchez ou lancez l''épée, elle se dissipe à la fin du tour ; tant que le sort dure, vous pouvez utiliser une action bonus pour la faire réapparaître dans votre main.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou 4, les dégâts passent à 3d8 ; avec un emplacement de niveau 5 ou 6, à 4d8 ; avec un emplacement de niveau 7 ou plus, à 5d8.', 6, NULL, NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"2":"2d8","3":"3d8","5":"4d8","7":"5d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lame d''ombres' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Lame d''ombres' AND s.ruleset = '5';

-- Libellé aérien
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Libellé aérien', 2, '1 action', 100000, '["V","S"]', NULL, NULL, 1, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous faites apparaître jusqu''à dix mots dans une partie du ciel que vous voyez. Ils semblent faits de nuages et restent en place pendant la durée du sort, puis se dissipent à sa fin. Un vent fort peut disperser les nuages et mettre fin au sort plus tôt.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Libellé aérien' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Libellé aérien' AND s.ruleset = '5';

-- Nuée de boules de neige de Snilloc
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Nuée de boules de neige de Snilloc', 2, '1 action', 27, '["V","S","M"]', 'un morceau de glace ou un petit morceau de roche blanc', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une rafale de boules de neige magiques éclate en un point de votre choix à portée. Chaque créature dans une sphère de 1,50 mètre de rayon centrée sur ce point doit effectuer un jet de sauvegarde de Dextérité et subit 3d6 dégâts de froid en cas d''échec, la moitié en cas de réussite.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d6 par niveau d''emplacement au-delà du niveau 2.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":1.5}', '[{"damage_type":"cold","damage_at_slot_level":{"2":"3d6","3":"4d6","4":"5d6","5":"6d6","6":"7d6","7":"8d6","8":"9d6","9":"10d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nuée de boules de neige de Snilloc' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Nuée de boules de neige de Snilloc' AND s.ruleset = '5';

-- Poigne terreuse de Maximilien
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Poigne terreuse de Maximilien', 2, '1 action', 9, '["V","S","M"]', 'une main miniature sculptée à partir d''argile', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez un espace inoccupé de 1,50 mètre de côté au sol, visible et à portée. Une main de taille M faite de terre compactée en surgit et fond sur une créature que vous voyez à 1,50 mètre ou moins de cet espace. La cible doit réussir un jet de sauvegarde de Force, sans quoi elle subit 2d6 dégâts contondants et est entravée pour la durée du sort.

Par une action, vous pouvez faire écraser la cible entravée par la main : elle doit effectuer un jet de sauvegarde de Force et subit 2d6 dégâts contondants en cas d''échec, la moitié en cas de réussite.

Pour se libérer, la cible entravée peut utiliser son action pour réussir un jet de Force contre le DD de sauvegarde de votre sort ; la main ne la retient alors plus.

Par une action, vous pouvez diriger la main contre une autre créature ou la déplacer vers un autre espace inoccupé à portée ; elle relâche alors la cible qu''elle retenait.', 8, '{"ability":"str"}', NULL, NULL, '[{"damage_type":"bludgeoning","label":"Apparition de la main","damage_at_slot_level":{"2":"2d6"}},{"damage_type":"bludgeoning","label":"Écrasement","damage_at_slot_level":{"2":"2d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Poigne terreuse de Maximilien' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Poigne terreuse de Maximilien' AND s.ruleset = '5';

-- Pyrotechnie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Pyrotechnie', 2, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Visez un feu non magique visible, de la taille d''un cube de 1,50 mètre d''arête au plus, à portée. Vous pouvez l''éteindre, ou en faire jaillir un feu d''artifice ou de la fumée.

**Feux d''artifice**. La cible explose en gerbes de couleurs : chaque créature à 3 mètres ou moins de la cible doit réussir un jet de sauvegarde de Constitution, sans quoi elle est aveuglée jusqu''à la fin de votre prochain tour.

**Fumée**. Une épaisse fumée emplit une zone de 7,50 mètres de rayon autour de la cible, jusque dans les moindres recoins ; la visibilité y est nulle. Elle dure une minute ou jusqu''à ce qu''un vent fort la dissipe.', 8, '{"ability":"con","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Pyrotechnie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Pyrotechnie' AND s.ruleset = '5';

-- Souffle du dragon
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Souffle du dragon', 2, '1 action bonus', 1.5, '["V","S","M"]', 'un piment', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous touchez une créature consentante et lui donnez le pouvoir de souffler une énergie magique, à condition qu''elle ait une bouche. Choisissez un type de dégâts : acide, froid, feu, foudre ou poison. Jusqu''à la fin du sort, la créature peut utiliser une action pour expirer cette énergie dans un cône de 4,50 mètres. Chaque créature de la zone doit effectuer un jet de sauvegarde de Dextérité et subit 3d6 dégâts du type choisi en cas d''échec, la moitié en cas de réussite.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d6 par niveau d''emplacement au-delà du niveau 2.', 8, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cone","size":4.5}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Souffle du dragon' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Souffle du dragon' AND s.ruleset = '5';

-- Tourbillon de poussière
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Tourbillon de poussière', 2, '1 action', 18, '["V","S","M"]', 'une pincée de poussière', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez à portée un cube d''air visible et inoccupé de 1,50 mètre d''arête. Une force élémentaire en forme de tourbillon de poussière y apparaît et y reste jusqu''à la fin du sort.

Toute créature qui termine son tour à 1,50 mètre ou moins du tourbillon doit effectuer un jet de sauvegarde de Force : en cas d''échec, elle subit 1d8 dégâts contondants et est repoussée de 3 mètres ; en cas de réussite, elle subit la moitié des dégâts et n''est pas repoussée.

Par une action bonus, vous pouvez déplacer le tourbillon de 9 mètres au plus dans n''importe quelle direction. S''il passe sur du sable, de la poussière, de la terre meuble ou du petit gravier, il l''aspire et forme autour de lui un nuage de débris de 3 mètres de rayon jusqu''au début de votre prochain tour ; ce nuage rend la visibilité nulle dans la zone qu''il occupe.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 3 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 2.', 2, '{"ability":"str","success":"half"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"2":"1d8","3":"2d8","4":"3d8","5":"4d8","6":"5d8","7":"6d8","8":"7d8","9":"8d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tourbillon de poussière' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Tourbillon de poussière' AND s.ruleset = '5';

-- Vent protecteur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Vent protecteur', 2, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Un vent fort (30 km/h) souffle autour de vous dans un rayon de 3 mètres et se déplace avec vous, centré sur vous, pendant toute la durée du sort.

Il produit ces effets dans sa zone :

- Il vous rend sourd, ainsi que les autres créatures de la zone.
- Il éteint les flammes non protégées de la taille d''une torche ou moins.
- Il disperse vapeur, gaz et brouillard que peut chasser un vent fort.
- La zone est un terrain difficile pour les créatures autres que vous.
- Les attaques à distance avec une arme ont un désavantage si elles entrent dans la zone ou en sortent.', 5, NULL, NULL, '{"shape":"emanation","size":3}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Vent protecteur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Vent protecteur' AND s.ruleset = '5';

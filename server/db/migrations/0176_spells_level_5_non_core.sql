-- Sorts de niveau 5 hors socle (Xanathar, Tasha) (#176 D1) : les 16 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_5.ts, gardé par test/nuxt/spellsLevelHorsSocle5Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Amélioration de compétences
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Amélioration de compétences', 5, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une créature consentante et lui conférez une expertise dans une compétence de votre choix : tant que le sort dure, elle double son bonus de maîtrise pour tous les jets de caractéristique liés à cette compétence.

La compétence doit déjà être maîtrisée par la cible, et l''effet ne se cumule pas avec un autre effet qui double déjà son bonus de maîtrise, comme Expertise.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Amélioration de compétences' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Amélioration de compétences' AND s.ruleset = '5';

-- Arme sacrée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Arme sacrée', 5, '1 action bonus', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous imprégnez de puissance sacrée une arme que vous touchez. Jusqu''à la fin du sort, elle émet une lumière vive sur 9 mètres et une lumière faible sur 9 mètres de plus, et chacune de ses attaques inflige 2d8 dégâts radiants supplémentaires quand elle touche. Si l''arme n''est pas magique, elle le devient pour la durée du sort.

Par une action bonus à votre tour, vous pouvez mettre fin au sort et libérer l''énergie accumulée en un éclat de lumière. Chaque créature de votre choix que vous voyez dans un rayon de 9 mètres autour de l''arme doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, elle subit 4d8 dégâts radiants et est aveuglée pendant 1 minute ; en cas de réussite, elle subit la moitié des dégâts et n''est pas aveuglée. Une créature aveuglée peut refaire le jet de sauvegarde à la fin de chacun de ses tours pour mettre fin à l''effet.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":9}', '[{"damage_type":"radiant","label":"Attaques avec l''arme","damage_at_slot_level":{"5":"2d8"}},{"damage_type":"radiant","label":"Éclat final","damage_at_slot_level":{"5":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Arme sacrée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Arme sacrée' AND s.ruleset = '5';

-- Assignation infernale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Assignation infernale', 5, '1 minute', 27, '["V","S","M"]', 'un rubis d''une valeur d''au moins 999 po', '{"amount":999,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous prononcez une incantation infernale et invoquez un diable des Neuf Enfers, dont vous choisissez le type parmi ceux de facteur de puissance 6 ou moins (diable barbu, diable barbelé…). Il apparaît dans un espace inoccupé que vous voyez à portée et disparaît à 0 point de vie ou à la fin du sort.

Le diable est hostile à vous et à vos compagnons. Lancez son initiative : le MD le contrôle et le fait agir selon sa nature. Il peut vous attaquer s''il pense vous vaincre, ou chercher à conclure un pacte contre des services limités.

À chacun de vos tours, vous pouvez tenter de lui donner un ordre (sans action). Il peut obéir si cela sert ses intérêts, surtout si cela vous mène vers le mal ; sinon, vous devez réussir un jet de Charisme (Tromperie, Intimidation ou Persuasion) opposé à son jet de Sagesse (Perspicacité), avec avantage si vous prononcez son vrai nom. En cas d''échec, le diable devient immunisé à vos ordres pour la durée du sort, tout en pouvant les suivre s''il le souhaite. En cas de réussite, il exécute l''ordre (« attaque mon ennemi », « explore cette pièce », « porte ce message à la reine »…) jusqu''à son accomplissement, puis vient vous en rendre compte.

Si vous perdez votre concentration avant la fin du sort, un diable devenu immunisé à vos ordres ne disparaît pas : il agit librement pendant 3d6 minutes, puis disparaît.

Si vous possédez un talisman lié à un diable précis, vous pouvez l''invoquer si son facteur de puissance est égal à celui du sort + 1 ; il obéit alors à vos ordres sans jet de Charisme.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou supérieur, le facteur de puissance maximal des diables invocables augmente de 1 par niveau d''emplacement au-delà du niveau 5.', 2, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Assignation infernale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Assignation infernale' AND s.ruleset = '5';

-- Aube
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Aube', 5, '1 action', 18, '["V","S","M"]', 'un pendentif en forme de rayons de soleil d''une valeur d''au moins 100 po', '{"amount":100,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un cylindre de lumière vive équivalente à celle du soleil, haut de 12 mètres et de 9 mètres de rayon, jaillit d''un point de votre choix à portée. À son apparition, chaque créature à l''intérieur doit effectuer un jet de sauvegarde de Constitution et subit 4d10 dégâts radiants en cas d''échec, la moitié en cas de réussite ; toute créature qui termine son tour dans le cylindre doit aussi faire ce jet. Tant que vous êtes à 18 mètres ou moins du cylindre, vous pouvez, par une action bonus, le déplacer de 18 mètres au plus dans la limite de la portée du sort.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"cylinder","size":9,"height":12}', '[{"damage_type":"radiant","damage_at_slot_level":{"5":"4d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aube' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Aube' AND s.ruleset = '5';

-- Contrôle des vents
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Contrôle des vents', 5, '1 action', 90, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous prenez le contrôle de l''air dans un cube de 30 mètres d''arête que vous voyez à portée. À l''incantation, choisissez l''un des effets suivants ; il dure jusqu''à la fin du sort, sauf si vous utilisez votre action à un tour ultérieur pour en changer. Vous pouvez aussi utiliser votre action pour suspendre l''effet un instant ou le relancer.

**Rafales**. Un vent se lève au centre du cube et souffle sans cesse dans la direction horizontale de votre choix ; vous en fixez l''intensité : calme, modéré ou fort. S''il est modéré ou fort, les attaques à distance avec une arme qui entrent dans le cube, en sortent ou le traversent ont un désavantage. S''il est fort, une créature qui avance contre le vent dépense un mètre de déplacement de plus par mètre parcouru.

**Écrasement**. Un fort coup de vent descendant part du haut du cube. Les attaques à distance avec une arme qui traversent la zone ou visent des cibles à l''intérieur ont un désavantage. Une créature doit réussir un jet de sauvegarde de Force quand elle vole dans le cube pour la première fois d''un tour ou y commence son tour en volant, sans quoi elle tombe à terre.

**Ascension**. Un courant ascendant soutenu monte de la face inférieure du cube. Les créatures qui tombent dans le cube ne subissent que la moitié des dégâts de chute, et une créature qui y fait un saut vertical peut sauter 3 mètres plus haut que la normale.', 8, '{"ability":"str","success":"none"}', NULL, '{"shape":"cube","size":30}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contrôle des vents' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Contrôle des vents' AND s.ruleset = '5';

-- Convocation de céleste
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de céleste', 5, '1 action', 27, '["V","S","M"]', 'un reliquaire en or d''une valeur d''au moins 500 po', '{"amount":500,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit céleste, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit de céleste. À l''incantation, choisissez un type : vengeur ou protecteur ; il détermine certains traits de son bloc de statistiques. La créature disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de céleste' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Convocation de céleste' AND s.ruleset = '5';

-- Danse macabre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Danse macabre', 5, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Des filaments d''énergie sombre jaillissent de vos doigts et transpercent jusqu''à cinq cadavres de taille P ou M à portée. Chacun se relève aussitôt en mort-vivant, zombi ou squelette selon votre choix, et gagne un bonus à ses jets d''attaque et de dégâts égal à votre modificateur de caractéristique d''incantation. Par une action bonus, vous pouvez donner un ordre à tous les morts-vivants créés par ce sort qui sont à 18 mètres ou moins de vous : vous décidez de leur action et de leur déplacement au prochain tour, ou vous donnez un ordre général (garder une pièce ou un couloir contre vos ennemis). Sans ordre, ils se défendent seulement contre les créatures hostiles, et ils suivent un ordre jusqu''à son accomplissement.

Les créatures sous le contrôle du sort redeviennent inanimées quand il prend fin.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou supérieur, vous pouvez animer deux cadavres de plus par niveau d''emplacement au-delà du niveau 5.', 7, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Danse macabre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Danse macabre' AND s.ruleset = '5';

-- Déluge d'énergie négative
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Déluge d''énergie négative', 5, '1 action', 18, '["V","M"]', 'un os cassé et un carré de soie noire', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous envoyez des rubans d''énergie négative vers une créature que vous voyez à portée. Sauf si c''est un mort-vivant, elle doit effectuer un jet de sauvegarde de Constitution et subit 5d12 dégâts nécrotiques en cas d''échec, la moitié en cas de réussite. Une cible tuée par ces dégâts se relève en zombi au début de son prochain tour et poursuit la créature la plus proche qu''elle voit. Si vous ciblez un mort-vivant, lancez 5d12 au lieu du jet de sauvegarde : il gagne la moitié du total en points de vie temporaires.', 7, '{"ability":"con","success":"half"}', NULL, NULL, '[{"damage_type":"necrotic","damage_at_slot_level":{"5":"5d12"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Déluge d''énergie négative' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Déluge d''énergie négative' AND s.ruleset = '5';

-- Énervation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Énervation', 5, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un filament obscur part de vous vers une créature que vous voyez à portée et draine ses forces vitales. Elle doit effectuer un jet de sauvegarde de Dextérité. En cas de réussite, elle subit 2d8 dégâts nécrotiques et le sort prend fin. En cas d''échec, elle subit 4d8 dégâts nécrotiques, et jusqu''à la fin du sort vous pouvez utiliser votre action à chaque tour pour lui infliger automatiquement 4d8 dégâts nécrotiques. Le sort prend fin si vous utilisez votre action pour autre chose, ou si la cible sort de la portée du sort ou de votre vue. Chaque fois que le sort inflige des dégâts, vous regagnez des points de vie égaux à la moitié des dégâts subis par la cible.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 5.', 7, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"necrotic","label":"Dégâts initiaux","damage_at_slot_level":{"5":"4d8"}},{"damage_type":"necrotic","label":"À chaque tour suivant","damage_at_slot_level":{"5":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Énervation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Énervation' AND s.ruleset = '5';

-- Foulée dimensionnelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Foulée dimensionnelle', 5, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous vous téléportez jusqu''à 18 mètres dans un espace inoccupé que vous voyez. À chacun de vos tours jusqu''à la fin du sort, vous pouvez utiliser une action bonus pour vous téléporter ainsi de nouveau.', 2, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Foulée dimensionnelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Foulée dimensionnelle' AND s.ruleset = '5';

-- Frappe du vent d'acier
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Frappe du vent d''acier', 5, '1 action', 9, '["S","M"]', 'une arme de corps à corps d''une valeur d''au moins 1 pa', '{"amount":1,"unit":"pa"}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous brandissez l''arme de l''incantation et disparaissez pour frapper comme le vent. Choisissez jusqu''à cinq créatures que vous voyez à portée et faites une attaque au corps à corps avec un sort contre chacune ; chaque cible touchée subit 6d10 dégâts de force.

Vous pouvez ensuite vous téléporter dans un espace inoccupé que vous voyez à 1,50 mètre de l''une des cibles, que vous l''ayez touchée ou non.', 2, NULL, 'melee', NULL, '[{"damage_type":"force","damage_at_slot_level":{"5":"6d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Frappe du vent d''acier' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Frappe du vent d''acier' AND s.ruleset = '5';

-- Fureur de la nature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Fureur de la nature', 5, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous en appelez aux esprits de la nature pour qu''ils se dressent contre vos ennemis. Choisissez un point que vous voyez à portée : les esprits animent arbres, plantes et roches d''un cube de 18 mètres centré sur ce point jusqu''à la fin du sort.

**Plantes et buissons**. Toute zone du sol couverte de plantes ou de buissons devient un terrain difficile pour vos ennemis.

**Arbres**. Au début de chacun de vos tours, chacun de vos ennemis à 3 mètres ou moins d''un arbre de la zone doit réussir un jet de sauvegarde de Dextérité, sans quoi il subit 4d6 dégâts tranchants des branches qui le fouettent.

**Racines et lianes**. À la fin de chacun de vos tours, une créature de votre choix qui se tient au sol dans la zone doit réussir un jet de sauvegarde de Force, sans quoi elle est entravée jusqu''à la fin du sort. Une créature entravée peut utiliser son action pour réussir un jet de Force (Athlétisme) contre le DD de votre sort et se libérer.

**Roches**. Par une action bonus à votre tour, vous pouvez lancer un rocher de la zone sur une créature que vous voyez dans le cube : faites une attaque à distance avec un sort. Si vous touchez, la cible subit 3d8 dégâts contondants non magiques et doit réussir un jet de sauvegarde de Force, sans quoi elle tombe à terre.', 5, '{"ability":"dex","success":"none"}', 'ranged', '{"shape":"cube","size":18}', '[{"damage_type":"slashing","label":"Arbres","damage_at_slot_level":{"5":"4d6"}},{"damage_type":"bludgeoning","label":"Roches","damage_at_slot_level":{"5":"3d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fureur de la nature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Fureur de la nature' AND s.ruleset = '5';

-- Immolation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Immolation', 5, '1 action', 27, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Des flammes enveloppent une créature que vous voyez à portée. Elle doit effectuer un jet de sauvegarde de Dextérité et subit 8d6 dégâts de feu en cas d''échec, la moitié en cas de réussite. En cas d''échec, elle prend feu pour la durée du sort et répand une lumière vive sur 9 mètres de rayon et une lumière faible sur 9 mètres de plus. À la fin de chacun de ses tours, elle refait le jet de sauvegarde : en cas d''échec, elle subit 4d6 dégâts de feu ; en cas de réussite, le feu s''éteint. Ces flammes magiques ne peuvent pas être éteintes par des moyens non magiques.

Si les dégâts de ce sort tuent une cible, elle est réduite en cendres.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","label":"Dégâts initiaux","damage_at_slot_level":{"5":"8d6"}},{"damage_type":"fire","label":"Fin de chaque tour de la cible","damage_at_slot_level":{"5":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Immolation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Immolation' AND s.ruleset = '5';

-- Maelström
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Maelström', 5, '1 action', 36, '["V","S","M"]', 'un papier ou une feuille en forme d''entonnoir', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une masse d''eau de 1,50 mètre de profondeur apparaît et tourbillonne dans un rayon de 9 mètres autour d''un point que vous voyez à portée, au sol ou dans une étendue d''eau. Jusqu''à la fin du sort, la zone est un terrain difficile, et toute créature qui y commence son tour doit effectuer un jet de sauvegarde de Force : en cas d''échec, elle subit 6d6 dégâts contondants et est tirée de 3 mètres vers le centre.', 5, '{"ability":"str","success":"none"}', NULL, '{"shape":"cylinder","size":9,"height":1.5}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"5":"6d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Maelström' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Maelström' AND s.ruleset = '5';

-- Mur de lumière
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mur de lumière', 5, '1 action', 36, '["V","S","M"]', 'un miroir à main', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Un mur scintillant de lumière vive apparaît en un point de votre choix à portée, orienté comme vous le voulez (horizontal, vertical ou en diagonale). Il peut flotter ou reposer sur une surface solide, et mesure jusqu''à 18 mètres de long, 3 mètres de haut et 1,50 mètre d''épaisseur. Il bloque la vue, mais créatures et objets le traversent. Il émet une lumière vive sur 36 mètres et une lumière faible sur 36 mètres de plus.

À son apparition, chaque créature de sa zone doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, elle subit 4d8 dégâts radiants et est aveuglée pendant 1 minute ; en cas de réussite, elle subit la moitié des dégâts et n''est pas aveuglée. Une créature aveuglée peut refaire le jet à la fin de chacun de ses tours pour mettre fin à l''état.

Une créature qui termine son tour dans la zone du mur subit 4d8 dégâts radiants.

Jusqu''à la fin du sort, vous pouvez utiliser une action pour tirer un faisceau de radiance du mur sur une créature que vous voyez à 18 mètres ou moins du mur : faites une attaque à distance avec un sort ; si vous touchez, la cible subit 4d8 dégâts radiants. Que vous touchiez ou non, la longueur du mur diminue de 3 mètres ; à 0, le sort prend fin.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 5.', 5, '{"ability":"con","success":"half"}', 'ranged', NULL, '[{"damage_type":"radiant","label":"Apparition du mur","damage_at_slot_level":{"5":"4d8","6":"5d8","7":"6d8","8":"7d8","9":"8d8"}},{"damage_type":"radiant","label":"Fin de tour dans la zone","damage_at_slot_level":{"5":"4d8","6":"5d8","7":"6d8","8":"7d8","9":"8d8"}},{"damage_type":"radiant","label":"Faisceau","damage_at_slot_level":{"5":"4d8","6":"5d8","7":"6d8","8":"7d8","9":"8d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de lumière' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Mur de lumière' AND s.ruleset = '5';

-- Transmutation de la pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Transmutation de la pierre', 5, '1 action', 36, '["V","S","M"]', 'de l''argile et de l''eau', NULL, 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous choisissez une zone de roche ou de boue visible, pouvant tenir dans un cube de 12 mètres d''arête à portée, et l''un des effets suivants :

**Roche en boue**. Toute roche non magique de la zone devient un volume égal de boue épaisse et fluide, jusqu''à la fin du sort. Le sol de la zone devient si boueux que les créatures peuvent s''y enfoncer : chaque mètre parcouru dans cette boue coûte quatre mètres de déplacement. Toute créature présente dans la zone à l''incantation doit réussir un jet de sauvegarde de Force ; ce jet est aussi exigé quand une créature se déplace dans la zone pour la première fois d''un tour ou y termine son tour. En cas d''échec, la créature s''enfonce dans la boue et est entravée, mais elle peut dépenser une action pour s''en extraire et mettre fin à cet état. Si vous lancez le sort sur un plafond, la boue tombe : toute créature dessous doit faire un jet de sauvegarde de Dextérité et subit 4d8 dégâts contondants en cas d''échec, la moitié en cas de réussite.

**Boue en roche**. Boue ou sables mouvants de la zone se changent en pierre tendre, sur 3 mètres de profondeur au plus, pour la durée du sort. Toute créature dans la zone au moment du changement doit faire un jet de sauvegarde de Dextérité : en cas de réussite, elle est déplacée en sécurité vers un espace inoccupé ; en cas d''échec, elle est entravée par la roche. Une créature ainsi entravée, ou une autre à portée, peut utiliser une action pour tenter de briser la roche, en réussissant un jet de Force DD 20 ou en lui infligeant des dégâts. La roche a une CA de 15, 25 points de vie, et est immunisée contre le poison et les dégâts psychiques.', 8, '{"ability":"str","success":"none"}', NULL, NULL, '[{"damage_type":"bludgeoning","label":"Boue tombant d''un plafond (jet de Dextérité)","damage_at_slot_level":{"5":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Transmutation de la pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Transmutation de la pierre' AND s.ruleset = '5';

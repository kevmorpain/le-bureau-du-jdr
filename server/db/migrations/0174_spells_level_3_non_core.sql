-- Sorts de niveau 3 hors socle (Xanathar, Tasha) (#176 D1) : les 15 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_3.ts, gardé par test/nuxt/spellsLevelHorsSocle3Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Convocation de démons mineurs
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de démons mineurs', 3, '1 action', 18, '["V","S","M"]', 'une fiole de sang d''humanoïde tué au cours des dernières 24 heures', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous prononcez des mots impies pour invoquer des démons du chaos des Abysses. Lancez un d6 sur la table pour savoir ce qui apparaît :

| d6 | Démons invoqués |
| --- | --- |
| 1-2 | Deux démons de FP 1 ou moins |
| 3-4 | Quatre démons de FP 1/2 ou moins |
| 5-6 | Huit démons de FP 1/4 ou moins |

Le MD choisit les démons (mânes, dretchs…) et vous choisissez les espaces inoccupés que vous voyez à portée où ils apparaissent. Un démon disparaît à 0 point de vie ou à la fin du sort.

Les démons sont hostiles à toutes les créatures, vous compris. Lancez l''initiative une seule fois pour le groupe ; il a ses propres tours. Ils poursuivent et attaquent de leur mieux les non-démons les plus proches. Dans le cadre de l''action Lancer un sort, vous pouvez tracer au sol, avec le sang de la composante matérielle, un cercle assez grand pour englober votre espace : tant que le sort dure, les démons ne peuvent ni le franchir, ni le détruire, ni cibler quelqu''un à l''intérieur. Employer la composante de cette façon la consomme à la fin du sort.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 6 ou 7, vous invoquez deux fois plus de démons ; avec un emplacement de niveau 8 ou 9, trois fois plus.', 2, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de démons mineurs' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation de démons mineurs' AND s.ruleset = '5';

-- Convocation de fée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de fée', 3, '1 action', 27, '["V","S","M"]', 'une fleur dorée d''une valeur d''au moins 300 po', '{"amount":300,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit féerique, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit de fée. À l''incantation, choisissez une humeur : furieuse, joyeuse ou rusée ; la créature prend l''apparence d''une fée de cette humeur, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de fée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien', 'Occultiste', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Convocation de fée' AND s.ruleset = '5';

-- Convocation de mort-vivant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de mort-vivant', 3, '1 action', 27, '["V","S","M"]', 'un crâne doré d''une valeur d''au moins 300 po', '{"amount":300,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit mort-vivant, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit de mort-vivant. À l''incantation, choisissez un type : fantôme, putréfié ou squelette ; la créature prend l''apparence d''un mort-vivant de ce type, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 7, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de mort-vivant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation de mort-vivant' AND s.ruleset = '5';

-- Convocation de rejeton d'ombre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de rejeton d''ombre', 3, '1 action', 27, '["V","S","M"]', 'des larmes à l''intérieur d''une gemme d''une valuer d''au moins 300 po', '{"amount":300,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit d''ombre, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit d''ombre. À l''incantation, choisissez un type : fureur, désespoir ou peur ; la créature prend l''apparence d''un rejeton d''ombre de ce type, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de rejeton d''ombre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation de rejeton d''ombre' AND s.ruleset = '5';

-- Éruption de terre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Éruption de terre', 3, '1 action', 36, '["V","S","M"]', 'un morceau d''obsidienne', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Choisissez un point au sol que vous voyez à portée : une éruption de roche et de terre jaillit dans un cube de 6 mètres d''arête centré sur ce point. Chaque créature de la zone doit effectuer un jet de sauvegarde de Dextérité et subit 3d12 dégâts contondants en cas d''échec, la moitié en cas de réussite. Le terrain de la zone devient en outre un terrain difficile tant qu''il n''est pas déblayé ; chaque section de 1,50 mètre de côté demande au moins 1 minute de déblaiement à la main.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, les dégâts augmentent de 1d12 par niveau d''emplacement au-delà du niveau 3.', 8, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cube","size":6}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"3":"3d12","4":"4d12","5":"5d12","6":"6d12","7":"7d12","8":"8d12","9":"9d12"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Éruption de terre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Éruption de terre' AND s.ruleset = '5';

-- Flèches enflammées
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Flèches enflammées', 3, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez un carquois contenant des flèches ou des carreaux. Quand une attaque à distance avec une arme tirée avec une munition de ce carquois touche, la cible subit 1d6 dégâts de feu supplémentaires. La magie d''une munition prend fin quand elle touche ou rate, et le sort cesse tout à fait une fois douze munitions tirées du carquois.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, le nombre de munitions pouvant être affectées augmente de deux par niveau d''emplacement au-delà du niveau 3.', 8, NULL, NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"3":"1d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flèches enflammées' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Flèches enflammées' AND s.ruleset = '5';

-- Forteresse d'intellect
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Forteresse d''intellect', 3, '1 action', 9, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Pour la durée du sort, vous ou une créature consentante que vous voyez à portée avez la résistance aux dégâts psychiques et l''avantage aux jets de sauvegarde d''Intelligence, de Sagesse et de Charisme.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, vous pouvez cibler une créature de plus par niveau d''emplacement au-delà du niveau 3, à condition que les cibles soient à 9 mètres ou moins les unes des autres.', 1, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Forteresse d''intellect' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Forteresse d''intellect' AND s.ruleset = '5';

-- Foulée tonitruante
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Foulée tonitruante', 3, '1 action', 27, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous vous téléportez dans un espace inoccupé que vous voyez à portée. Un coup de tonnerre retentit aussitôt, audible à 90 mètres : chaque créature à 3 mètres ou moins de l''espace que vous quittez doit effectuer un jet de sauvegarde de Constitution et subit 3d10 dégâts de tonnerre en cas d''échec, la moitié en cas de réussite. Vous emportez les objets que vous pouvez transporter. Vous pouvez aussi téléporter une créature consentante de votre taille ou plus petite, avec son équipement dans la limite de sa capacité de charge ; elle doit être à 1,50 mètre ou moins de vous à l''incantation, et il doit y avoir un espace inoccupé dans un rayon de 1,50 mètre autour de votre destination, sans quoi elle reste sur place.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, les dégâts augmentent de 1d10 par niveau d''emplacement au-delà du niveau 3.', 2, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":3}', '[{"damage_type":"thunder","damage_at_slot_level":{"3":"3d10","4":"4d10","5":"5d10","6":"6d10","7":"7d10","8":"8d10","9":"9d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Foulée tonitruante' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Foulée tonitruante' AND s.ruleset = '5';

-- Minuscules météores de Melf
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Minuscules météores de Melf', 3, '1 action', 0, '["V","S","M"]', 'du salpêtre, du soufre et du goudron de pin sous forme de bille', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez six météores minuscules qui flottent dans votre espace et orbitent autour de vous pendant la durée du sort. À l''incantation, puis par une action bonus à chacun de vos tours, vous pouvez envoyer un ou deux météores vers un ou plusieurs points situés dans un rayon de 36 mètres autour de vous. Quand un météore arrive à destination ou heurte une surface solide, il explose : chaque créature à 1,50 mètre ou moins du point d''impact doit effectuer un jet de sauvegarde de Dextérité et subit 2d6 dégâts de feu en cas d''échec, la moitié en cas de réussite.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, vous créez deux météores de plus par niveau d''emplacement au-delà du niveau 3.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":1.5}', '[{"damage_type":"fire","damage_at_slot_level":{"3":"2d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Minuscules météores de Melf' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Minuscules météores de Melf' AND s.ruleset = '5';

-- Mur d'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mur d''eau', 3, '1 action', 18, '["V","S","M"]', 'une goutte d''eau', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez un mur d''eau au sol, en un point que vous voyez à portée : soit un mur droit d''au plus 9 mètres de long, 3 mètres de haut et 30 cm d''épaisseur, soit un mur circulaire d''au plus 6 mètres de diamètre, 6 mètres de haut et 30 cm d''épaisseur. Il disparaît à la fin du sort, et l''espace qu''il occupe est un terrain difficile.

Une attaque à distance avec une arme qui entre dans l''espace du mur a un désavantage au jet d''attaque, et les dégâts de feu sont réduits de moitié si l''effet traverse le mur pour atteindre sa cible. Un sort de froid qui traverse le mur gèle la zone touchée en glace solide, sur une section de 1,50 mètre de côté au minimum. Chaque section gelée de 1,50 mètre de côté a 15 points de vie et une CA de 5 ; la réduire à 0 point de vie la détruit, et l''eau du mur ne la remplit pas.', 5, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur d''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur d''eau' AND s.ruleset = '5';

-- Mur de sable
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mur de sable', 3, '1 action', 27, '["V","S","M"]', 'une poignée de sable', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez au sol un mur de sable tourbillonnant, en un point que vous voyez à portée, long de 9 mètres au plus, haut de 3 mètres et épais de 3 mètres, qui disparaît à la fin du sort. Il bloque la ligne de vue mais pas le déplacement. Une créature est aveuglée tant qu''elle se trouve dans l''espace du mur et dépense 3 mètres de mouvement pour 1 mètre parcouru dedans.', 5, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de sable' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de sable' AND s.ruleset = '5';

-- Raz-de-marée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Raz-de-marée', 3, '1 action', 36, '["V","S","M"]', 'une goutte d''eau', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous conjurez une vague qui s''écrase sur une zone à portée, longue de 9 mètres au plus, large de 3 mètres et haute de 3 mètres. Chaque créature de la zone doit effectuer un jet de sauvegarde de Dextérité : en cas d''échec, elle subit 4d8 dégâts contondants et tombe à terre ; en cas de réussite, elle subit la moitié des dégâts et reste debout. L''eau se répand ensuite sur le sol dans toutes les directions, éteint les flammes non protégées de la zone et à 9 mètres autour, puis disparaît.', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"3":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Raz-de-marée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Raz-de-marée' AND s.ruleset = '5';

-- Serviteur miniature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Serviteur miniature', 3, '1 minute', 1.5, '["V","S"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Vous touchez un objet non magique, qui n''est ni attaché à un autre objet ou à une surface, ni porté ou transporté par une créature. Il s''anime, de minuscules jambes et bras lui poussent, et il devient une créature sous votre contrôle jusqu''à la fin du sort ou jusqu''à ce que ses points de vie tombent à 0. Il utilise les statistiques d''un serviteur miniature.

Par une action bonus, vous pouvez lui donner mentalement un ordre s''il est à 36 mètres ou moins de vous (avec plusieurs créatures issues de ce sort, vous pouvez donner un ordre à chacune ou à toutes). Vous décidez de son action et de son déplacement au prochain tour, ou vous donnez un ordre général (aller chercher une clé, monter la garde, ranger des livres). Sans ordre, le serviteur reste inactif et se défend seulement contre les créatures hostiles. Il suit un ordre jusqu''à son accomplissement.

À 0 point de vie, il reprend sa forme d''origine en gardant les dégâts physiques subis.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, vous pouvez animer deux objets de plus par niveau d''emplacement au-delà du niveau 3.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Serviteur miniature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Serviteur miniature' AND s.ruleset = '5';

-- Sieste
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sieste', 3, '1 action', 9, '["S","M"]', 'une pincée de sable', NULL, 0, '10 minutes', 'minute', 10, 0, 'Vous faites un geste apaisant, et jusqu''à trois créatures consentantes de votre choix que vous voyez à portée tombent inconscientes pour la durée du sort. Pour une cible, le sort se termine plus tôt si elle subit des dégâts ou si quelqu''un utilise une action pour la secouer ou la réveiller. Une cible qui reste inconsciente pendant toute la durée profite d''un repos court, et ne peut plus être affectée par ce sort avant d''avoir terminé un repos long.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, vous pouvez cibler une créature consentante de plus par niveau d''emplacement au-delà du niveau 3.', 4, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sieste' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sieste' AND s.ruleset = '5';

-- Voile spirituel
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Voile spirituel', 3, '1 action bonus', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous appelez des esprits de la mort, intangibles et invulnérables, qui flottent autour de vous pour la durée du sort. Jusqu''à sa fin, chacune de vos attaques inflige 1d8 dégâts supplémentaires quand elle touche une créature à 3 mètres ou moins de vous ; vous choisissez à l''incantation le type : radiant, nécrotique ou froid. Une créature qui subit ces dégâts ne peut pas récupérer de points de vie avant la fin de votre prochain tour.

De plus, la vitesse de chaque créature de votre choix que vous voyez et qui commence son tour à 3 mètres ou moins de vous tombe à 3 mètres jusqu''à la fin de votre prochain tour.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 4 ou supérieur, les dégâts augmentent de 1d8 par niveau d''emplacement au-delà du niveau 3.', 7, NULL, NULL, '{"shape":"emanation","size":3}', '[{"damage_type":"radiant","label":"Radiants, nécrotiques ou froid (au choix)","damage_at_slot_level":{"3":"1d8","4":"2d8","5":"3d8","6":"4d8","7":"5d8","8":"6d8","9":"7d8"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Voile spirituel' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien', 'Occultiste', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Voile spirituel' AND s.ruleset = '5';

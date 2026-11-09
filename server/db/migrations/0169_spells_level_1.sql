-- Sorts de niveau 1 du socle (#176 D1) : les 34 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_1.ts, gardé par test/nuxt/spellsLevel1Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Amitié avec les animaux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Amitié avec les animaux', 1, '1 action', 9, '["V","S","M"]', 'un morceau de nourriture', NULL, 0, '24 heures', 'hour', 24, 0, 'Ce sort vous permet de persuader une bête que vous ne lui voulez aucun mal. Choisissez une bête que vous pouvez voir dans la portée du sort. Elle doit vous voir et vous entendre. Si l''Intelligence de la bête est de 4 ou plus, le sort échoue. Autrement, la bête doit réussir un jet de sauvegarde de Sagesse ou être charmée pour la durée du sort. Si vous, ou un de vos compagnons, blessez la cible, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous pouvez charmer une bête supplémentaire pour chaque niveau d''emplacement au-delà du niveau 1.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Amitié avec les animaux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Amitié avec les animaux' AND s.ruleset = '5';

-- Baies nourricières
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Baies nourricières', 1, '1 action', 1.5, '["V","S","M"]', 'une branche de gui', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Jusqu''à dix baies imprégnées de magie apparaissent dans votre main pour la durée de leur potentiel (voir ci-dessous). Une créature peut utiliser son action pour manger une baie. Manger une baie rend 1 point de vie, et la baie est suffisamment nourrissante pour sustenter une créature pour une journée.

Les baies perdent leur potentiel si elles n''ont pas été consommées dans les 24 heures qui suivent le lancement du sort.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Baies nourricières' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Baies nourricières' AND s.ruleset = '5';

-- Bouclier
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bouclier', 1, '1 réaction', 0, '["V","S"]', NULL, NULL, 0, '1 round', 'round', 1, 0, '**Temps d''incantation** : 1 réaction, que vous prenez lorsque vous êtes touché par une attaque ou ciblé par le sort *projectile magique*

Une barrière invisible de force magique apparaît et vous protège. Jusqu''au début de votre prochain tour, vous obtenez un bonus de +5 à votre CA, y compris contre l''attaque qui a déclenché le sort, et vous ne prenez aucun dégât par le sort *projectile magique*.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bouclier' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Bouclier' AND s.ruleset = '5';

-- Châtiment calcinant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment calcinant', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature avec une attaque au corps à corps avec une arme pendant la durée du sort, votre arme est chauffée à blanc, et votre attaque inflige 1d6 dégâts de feu supplémentaires à la cible et l''enflamme. Au début de chacun de ses tours jusqu''à la fin du sort, la cible doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, elle subit 1d6 dégâts de feu. En cas de réussite, le sort prend fin. Si la cible, ou une créature située à 1,50 mètre d''elle, utilise son action pour étouffer les flammes, ou si tout autre effet éteint les flammes (par exemple si la cible se plonge dans l''eau), le sort prend fin.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts supplémentaires initiaux infligés par l''attaque augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"fire","label":"Dégâts supplémentaires de l''attaque","damage_at_slot_level":{"1":"1d6","2":"2d6","3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}},{"damage_type":"fire","label":"Au début de chaque tour de la cible","damage_at_slot_level":{"1":"1d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment calcinant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment calcinant' AND s.ruleset = '5';

-- Châtiment courroucé
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment courroucé', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une cible lors d''une attaque au corps à corps avec une arme pendant la durée du sort, votre attaque inflige 1d6 dégâts psychiques supplémentaires. De plus, si la cible est une créature, elle doit réussir un jet de sauvegarde de Sagesse ou être effrayée jusqu''à la fin du sort. Par une action, la créature peut effectuer un jet de Sagesse contre le DD de sauvegarde de votre sort pour mettre un terme à cet effet et au sort.', 5, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"1":"1d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment courroucé' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment courroucé' AND s.ruleset = '5';

-- Châtiment tonitruant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment tonitruant', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La première fois que vous touchez une cible lors une attaque au corps à corps avec une arme pendant que le sort est actif, votre arme résonne tel un tonnerre audible à 90 mètres à la ronde, et l''attaque inflige 2d6 dégâts de tonnerre supplémentaires à la cible. De plus, si la cible est une créature, elle doit réussir un jet de sauvegarde de Force sous peine d''être repoussée de vous sur 3 mètres puis de tomber à terre.', 5, '{"ability":"str","success":"none"}', NULL, NULL, '[{"damage_type":"thunder","damage_at_slot_level":{"1":"2d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment tonitruant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment tonitruant' AND s.ruleset = '5';

-- Couleurs dansantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Couleurs dansantes', 1, '1 action', 0, '["V","S","M"]', 'une pincée de poudre ou de sable de couleur rouge, jaune et bleu', NULL, 0, '1 round', 'round', 1, 0, 'Un assortiment éblouissant de faisceaux lumineux et colorés fait éruption de votre main. Lancez 6d10. Cette valeur représente le nombre maximal de points de vie des créatures que vous pouvez affecter avec ce sort. Les créatures dans un cône de 4,50 mètres dont vous êtes l''origine sont affectées selon l''ordre croissant de leurs points de vie (en ignorant les créatures inconscientes et celles qui ne peuvent pas voir).

En partant de la créature avec le plus petit nombre de points de vie, chaque créature affectée par ce sort est aveuglée jusqu''à la fin de votre prochain tour. Retirez les points de vie de chaque créature avant de passer à la prochaine créature avec le plus petit nombre de points de vie. Les points de vie d''une créature doivent être égaux ou inférieurs au total pour que cette créature soit affectée.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, ajoutez 2d10 au lancer initial pour chaque niveau d''emplacement au-delà du niveau 1.', 6, NULL, NULL, '{"shape":"cone","size":4.5}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Couleurs dansantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Couleurs dansantes' AND s.ruleset = '5';

-- Création ou destruction d'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Création ou destruction d''eau', 1, '1 action', 9, '["V","S","M"]', 'une goutte d''eau pour la création d''eau ou quelques grains de sable pour la destruction d''eau', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Soit vous créez, soit vous détruisez de l''eau.

**Création d''eau**. Vous créez jusqu''à 40 litres d''eau pure dans un contenant ouvert à portée. Vous pouvez sinon choisir de faire tomber l''eau sous forme de pluie dans un cube de 9 mètres d''arête à portée, éteignant ainsi les flammes non protégées de la zone.

**Destruction d''eau**. Vous détruisez jusqu''à 40 litres d''eau présente dans un contenant ouvert à portée. Sinon, vous pouvez choisir de supprimer le brouillard dans un cube de 9 mètres d''arête à portée.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous créez ou détruisez 40 litres d''eau supplémentaires, ou augmentez la taille du cube de 1,50 mètre d''arête, pour chaque niveau d''emplacement au-delà du niveau 1.', 8, NULL, NULL, '{"shape":"cube","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Création ou destruction d''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Création ou destruction d''eau' AND s.ruleset = '5';

-- Disque flottant de Tenser
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Disque flottant de Tenser', 1, '1 action', 9, '["V","S","M"]', 'une goutte de mercure', NULL, 1, '1 heure', 'hour', 1, 0, 'Ce sort crée un plateau de force horizontal et circulaire, de 90 cm de diamètre et épais de 2,50 cm, qui flotte 90 cm au-dessus du sol dans un espace inoccupé de votre choix, à portée et que vous pouvez voir. Le disque reste en place pour la durée du sort et peut supporter 250 kg. Si plus de poids est placé sur le disque, le sort prend fin, et tout ce qui se trouve sur le disque tombe sur le sol.

Le disque est immobile tant que vous vous trouvez à 6 mètres de lui. Si vous vous déplacez à plus de 6 mètres, le disque vous suit jusqu''à se retrouver de nouveau à 6 mètres de vous. Il peut se déplacer au-dessus de n''importe quel type de terrain, monter et descendre les escaliers, les pentes et tout ce qui y ressemble, mais il ne peut effectuer un changement brutal d''altitude égal ou supérieur à 3 mètres. Par exemple, le disque ne peut pas se déplacer au-dessus d''un gouffre de 3 mètres de profondeur, ou il ne peut pas sortir d''un gouffre de 3 mètres de haut s''il a été invoqué au fond.

Si vous vous déplacez à plus de 30 mètres du disque (par exemple parce qu''il ne peut pas passer au-dessus d''un obstacle pour vous suivre), le sort prend fin.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Disque flottant de Tenser' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Disque flottant de Tenser' AND s.ruleset = '5';

-- Duel forcé
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Duel forcé', 1, '1 action bonus', 9, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous essayez de contraindre une créature d''engager un duel avec vous. Une créature à portée que vous pouvez voir doit effectuer un jet de sauvegarde de Sagesse. En cas d''échec, vous obnubilez la créature, contrainte par votre exigence divine. Pour toute la durée du sort, la créature a un désavantage aux jets d''attaque effectués contre d''autres créatures que vous, et doit effectuer un jet de sauvegarde de Sagesse à chaque fois qu''elle essaye de s''éloigner à plus de 9 mètres de vous ; si elle réussit son jet de sauvegarde, le sort ne restreint pas son mouvement pour ce tour.

Ce sort se termine si vous attaquez une autre créature, si vous lancez un sort qui cible une autre créature hostile que la cible, si une créature qui vous est alliée inflige des dégâts à la cible ou lance un sort sur la cible qui lui est nuisible, ou si vous terminez votre tour à plus de 9 mètres de la cible.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Duel forcé' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Duel forcé' AND s.ruleset = '5';

-- Enchevêtrement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Enchevêtrement', 1, '1 action', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Herbes et lianes germent du sol dans un carré de 6 mètres d''arête ayant son origine sur un point dans la portée du sort. Pour la durée du sort, ces plantes rendent le terrain difficile.

Une créature prise dans la zone lorsque vous incantez le sort doit réussir un jet de sauvegarde de Force ou être entravée par l''enchevêtrement de plantes jusqu''à la fin du sort. Une créature entravée par les plantes peut utiliser une action pour faire un jet de sauvegarde de Force contre le DD de sauvegarde de votre sort. En cas de réussite, la créature se libère.

Lorsque le sort prend fin, les plantes invoquées se fanent.', 2, '{"ability":"str","success":"none"}', NULL, '{"shape":"square","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Enchevêtrement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Enchevêtrement' AND s.ruleset = '5';

-- Faveur divine
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Faveur divine', 1, '1 action bonus', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Votre prière vous donne de la puissance dans un rayonnement divin. Jusqu''à ce que le sort se termine, vos attaques avec une arme infligent 1d4 dégâts radiants supplémentaires lorsqu''elles touchent.', 5, NULL, NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"1":"1d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Faveur divine' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Faveur divine' AND s.ruleset = '5';

-- Feuille morte
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Feuille morte', 1, '1 réaction', 18, '["V","M"]', 'une petite plume ou un peu de duvet', NULL, 0, '1 minute', 'minute', 1, 0, '**Temps d''incantation** : 1 réaction, que vous prenez lorsque vous ou une créature à 18 mètres ou moins de vous tombez.

Choisissez jusqu''à cinq créatures en chute libre dans la portée du sort. Le taux de descente d''une créature en chute libre est ramené à 18 mètres par round jusqu''à la fin du sort. Si la créature atterrit avant la fin du sort, elle ne subit aucun dégât de chute et elle retombe sur ses pieds. Le sort prend alors fin pour cette créature.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Feuille morte' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Feuille morte' AND s.ruleset = '5';

-- Fou rire de Tasha
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fou rire de Tasha', 1, '1 action', 9, '["V","S","M"]', 'de minuscules tartes et une plume qui est agitée dans les airs', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une créature de votre choix, que vous pouvez voir et à portée, a l''impression que tout ce qu''elle perçoit est hilarant et lui provoque une intense crise de fou rire. La cible doit réussir un jet de sauvegarde de Sagesse sous peine de tomber à terre, et être incapable d''agir et de se relever pour toute la durée du sort. Une créature ayant une Intelligence de 4 ou moins ne peut pas être affectée par ce sort.

À la fin de chacun de ses tours, et à chaque fois qu''elle subit des dégâts, la cible peut effectuer un nouveau jet de sauvegarde de Sagesse. La cible a un avantage à son jet de sauvegarde s''il est déclenché par des dégâts. En cas de réussite, le sort prend fin.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fou rire de Tasha' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Fou rire de Tasha' AND s.ruleset = '5';

-- Frappe piégeuse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Frappe piégeuse', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature avec une attaque avec une arme avant que ce sort ne prenne fin, une masse tortueuse de lianes épineuses apparaît au point d''impact, et la cible doit réussir un jet de sauvegarde de Force sous peine d''être entravée par ces lianes magiques jusqu''à ce que le sort prenne fin. Une créature de taille G ou supérieure a un avantage à son jet de sauvegarde. Si la cible réussit son jet de sauvegarde, les lianes se flétrissent et tombent.

Tant qu''elle est entravée par ce sort, la cible subit 1d6 dégâts perforants au début de chacun de ses tours. Une créature entravée par ces lianes, ou une autre créature capable de la toucher, peut utiliser son action pour effectuer un jet de Force contre le DD de sauvegarde de votre sort. En cas de réussite, la cible est libérée.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 1.', 2, '{"ability":"str","success":"none"}', NULL, NULL, '[{"damage_type":"piercing","label":"Au début de chaque tour de la cible","damage_at_slot_level":{"1":"1d6","2":"2d6","3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Frappe piégeuse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Frappe piégeuse' AND s.ruleset = '5';

-- Graisse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Graisse', 1, '1 action', 18, '["V","S","M"]', 'une noix de beurre ou un peu de couenne de porc', NULL, 0, '1 minute', 'minute', 1, 0, 'Une graisse visqueuse recouvre le sol sur un carré de 3 mètres de côté centré sur un point à portée, transformant cette zone en terrain difficile.

Lorsque la graisse apparaît, chaque créature se tenant debout dans la zone doit réussir un jet de sauvegarde de Dextérité sous peine de tomber à terre. Une créature qui entre dans la zone ou y termine son tour doit également réussir un jet de sauvegarde de Dextérité si elle ne veut pas tomber à terre.', 2, '{"ability":"dex","success":"none"}', NULL, '{"shape":"square","size":3}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Graisse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Graisse' AND s.ruleset = '5';

-- Grande foulée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Grande foulée', 1, '1 action', 1.5, '["V","S","M"]', 'une pincée de terre', NULL, 0, '1 heure', 'hour', 1, 0, 'Vous touchez une créature. La vitesse de la cible augmente de 3 mètres jusqu''à la fin du sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 1.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Grande foulée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Grande foulée' AND s.ruleset = '5';

-- Grêle d'épines
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Grêle d''épines', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature lors d''une attaque à distance avec une arme avant que le sort ne prenne fin, ce sort crée une pluie d''épines qui jaillissent de votre arme à distance ou de la munition. En plus de l''effet normal de l''attaque, la cible de l''attaque et toutes les créatures à 1,50 mètre ou moins d''elle doivent effectuer un jet de sauvegarde de Dextérité, subissant 1d10 dégâts perforants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d10 pour chaque niveau d''emplacement au-delà du niveau 1 (jusqu''à un maximum de 6d10).', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"piercing","damage_at_slot_level":{"1":"1d10","2":"2d10","3":"3d10","4":"4d10","5":"5d10","6":"6d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Grêle d''épines' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Grêle d''épines' AND s.ruleset = '5';

-- Héroïsme
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Héroïsme', 1, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une créature consentante que vous touchez est submergée par le courage. Jusqu''à la fin du sort, la créature est immunisée contre l''état effrayé et gagne un nombre de points de vie temporaires égal au modificateur de votre caractéristique d''incantation, et ce au début de chacun de ses tours. Lorsque le sort prend fin, la cible perd tous les points de vie temporaires qu''il lui restait et qui lui avaient été conférés par ce sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 1.', 4, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Héroïsme' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Héroïsme' AND s.ruleset = '5';

-- Mains brûlantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mains brûlantes', 1, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'En tendant vos mains, les pouces en contact et les doigts écartés, un mince rideau de flammes gicle du bout de tous vos doigts tendus. Toute créature se trouvant dans le cône de 4,50 mètres doit effectuer un jet de sauvegarde de Dextérité. La créature subit 3d6 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Le feu embrase tous les objets inflammables qui se trouvent dans la zone d''effet et qui ne sont pas tenus ou portés.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cone","size":4.5}', '[{"damage_type":"fire","damage_at_slot_level":{"1":"3d6","2":"4d6","3":"5d6","4":"6d6","5":"7d6","6":"8d6","7":"9d6","8":"10d6","9":"11d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mains brûlantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mains brûlantes' AND s.ruleset = '5';

-- Marque du chasseur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Marque du chasseur', 1, '1 action bonus', 27, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous choisissez une créature que vous pouvez voir et à portée, et la marquez magiquement comme étant votre cible. Jusqu''à ce que le sort prenne fin, vous infligez 1d6 dégâts supplémentaires à la cible lorsque vous la touchez lors d''une attaque avec une arme, et vous avez un avantage à tous vos jets de Sagesse (Perception) ou Sagesse (Survie) effectués pour la trouver. Si la cible tombe à 0 point de vie avant que le sort ne prenne fin, vous pouvez utiliser votre action bonus lors de l''un de vos tours suivants pour marquer une nouvelle créature.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou 4, vous pouvez maintenir votre concentration sur ce sort pendant 8 heures maximum. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, vous pouvez maintenir votre concentration sur ce sort pendant 24 heures maximum.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Marque du chasseur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Marque du chasseur' AND s.ruleset = '5';

-- Nappe de brouillard
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Nappe de brouillard', 1, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous créez une sphère de brouillard de 6 mètres de rayon centrée sur un point dans la portée du sort. La sphère s''étend au-delà des coins et la visibilité dans la zone est nulle. Elle persiste pour la durée du sort ou jusqu''à ce qu''un vent de force modérée ou plus (au moins 15 km/h) la dissipe.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, le rayon de la sphère augmente de 6 mètres pour chaque niveau d''emplacement au-delà du niveau 1.', 2, NULL, NULL, '{"shape":"sphere","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nappe de brouillard' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Nappe de brouillard' AND s.ruleset = '5';

-- Orbe chromatique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Orbe chromatique', 1, '1 action', 27, '["V","S","M"]', 'un diamant valant au moins 50 po', '{"amount":50,"unit":"po"}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous projetez une sphère d''énergie de 10 cm de diamètre vers une créature que vous pouvez voir dans la portée du sort. Vous choisissez acide, foudre, feu, froid, poison ou tonnerre comme type d''orbe que vous créez. Vous faites ensuite une attaque à distance avec un sort contre la cible. Si l''attaque touche, la créature subit 3d8 dégâts du type préalablement déterminé.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, NULL, 'ranged', NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Orbe chromatique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Orbe chromatique' AND s.ruleset = '5';

-- Projectile magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, multi_attack)
SELECT 'Projectile magique', 1, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous créez trois fléchettes de force magique d''un bleu lumineux. Chaque fléchette atteint une créature de votre choix que vous pouvez voir et dans la limite de portée du sort. Chaque projectile inflige 1d4 + 1 dégâts de force à sa cible. Les fléchettes frappent simultanément, et peuvent frapper une ou plusieurs créatures.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, il crée une fléchette additionnelle pour chaque niveau d''emplacement au-delà du niveau 1.', 5, NULL, NULL, NULL, '[{"damage_type":"force","damage_at_slot_level":{"1":"3d4 + 3","2":"4d4 + 4","3":"5d4 + 5","4":"6d4 + 6","5":"7d4 + 7","6":"8d4 + 8","7":"9d4 + 9","8":"10d4 + 10","9":"11d4 + 11"}}]', NULL, '{"label":"Fléchettes","count_at_slot_level":{"1":3,"2":4,"3":5,"4":6,"5":7,"6":8,"7":9,"8":10,"9":11}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Projectile magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Projectile magique' AND s.ruleset = '5';

-- Purification de nourriture et d'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Purification de nourriture et d''eau', 1, '1 action', 3, '["V","S"]', NULL, NULL, 1, 'Instantanée', 'instant', NULL, 0, 'Toute la nourriture et toutes les boissons, non magiques, se trouvant dans une sphère de 1,50 mètre de rayon, et centrée sur un point de votre choix à portée, sont purifiées et débarrassées de tout poison et de toute maladie.', 8, NULL, NULL, '{"shape":"sphere","size":1.5}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Purification de nourriture et d''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Purification de nourriture et d''eau' AND s.ruleset = '5';

-- Rayon empoisonné
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Rayon empoisonné', 1, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un rayon d''énergie verdâtre et contagieuse est envoyé en direction d''une créature à portée. Effectuez une attaque à distance avec un sort contre la cible. Si le coup touche, la cible subit 2d8 dégâts de poison et doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, la cible est empoisonnée jusqu''à la fin de votre prochain tour.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 1.', 7, '{"ability":"con"}', 'ranged', NULL, '[{"damage_type":"poison","damage_at_slot_level":{"1":"2d8","2":"3d8","3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayon empoisonné' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Rayon empoisonné' AND s.ruleset = '5';

-- Repli expéditif
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Repli expéditif', 1, '1 action bonus', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Ce sort vous permet de vous déplacer à une vitesse incroyable. Lorsque vous lancez ce sort, puis par une action bonus à chacun de vos tours jusqu''à la fin du sort, vous pouvez effectuer l''action Foncer.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Repli expéditif' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Repli expéditif' AND s.ruleset = '5';

-- Représailles infernales
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Représailles infernales', 1, '1 réaction', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, '**Temps d''incantation** : 1 réaction, que vous prenez après avoir subi des dégâts par une créature située à 18 mètres maximum de vous et que vous pouvez voir.

Vous pointez votre doigt, et la créature qui vous a infligé des dégâts est momentanément entourée de flammes infernales. La créature doit effectuer un jet de sauvegarde de Dextérité, subissant 2d10 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts sont augmentés de 1d10 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"1":"2d10","2":"3d10","3":"4d10","4":"5d10","5":"6d10","6":"7d10","7":"8d10","8":"9d10","9":"10d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Représailles infernales' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Représailles infernales' AND s.ruleset = '5';

-- Sanctuaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sanctuaire', 1, '1 action bonus', 9, '["V","S","M"]', 'un petit miroir en argent', NULL, 0, '1 minute', 'minute', 1, 0, 'Vous protégez une créature dans la portée du sort contre les attaques. Jusqu''à ce que le sort se termine, toute créature qui cible la créature protégée avec une attaque ou un sort offensif doit d''abord effectuer un jet de sauvegarde de Sagesse. En cas d''échec, la créature doit choisir une nouvelle cible ou perdre son attaque ou son sort. Ce sort ne protège pas la créature protégée contre les sorts à zone d''effet, tel que l''explosion d''une boule de feu.

Si la créature protégée fait une attaque, lance un sort qui affecte une créature ennemie ou inflige des dégâts à une autre créature, ce sort se termine.', 1, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sanctuaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Sanctuaire' AND s.ruleset = '5';

-- Serviteur invisible
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Serviteur invisible', 1, '1 action', 18, '["V","S","M"]', 'un morceau de ficelle et un bout de bois', NULL, 1, '1 heure', 'hour', 1, 0, 'Ce sort crée une force invisible, sans volonté propre, informe mais de taille M, qui exécute les ordres simples que vous lui transmettez, jusqu''à la fin du sort. Le serviteur prend vie dans un espace inoccupé sur le sol et à portée. Il possède les caractéristiques suivantes : CA 10 ; 1 point de vie ; Force 2 ; ne peut pas attaquer. Le sort se termine si le serviteur tombe à 0 point de vie.

Une fois par tour, par une action bonus, vous pouvez mentalement ordonner au serviteur de se déplacer de 4,50 mètres et d''interagir avec un objet. Le serviteur peut exécuter des tâches simples comme un serviteur humain le ferait, comme rapporter quelque chose, nettoyer, raccommoder, plier des vêtements, entretenir un feu, servir à manger, et verser du vin. Une fois votre ordre donné, le serviteur cherche à l''exécuter du mieux qu''il peut jusqu''à ce que la tâche soit accomplie, puis il attend votre ordre suivant.

Si vous demandez à votre serviteur d''effectuer une tâche qui devrait l''envoyer à plus de 18 mètres de vous, le sort prend fin.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Serviteur invisible' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Serviteur invisible' AND s.ruleset = '5';

-- Sommeil
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sommeil', 1, '1 action', 27, '["V","S","M"]', 'une pincée de sable fin, de pétales de rose ou un grillon', NULL, 0, '1 minute', 'minute', 1, 0, 'Ce sort expédie les créatures dans un sommeil magique. Lancez 5d8 ; le total est le nombre de points de vie des créatures que ce sort peut affecter. Les créatures à 6 mètres ou moins du point que vous choisissez dans la portée du sort sont affectées par ordre croissant de leurs points de vie actuels (en ignorant les créatures inconscientes).

En commençant par la créature qui a le plus faible nombre de points de vie actuel, chaque créature affectée par ce sort tombe inconsciente jusqu''à ce que le sort se termine, que la créature endormie prenne des dégâts ou que quelqu''un utilise une action pour secouer ou frapper la créature endormie pour la réveiller. Soustrayez les points de vie de chaque créature du total permis par le sort avant de passer à la prochaine créature avec le plus faible nombre de points de vie. Le nombre de points de vie actuels d''une créature doit être égal ou inférieur au total restant permis par le sort pour que cette créature soit affectée.

Les morts-vivants et les créatures immunisées contre les effets de charme ne sont pas affectés par ce sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, lancez 2d8 supplémentaires pour chaque niveau d''emplacement au-delà du niveau 1.', 4, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sommeil' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sommeil' AND s.ruleset = '5';

-- Texte illusoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Texte illusoire', 1, '1 minute', 1.5, '["S","M"]', 'une encre à base de plomb d''une valeur d''au moins 10 po, que le sort consomme', '{"amount":10,"unit":"po","consumed":true}', 1, '10 jours', 'day', 10, 0, 'Vous écrivez sur un parchemin, du papier, ou tout autre matériau adapté à l''écriture, et l''imprégnez d''une puissante illusion qui reste en place pour toute la durée du sort.

Pour vous et pour toute créature que vous avez désignée lorsque vous avez lancé ce sort, l''écriture apparaît normalement, tracée de votre main, et transmet ce que vous souhaitiez communiquer lorsque vous avez lancé ce sort. Pour toutes les autres créatures, les écritures semblent être rédigées dans un dialecte inconnu ou magique, ce qui les rend inintelligibles. Vous pouvez sinon faire en sorte que les écritures transmettent un tout autre message, écrit d''une autre main et dans un autre langage, à condition que ce soit un langage que vous connaissiez.

Dans le cas où le sort serait dissipé, le texte original et l''illusion disparaissent tous les deux.

Une créature qui possède la vision véritable peut lire le message caché.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Texte illusoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Texte illusoire' AND s.ruleset = '5';

-- Trait ensorcelé
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Trait ensorcelé', 1, '1 action', 9, '["V","S","M"]', 'la branche d''un arbre qui a été frappé par la foudre', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un rayon d''énergie bleu crépitante est projeté sur une créature à portée, formant un arc électrique continu entre la cible et vous. Effectuez une attaque à distance avec un sort contre la créature. Si vous touchez, la cible subit 1d12 dégâts de foudre, et à chacun de vos tours, pour la durée du sort, vous pouvez utiliser votre action pour infliger automatiquement 1d12 dégâts de foudre à la cible. Le sort se termine si vous utilisez votre action pour faire autre chose qu''infliger ces dégâts de foudre, si la cible se retrouve hors de la portée du sort, ou si elle obtient un abri total contre vous.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts initiaux sont augmentés de 1d12 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, NULL, 'ranged', NULL, '[{"damage_type":"lightning","label":"Attaque initiale","damage_at_slot_level":{"1":"1d12","2":"2d12","3":"3d12","4":"4d12","5":"5d12","6":"6d12","7":"7d12","8":"8d12","9":"9d12"}},{"damage_type":"lightning","label":"À chacun de vos tours suivants","damage_at_slot_level":{"1":"1d12"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Trait ensorcelé' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Trait ensorcelé' AND s.ruleset = '5';

-- Vague tonnante
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Vague tonnante', 1, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une vague de force de tonnerre émane de vous. Toute créature se trouvant dans un cube de 4,50 mètres d''arête prenant origine à partir de vous-même doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, la créature subit 2d8 dégâts de tonnerre et est repoussée de 3 mètres de vous. En cas de réussite, elle subit la moitié de ces dégâts et n''est pas repoussée.

En outre, les objets non fixés qui se trouvent entièrement dans la zone d''effet sont automatiquement repoussés de 3 mètres par l''effet du sort, et le sort émet un coup de tonnerre audible jusqu''à 90 mètres.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"cube","size":4.5}', '[{"damage_type":"thunder","damage_at_slot_level":{"1":"2d8","2":"3d8","3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Vague tonnante' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Vague tonnante' AND s.ruleset = '5';

-- Sorts de niveau 7 du socle (#176 D1) : les 16 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_7.ts, gardé par test/nuxt/spellsLevel7Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Boule de feu à retardement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Boule de feu à retardement', 7, '1 action', 45, '["V","S","M"]', 'une toute petite boule de guano de chauve-souris et du souffre', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La pointe de votre doigt émet un rayon de lumière jaune qui se concentre sur un point dans la portée du sort et prend la forme d''une bille luisante pour la durée du sort. Lorsque le sort prend fin, soit parce que votre concentration est interrompue, soit parce que vous décidez d''y mettre fin, la bille s''ouvre dans un rugissement grave et laisse éclater des flammes qui contournent les coins. Chaque créature dans une sphère de 6 mètres de rayon centrée sur ce point doit effectuer un jet de sauvegarde de Dextérité, subissant un nombre de dégâts de feu égal à la somme cumulée en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Les dégâts de base sont 12d6. Si à la fin de votre tour la bille n''a pas encore explosé, les dégâts augmentent de 1d6.

Si la bille luisante est touchée avant la fin du sort, la créature qui la touche doit effectuer un jet de sauvegarde de Dextérité. En cas d''échec, le sort prend fin, déclenchant l''éruption de la bille en flammes. En cas de réussite, la créature peut lancer la bille jusqu''à 12 mètres. Lorsqu''elle atteint une créature ou un objet solide, le sort prend fin et la bille explose.

Le feu endommage les objets dans la zone et enflamme les objets inflammables qui ne sont pas portés ou transportés.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 8 ou supérieur, les dégâts de base augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 7.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":6}', '[{"damage_type":"fire","damage_at_slot_level":{"7":"12d6","8":"13d6","9":"14d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Boule de feu à retardement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Boule de feu à retardement' AND s.ruleset = '5';

-- Dissimulation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Dissimulation', 7, '1 action', 1.5, '["V","S","M"]', 'une poudre composée de poussières de diamant, d''émeraude, de rubis, et de saphir d''une valeur d''au moins 5 000 po, que le sort consomme', '{"amount":5000,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Grâce à ce sort, une créature consentante ou un objet peut être caché, et ainsi protégé contre la détection pour toute la durée du sort. Lorsque vous lancez ce sort et touchez la cible, elle devient invisible et ne peut pas être ciblée par les sorts de divination ou détectée grâce à des capteurs créés par des sorts de divination.

Si la cible est une créature, elle sombre dans un état d''animation suspendue. Pour elle, le temps cesse de s''écouler, et elle ne vieillit pas.

Vous pouvez placer une condition pour que le sort prenne fin prématurément. Vous pouvez choisir ce que vous souhaitez comme condition, mais elle doit survenir ou être visible à 1,5 km ou moins de la cible. La condition pourrait être, par exemple, « Après 1 000 ans » ou « Lorsque la tarasque s''éveille ». Ce sort prend également fin si la cible subit des dégâts.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Dissimulation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Dissimulation' AND s.ruleset = '5';

-- Épée de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Épée de Mordenkainen', 7, '1 action', 18, '["V","S","M"]', 'une épée miniature en platine avec un manche et un pommeau en cuivre et en zinc, valant au moins 250 po', '{"amount":250,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez un plan de force en forme d''épée qui flotte dans l''air, dans la portée et pour la durée du sort.

Lorsque l''épée fait son apparition, vous effectuez une attaque au corps à corps avec un sort contre une cible de votre choix à 1,50 mètre ou moins de l''épée. Si elle touche, la cible reçoit 3d10 dégâts de force. Jusqu''à la fin du sort, vous pouvez utiliser une action bonus à chacun de vos tours pour déplacer l''épée jusqu''à 6 mètres vers un endroit que vous voyez et répéter cette attaque contre la même cible ou une autre.', 5, NULL, 'melee', NULL, '[{"damage_type":"force","damage_at_slot_level":{"7":"3d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Épée de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Épée de Mordenkainen' AND s.ruleset = '5';

-- Inversion de la gravité
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Inversion de la gravité', 7, '1 action', 30, '["V","S","M"]', 'de la magnétite et quelques copeaux de fer', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Ce sort renverse la gravité dans un cylindre de 15 mètres de rayon et 30 mètres de haut centré sur un point à portée. Toutes les créatures et tous les objets dans la zone, qui ne sont pas maintenus au sol d''une manière ou d''une autre, tombent vers le haut et atteignent le point culminant de la zone au moment où vous lancez le sort. Une créature peut effectuer un jet de sauvegarde de Dextérité pour attraper un objet fixé au sol qu''elle peut atteindre, et ainsi éviter de tomber.

Si les créatures et objets rencontrent dans leur chute des objets solides (comme un plafond), ils le percutent comme ils l''auraient fait s''ils tombaient normalement du haut vers le bas. Si un objet ou une créature atteint le sommet de la zone d''effet sans rien percuter, il y reste, oscillant lentement, pour toute la durée du sort.

Lorsque le sort prend fin, les objets et créatures affectées tombent au sol.', 8, '{"ability":"dex"}', NULL, '{"shape":"cylinder","size":15,"height":30}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Inversion de la gravité' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Inversion de la gravité' AND s.ruleset = '5';

-- Invocation de céleste
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation de céleste', 7, '1 minute', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez un céleste de FP 4 ou inférieur, qui apparaît dans un espace inoccupé que vous pouvez voir et à portée. Le céleste disparaît lorsqu''il tombe à 0 point de vie ou lorsque le sort prend fin.

Le céleste a une attitude amicale envers vous et vos compagnons pour la durée du sort. Lancez l''initiative pour le céleste ; il a ses propres tours de jeu. Il obéit aux ordres verbaux que vous lui donnez (aucune action requise), tant qu''elles ne sont pas en contradiction avec son alignement. Si vous ne lui donnez aucun ordre, le céleste ne fait que se défendre contre les créatures qui lui sont hostiles. Le MD possède les statistiques du céleste.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 9, vous invoquez un céleste de FP 5 ou inférieur.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation de céleste' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Invocation de céleste' AND s.ruleset = '5';

-- Manoir somptueux de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Manoir somptueux de Mordenkainen', 7, '1 minute', 90, '["V","S","M"]', 'un portail miniature sculpté dans l''ivoire, un petit morceau de marbre poli, et une petite cuillère en argent, chacun valant au moins 5 po', '{"amount":5,"unit":"po"}', 0, '24 heures', 'hour', 24, 0, 'Vous invoquez une résidence extradimensionnelle à portée et qui reste en place pour la durée du sort. Vous choisissez où son entrée est située. L''entrée, qui miroite faiblement, est large de 1,50 mètre et haute de 3 mètres. Vous, et toute créature que vous désignez lorsque vous lancez le sort, pouvez entrer dans la résidence extradimensionnelle aussi longtemps que l''entrée reste ouverte. Vous pouvez ouvrir ou fermer le portail si vous vous trouvez à 9 mètres ou moins de lui. Tant qu''il est fermé, le portail est invisible.

De l''autre côté du portail se trouve un magnifique hall donnant sur de nombreuses salles. L''atmosphère est pure, agréable et chaleureuse.

Vous pouvez créer autant d''étage que vous le souhaitez, mais l''espace total ne peut pas dépasser 50 cubes, chaque cube mesurant 3 mètres d''arête. Vous choisissez l''ameublement et la décoration du lieu. Il contient suffisamment de nourriture pour servir un banquet-à-neuf-plats pour 100 personnes. Un personnel de 100 serviteurs quasi-transparents est au service de quiconque pénètre dans le manoir. Vous décidez de l''apparence visuelle de ces serviteurs et de leur livrée. Ils obéissent complètement à vos ordres. Chaque serviteur peut réaliser n''importe quelle tâche qu''un serviteur humain pourrait faire, mais ils ne peuvent pas attaquer ou entreprendre une action qui nuirait directement à une autre créature. Ainsi les serviteurs peuvent apporter des choses, nettoyer, réparer, plier le linge, allumer des feux, servir la nourriture, verser le vin, etc. Les serviteurs peuvent se déplacer de partout dans la demeure mais ne peuvent pas la quitter. Les meubles, et tout autre objet créé par ce sort, se dissipent dans un nuage de fumée dès l''instant où ils quittent le manoir. Lorsque le sort prend fin, toute créature ou objet laissé se trouvant à l''intérieur de l''espace extradimensionnel est expulsée à l''endroit dégagé le plus proche de l''entrée.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Manoir somptueux de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Manoir somptueux de Mordenkainen' AND s.ruleset = '5';

-- Mirage
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mirage', 7, '10 minutes', 100000, '["V","S"]', NULL, NULL, 0, '10 jours', 'day', 10, 0, 'Vous faites en sorte que le terrain, dans une zone carrée de 1,5 km de côté, ressemble à un autre type de terrain, que ce soit du point de vue de l''ouïe, de l''odorat, du toucher, et bien sûr de la vue. Toutefois, la forme générale du terrain reste la même. Une vaste plaine ou une route peuvent ressembler à un marais, une colline, une crevasse, ou tout autre terrain difficile ou infranchissable. Un étang peut ressembler à un pré verdoyant, un précipice à une pente douce, ou un ravin rocailleux à une large route plane.

Vous pouvez également modifier l''apparence des structures, ou en ajouter là où il n''en existe pas. Le sort ne peut pas déguiser, cacher, ou ajouter des créatures.

L''illusion inclut des éléments visuels, auditifs, tactiles et olfactifs, il peut donc convertir un terrain dégagé en terrain difficile (et vice versa), voire entraver les déplacements dans la zone. Lorsqu''une portion de l''illusion (comme une pierre ou une branche) est déplacée en dehors de la zone d''effet du sort, elle disparaît immédiatement.

Les créatures possédant la vision véritable peuvent voir la véritable forme du terrain au travers de l''illusion : cependant, tous les autres éléments de l''illusion restent en place, ainsi même si la créature est avertie de la présence de l''illusion, elle peut continuer à interagir physiquement avec l''illusion.', 6, NULL, NULL, '{"shape":"square","size":1500}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mirage' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mirage' AND s.ruleset = '5';

-- Parole divine
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Parole divine', 7, '1 action bonus', 9, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous prononcez une parole divine, emplie de la puissance qui a façonné le monde à l''aube de la création. Choisissez autant de créatures que vous le souhaitez parmi celles que vous voyez, dans la portée du sort. Chaque créature qui vous entend doit réussir un jet de sauvegarde de Charisme ou subir un effet selon la valeur actuelle de ses points de vie.

- 50 pv ou moins : assourdie pendant 1 minute
- 40 pv ou moins : assourdie et aveuglée pendant 10 minutes
- 30 pv ou moins : aveuglée, assourdie et étourdie pendant 1 heure
- 20 pv ou moins : tuée sur le coup

Indépendamment de ses points de vie actuels, un céleste, un élémentaire, une fée ou un fiélon qui échoue son jet est retourné à son plan d''origine (s''il n''y est pas déjà) et il ne peut revenir sur votre plan pendant 24 heures, peu importe le moyen, à l''exception du sort *souhait*.', 5, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Parole divine' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Parole divine' AND s.ruleset = '5';

-- Projection d'image
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Projection d''image', 7, '1 action', 750000, '["V","S","M"]', 'une petite réplique de vous faite à partir de matériaux valant au moins 5 po', '{"amount":5,"unit":"po"}', 0, 'Concentration, jusqu''à 1 jour', 'day', 1, 1, 'Vous créez une copie illusoire de vous-même qui reste en place pour toute la durée du sort. La copie peut apparaître en n''importe quel lieu à portée que vous avez déjà vu, quels que soient les obstacles qui vous séparent. L''illusion vous ressemble et émet les mêmes sons que vous, mais elle est intangible. Si l''illusion subit des dégâts, elle disparaît, et le sort prend fin.

Vous pouvez utiliser votre action pour déplacer l''illusion d''une vitesse égale au double de la vôtre, pour la faire bouger, parler, et se comporter de la manière que vous souhaitez. L''illusion mime vos mimiques et vos manières à la perfection.

Vous pouvez voir à travers ses yeux et entendre via ses oreilles comme si vous y étiez. Pendant votre tour, par une action bonus, vous pouvez alterner entre vos sens à vous et ceux de votre illusion. Tant que vous utilisez vos sens, votre propre corps est aveuglé et assourdi vis-à-vis de ce qui l''entoure.

Les interactions physiques avec l''image révèlent qu''il s''agit d''une illusion, car les choses passent au travers. Une créature qui utilise son action pour examiner l''image peut déterminer qu''il s''agit d''une illusion en réussissant un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort. Si une créature découvre le caractère illusoire de l''image, cette créature peut voir au travers de l''image, et tout son produit par l''illusion lui semble faux et sonne creux.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Projection d''image' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Projection d''image' AND s.ruleset = '5';

-- Rayons prismatiques
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Rayons prismatiques', 7, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Huit rayons de lumière multicolore émanent de votre main. Chaque rayon est d''une couleur différente et a un pouvoir et un usage différent. Chaque créature se trouvant dans un cône de 18 mètres doit effectuer un jet de sauvegarde de Dextérité. Pour chaque cible, lancez 1d8 pour déterminer la couleur du rayon qui l''affecte.

**1. Rouge**. La cible subit 10d6 dégâts de feu en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite.

**2. Orange**. La cible subit 10d6 dégâts d''acide en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite.

**3. Jaune**. La cible subit 10d6 dégâts de foudre en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite.

**4. Vert**. La cible subit 10d6 dégâts de poison en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite.

**5. Bleu**. La cible subit 10d6 dégâts de froid en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite.

**6. Indigo**. En cas d''échec au jet de sauvegarde, la cible est entravée. Elle doit alors effectuer un jet de sauvegarde de Constitution à la fin de chacun de ses tours. Si elle réussit trois fois son jet de sauvegarde, le sort prend fin. Si elle échoue trois fois son jet de sauvegarde, elle est changée en pierre de manière permanente et soumise à l''état pétrifié. Les succès ou échecs n''ont pas besoin d''être consécutifs ; gardez une trace de vos échecs et de vos réussites à chaque tour jusqu''à ce que vous en ayez 3 dans une catégorie.

**7. Violet**. En cas d''échec, la cible est aveuglée. Elle doit alors effectuer un jet de sauvegarde de Sagesse au début de votre prochain tour. Si ce nouveau jet de sauvegarde est réussi, l''aveuglement prend fin. Si elle échoue ce nouveau jet de sauvegarde, la créature est transportée dans un autre plan d''existence que le MD choisit et n''est plus aveuglée (typiquement, une créature qui ne se situe pas sur son plan d''origine y est renvoyée, tandis que les autres créatures sont généralement transportées dans le plan Astral ou le plan éthéré).

**8. Spécial**. La cible est frappée par deux rayons. Relancez deux fois le dé et rejouez tous les 8.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cone","size":18}', '[{"damage_type":"fire","label":"Rayon 1, rouge","damage_at_slot_level":{"7":"10d6"}},{"damage_type":"acid","label":"Rayon 2, orange","damage_at_slot_level":{"7":"10d6"}},{"damage_type":"lightning","label":"Rayon 3, jaune","damage_at_slot_level":{"7":"10d6"}},{"damage_type":"poison","label":"Rayon 4, vert","damage_at_slot_level":{"7":"10d6"}},{"damage_type":"cold","label":"Rayon 5, bleu","damage_at_slot_level":{"7":"10d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayons prismatiques' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Rayons prismatiques' AND s.ruleset = '5';

-- Régénération
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Régénération', 7, '1 minute', 1.5, '["V","S","M"]', 'un moulin à prières et de l''eau bénite', NULL, 0, '1 heure', 'hour', 1, 0, 'Vous touchez une créature afin de stimuler sa capacité à guérir naturellement. La cible récupère 4d8 + 15 points de vie. Pour la durée du sort, la cible recouvre 1 point de vie au début de chacun de ses tours (10 points de vie par minute).

Les membres de la cible qui sont sectionnés (doigts, jambes, queues, etc.) repoussent après 2 minutes, le cas échéant. Si vous tenez le membre en question et que vous l''approchez du moignon, le sort permet de rattacher instantanément le membre au moignon.', 8, NULL, NULL, NULL, NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"7":"4d8 + 15"}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Régénération' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Régénération' AND s.ruleset = '5';

-- Résurrection
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Résurrection', 7, '1 heure', 1.5, '["V","S","M"]', 'un diamant valant au moins 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez une créature qui est morte depuis moins d''un siècle, qui n''est pas décédée de vieillesse et qui n''est pas un mort-vivant. Si son âme est libre et consentante, la cible revient à la vie avec tous ses points de vie.

Ce sort neutralise les poisons et guérit les maladies normales affligeant la créature au moment de sa mort. Cependant, il n''enraye pas les maladies magiques, les malédictions et autres affections du genre. Si de tels effets ne sont pas enrayés avant l''incantation du sort, ils affligent toujours la cible à son retour à la vie.

Ce sort referme les blessures mortelles et réhabilite les parties du corps qui ont été amputées.

Revenir du monde des morts est une épreuve. La cible subit une pénalité de -4 sur tous ses jets d''attaque, de sauvegarde et de caractéristique. À chaque fois que la cible termine un repos long, la pénalité est réduite de 1 jusqu''à ce qu''elle soit nulle.

Incanter ce sort pour redonner vie à une créature morte depuis plus d''une année vous handicape fortement. Jusqu''à ce que vous terminiez un repos long, vous ne pouvez pas incanter de sort et vous avez un désavantage à tous les jets d''attaque, de sauvegarde et de caractéristique.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Résurrection' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc') AND c.ruleset = '5'
WHERE s.name = 'Résurrection' AND s.ruleset = '5';

-- Simulacre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Simulacre', 7, '12 heures', 1.5, '["V","S","M"]', 'de la neige ou de la glace en quantité suffisante pour créer un double moitié moins grand de la créature à dupliquer ; quelques cheveux, des bouts d''ongles, ou tout autre fragment du corps de la créature placé dans la neige ou la glace ; et de la poudre de rubis valant au moins 1 500 po, répandue sur le double, et que le sort consomme', '{"amount":1500,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous créez un clone illusoire d''une bête ou d''un humanoïde se trouvant à portée pendant toute la durée de l''incantation du sort. Le clone est une créature partiellement réelle, formée de glace et de neige, qui peut agir et être affectée comme une créature normale. La copie semble être identique à l''originale, mais elle ne possède que la moitié du maximum de points de vie de la créature et est créée sans aucun équipement. Sinon, la créature utilise toutes les statistiques de la créature dupliquée, mis à part que c''est un artificiel.

Le simulacre a une attitude amicale avec vous et toute créature que vous désignez. Il obéit à vos ordres verbaux, se déplace et agit selon vos souhaits et agit pendant votre tour au cours des combats. Le simulacre n''a pas la capacité d''apprendre ou de devenir plus puissant, il ne monte donc jamais de niveau, n''améliore pas ses capacités, ni ne peut récupérer un emplacement de sort dépensé.

Si le simulacre subit des dégâts, vous pouvez le réparer dans un laboratoire d''alchimie, en utilisant des herbes et des minerais rares valant au moins 100 po par point de vie récupéré. Le simulacre persiste jusqu''à ce qu''il tombe à 0 point de vie, à ce moment-là il reprend sa forme de neige et fond instantanément.

Si vous lancez ce sort de nouveau, tout clone actuellement actif que vous avez créé grâce à ce sort est instantanément détruit.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Simulacre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Simulacre' AND s.ruleset = '5';

-- Symbole
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Symbole', 7, '1 minute', 1.5, '["V","S","M"]', 'du mercure, du phosphore, et de la poudre de diamant et d''opale pour une valeur totale minimum de 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation ou déclenchement', 'until_dispelled', NULL, 0, 'Lorsque vous lancez ce sort, vous inscrivez un dangereux glyphe soit sur une surface (comme une table ou une portion de plancher ou de mur) ou à l''intérieur d''un objet qui peut être fermé pour dissimuler le glyphe (comme un livre, un rouleau de parchemin ou un coffre). Si vous optez pour la surface, le glyphe peut couvrir une superficie de 3 mètres de diamètre maximum. Si vous choisissez un objet, cet objet doit rester en place ; si l''objet est déplacé à plus de 3 mètres de l''endroit où le sort a été lancé, le glyphe est brisé, et le sort prend fin sans s''être déclenché.

Le glyphe est pratiquement invisible et un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort est requis pour le découvrir.

Vous déterminez le déclencheur du glyphe lors de l''incantation du sort. Pour les glyphes inscrits sur une surface, les déclencheurs sont typiquement le toucher ou se tenir sur un glyphe, retirer un objet posé sur le glyphe, s''approcher à une certaine distance du glyphe ou manipuler l''objet gardé par le glyphe. Pour les glyphes inscrits dans un objet, les déclencheurs les plus fréquents sont : ouvrir l''objet, s''approcher à une certaine distance de l''objet, apercevoir ou lire le glyphe.

Vous pouvez affiner les conditions de déclenchement de sorte que le sort ne s''active que dans certaines circonstances ou en fonction des attributs physiques de la créature (comme sa taille ou son poids), son type morphologique (par exemple, le glyphe pourrait n''affecter que les guenaudes ou les métamorphes). Vous pouvez aussi spécifier que certaines créatures ne déclenchent pas le glyphe, en utilisant un mot de passe, par exemple.

Lorsque vous inscrivez le glyphe, choisissez l''un des options suivantes pour déterminer son effet. Une fois déclenché, le glyphe rougeoie, emplissant une sphère de 18 mètres de rayon de lumière faible pendant 10 minutes, après quoi le sort prend fin. Chaque créature présente dans la sphère lorsque le glyphe est activé est ciblée par son effet, tout comme les créatures qui pénètrent dans la sphère pour la première fois de leur tour ou celles qui y finissent leur tour.

**Mort**. Chaque créature doit effectuer un jet de sauvegarde de Constitution, subissant 10d10 dégâts nécrotiques en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Discorde**. Chaque cible doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, une cible se chamaille et se dispute avec les autres créatures pendant 1 minute. Pendant cette période, elle est incapable de communiquer de manière claire et distincte et a un désavantage à ses jets d''attaque et à ses jets de caractéristique.

**Peur**. Chaque cible doit réussir un jet de sauvegarde de Sagesse sous peine d''être effrayée pendant 1 minute. Tant qu''elle est effrayée, la cible lâche tout ce qu''elle tient et doit s''éloigner du glyphe d''au moins 9 mètres à chaque tour, si elle le peut.

**Désespoir**. Chaque cible doit effectuer un jet de sauvegarde de Charisme. En cas d''échec, la cible est accablée de désespoir pendant 1 minute. Pendant cette période, elle ne peut ni attaquer, ni cibler de créature avec des capacités, sorts, ou effets magiques néfastes.

**Démence**. Chaque cible doit effectuer un jet de sauvegarde d''Intelligence. En cas d''échec, la cible est en proie à la folie pendant 1 minute. Une créature démente ne peut pas utiliser d''action, ne peut ni comprendre ce que les autres créatures disent ni lire, et ne plus parler qu''un charabia inintelligible. Le MD contrôle les mouvements de la cible, qui sont imprévisibles.

**Douleur**. Chaque cible doit réussir un jet de sauvegarde de Constitution sous peine d''être incapable d''agir pendant 1 minute à causes des atroces souffrances qui l''assaillent.

**Sommeil**. Chaque cible doit réussir un jet de sauvegarde de Sagesse sous peine de sombrer dans l''inconscience pendant 10 minutes. Une créature est réveillée si elle subit des dégâts ou si quelqu''un utilise son action pour la réveiller en la secouant ou la giflant.

**Étourdissement**. Chaque cible doit réussir un jet de sauvegarde de Sagesse sous peine d''être étourdie pendant 1 minute.', 1, NULL, NULL, '{"shape":"sphere","size":18}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Symbole' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Symbole' AND s.ruleset = '5';

-- Téléportation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Téléportation', 7, '1 action', 3, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Ce sort vous transporte instantanément vous et jusqu''à huit créatures consentantes de votre choix, ou un seul objet, à condition dans les deux cas que vous puissiez les voir dans la limite de la portée du sort, vers une destination que vous déterminez. Si vous ciblez un objet, il doit être possible de l''insérer entièrement à l''intérieur d''un cube de 3 mètres d''arête et il ne peut être tenu ou porté par une créature non-consentante.

La destination que vous choisissez doit vous être connue et doit être sur le même plan d''existence que vous. Votre connaissance de la destination détermine si vous y arrivez avec succès. Le MD lance un d100 et consulte la table.

| Familiarité | Incident | Zone similaire | Hors cible | Sur la cible |
| --- | --- | --- | --- | --- |
| Cercle permanent | — | — | — | 01-100 |
| Objet associé | — | — | — | 01-100 |
| Très familier | 01-05 | 06-13 | 14-24 | 25-100 |
| Vu par hasard | 01-33 | 34-43 | 44-53 | 54-100 |
| Vu une seule fois | 01-43 | 44-53 | 54-73 | 74-100 |
| Description | 01-43 | 44-53 | 54-73 | 74-100 |
| Fausse destination | 01-50 | 51-100 | — | — |

**Familiarité**. « Cercle permanent » désigne un cercle permanent de téléportation dont vous connaissez la séquence des symboles.

« Objet associé » signifie que vous possédez un objet pris de la destination souhaitée et cela à l''intérieur d''une période correspondant aux six derniers mois, comme un livre de la bibliothèque d''un magicien, le drap d''un lit d''une suite royale ou un morceau de marbre du tombeau secret d''une liche.

« Très familier » est un endroit où vous avez été très souvent, que vous avez déjà soigneusement étudié ou un endroit que vous pouvez voir lorsque vous lancez le sort.

« Vu par hasard » est un endroit que vous avez vu plus d''une fois, mais duquel vous n''êtes pas très familier.

« Vu une seule fois » est un endroit que vous n''avez vu qu''une fois, possiblement en utilisant la magie.

« Description » est un lieu dont vous ignorez l''emplacement et l''apparence, mais qui correspond à la description de quelqu''un d''autre ou, peut-être, simplement déterminé approximativement à partir d''une carte.

« Fausse destination » est un lieu qui n''existe pas. Peut-être avez-vous essayé de scruter le sanctuaire d''un ennemi, mais votre vision s''est butée à une illusion ou vous avez essayé de vous téléporter à un endroit familier dont l''emplacement n''existe plus.

**Sur la cible**. Vous et votre groupe (ou l''objet ciblé) apparaissez où vous voulez.

**Hors cible**. Vous et votre groupe (ou l''objet ciblé) apparaissez à une distance aléatoire loin de la destination et dans une direction aléatoire. La distance hors cible est 1d10 × 1d10 % de la distance qui devait être parcourue initialement. Par exemple, si vous avez essayé de parcourir 180 km, mais avez atterri hors cible et obtenu un 5 et un 3 sur les deux d10, alors vous seriez hors cible de 15 %, soit à 27 km de là. Le MD détermine la direction de la cible au hasard en lançant un d8 et désignant 1 comme le nord, 2 comme le nord-est, 3 comme l''est, et ainsi de suite autour des points cardinaux. Si vous étiez supposé être téléporté dans une ville côtière, mais que votre destination dérive finalement de plus de 27 km en pleine mer, vous pourriez être alors en difficulté.

**Zone similaire**. Vous et votre groupe (ou l''objet ciblé) vous retrouvez dans une autre zone qui est visuellement ou thématiquement similaire à la zone ciblée. Si vous ciblez la position de votre laboratoire personnel, par exemple, vous pourriez vous retrouver dans le laboratoire d''un autre magicien ou dans une autre échoppe de fournitures magiques ayant sensiblement les mêmes outils et instruments que votre laboratoire. En règle générale, vous apparaissez dans le lieu similaire le plus proche, mais puisque le sort n''a pas vraiment de limite de portée pour la destination, vous pourriez également vous retrouver n''importe où dans le plan d''existence.

**Incident**. Les effets magiques imprévisibles du sort résultent en un voyage périlleux. Chaque créature téléportée (ou l''objet ciblé) subit 3d10 dégâts de force et le MD relance sur la table pour voir où vous vous retrouvez à présent (plusieurs incidents peuvent alors se produire de suite, infligeant des dégâts à chaque fois).', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Téléportation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Téléportation' AND s.ruleset = '5';

-- Tempête de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tempête de feu', 7, '1 action', 45, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une tempête formée de rideaux enflammés apparait à l''endroit de votre choix, dans la portée du sort. La zone de la tempête se compose de dix cubes de 3 mètres d''arête, que vous pouvez organiser à votre guise. Chaque cube doit avoir une face adjacente à la face d''un autre cube. Chaque créature dans la zone doit effectuer un jet de sauvegarde de Dextérité, subissant 7d10 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Le feu endommage les objets dans la zone et allume les objets inflammables qui ne sont pas portés ou transportés. Si vous le souhaitez, les végétaux dans la zone ne sont pas touchés par le sort.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"7":"7d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tempête de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Tempête de feu' AND s.ruleset = '5';

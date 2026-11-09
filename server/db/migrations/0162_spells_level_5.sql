-- Sorts de niveau 5 du socle (#176 D1) : les 39 sorts PHB / SRD que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_5.ts, gardé par test/nuxt/spellsLevel5Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Animation d'objets
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Animation d''objets', 5, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Les objets prennent vie à votre demande. Choisissez jusqu''à dix objets non magiques dans la portée du sort qui ne sont pas portés ou transportés. Les cibles de taille M comptent pour deux objets, celles de taille G comptent pour quatre et les objets de taille TG comptent pour huit. Vous ne pouvez pas animer un objet plus grand que la taille TG. Chaque cible anime et devient une créature sous votre contrôle jusqu''à la fin du sort ou jusqu''à ce qu''elle soit réduite à 0 point de vie.

Par une action bonus, vous pouvez commander mentalement les créatures que vous avez animées avec ce sort si elles sont à 150 mètres ou moins de vous. Si vous contrôlez plusieurs créatures, vous commandez simultanément autant de créatures que vous le souhaitez en donnant le même ordre à chacune d''elles. Vous décidez de l''action que prend la créature et du mouvement qu''elle fait. Vous pouvez aussi émettre une consigne générale, comme monter la garde devant une pièce ou dans un couloir. Si vous ne donnez aucun ordre, la créature ne fait que se défendre contre les créatures qui lui sont hostiles. Une fois qu''un ordre est donné, la créature s''exécute jusqu''à ce que la tâche soit complétée.

| Taille | PV | CA | Attaque | For | Dex |
| --- | --- | --- | --- | --- | --- |
| TP | 20 | 18 | +8 au toucher, dégâts 1d4 + 4 | 4 | 18 |
| P | 25 | 16 | +6 au toucher, dégâts 1d8 + 2 | 6 | 14 |
| M | 40 | 13 | +5 au toucher, dégâts 2d6 + 1 | 10 | 12 |
| G | 50 | 10 | +6 au toucher, dégâts 2d10 + 2 | 14 | 10 |
| TG | 80 | 10 | +8 au toucher, dégâts 2d12 + 4 | 18 | 6 |

Un objet animé est un artificiel avec une CA, des points de vie, des attaques, une Force et une Dextérité déterminés par sa taille. Il possède 10 en Constitution, 3 en Intelligence et en Sagesse, et 1 en Charisme. Sa vitesse est de 9 mètres, ou bien si l''objet est dépourvu de jambes ou d''autres appendices équivalents pouvant servir à son déplacement il possède alors une vitesse de vol de 9 mètres qui lui permet aussi de faire du sur-place. Si l''objet est solidement attaché à une surface ou à un objet plus gros, telle une chaîne ancrée dans un mur, sa vitesse est de 0. L''objet est doté de la vision aveugle sur un rayon de 9 mètres et il est aveuglé au-delà de cette distance. Lorsque l''objet animé est réduit à 0 point de vie, il reprend sa forme originale et l''excédent de dégâts est infligé à l''objet inanimé.

Si vous ordonnez à un objet d''attaquer, il peut faire une simple attaque au corps à corps contre une créature à 1,50 mètre ou moins de celui-ci. Il fait une attaque de coup avec un bonus d''attaque et des dégâts contondants déterminés par sa taille. Le MD peut décréter qu''un objet spécifique peut infliger des dégâts tranchants ou perforants, selon la forme dudit objet.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, vous pouvez animer deux objets supplémentaires pour chaque niveau d''emplacement au-delà du niveau 5.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Animation d''objets' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Animation d''objets' AND s.ruleset = '5';

-- Apparence trompeuse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Apparence trompeuse', 5, '1 action', 9, '["V","S"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Ce sort vous permet de changer l''apparence des créatures que vous pouvez voir dans la portée du sort. Vous donnez à chaque créature choisie une nouvelle apparence illusoire. Une cible réticente doit réussir un jet de sauvegarde de Charisme pour ne pas être affectée par le sort.

Le sort déguise l''apparence physique autant que les vêtements, l''armure, les armes et l''équipement. Vous pouvez faire paraître chaque créature 30 cm plus grande ou plus petite, mince, obèse, ou entre les deux. Vous ne pouvez pas modifier leur type morphologique. Vous devez donc choisir une forme qui présente un arrangement similaire des membres. Par ailleurs, l''ampleur de l''illusion ne tient qu''à vous. L''effet persiste pour la durée du sort, sauf si vous utilisez une action pour y mettre fin.

Les modifications apportées par ce sort ne résistent pas à une inspection physique. Par exemple, si vous utilisez ce sort pour ajouter un chapeau à votre accoutrement, les objets passeront à travers le chapeau et si on y touche, on ne sentira pas sa présence ou on tâtera plutôt votre tête et votre chevelure. Si vous utilisez ce sort pour paraître plus mince, la main d''une personne qui veut vous toucher entrera en contact avec votre corps alors que sa main semble libre d''obstruction.

Une créature peut utiliser son action pour inspecter une cible et elle doit réussir un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort. Si elle réussit, la créature comprend que la cible est déguisée.', 6, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Apparence trompeuse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Apparence trompeuse' AND s.ruleset = '5';

-- Brume mortelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Brume mortelle', 5, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez une sphère de 6 mètres de rayon remplie d''un brouillard toxique verdâtre, centré sur un point dans la portée du sort. Le brouillard contourne les coins. Il persiste pour la durée du sort ou jusqu''à ce qu''un vent fort le disperse, mettant ainsi fin au sort. La visibilité de la zone est nulle.

Lorsqu''une créature pénètre dans la zone du sort pour la première fois ou lorsqu''elle y débute son tour, cette créature doit effectuer un jet de sauvegarde de Constitution, subissant 5d8 dégâts de poison en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Les créatures sont affectées même si elles retiennent leur souffle ou si elles n''ont pas besoin de respirer.

Le brouillard s''éloigne de vous au début de votre tour, au rythme de 3 mètres par tour. Il roule sur la surface du sol. La vapeur toxique étant plus lourde que l''air, elle descend dans les creux du relief et elle s''infiltre dans les ouvertures.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 5.', 2, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":6}', '[{"damage_type":"poison","damage_at_slot_level":{"5":"5d8","6":"6d8","7":"7d8","8":"8d8","9":"9d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Brume mortelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Brume mortelle' AND s.ruleset = '5';

-- Carquois magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Carquois magique', 5, '1 action bonus', 1.5, '["V","S","M"]', 'un carquois contenant au moins une munition', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous transmutez votre carquois pour qu''il produise constamment des munitions non magiques qui semblent voler jusqu''à votre main lorsque vous en avez besoin.

À chacun de vos tours avant que le sort ne prenne fin, vous pouvez utiliser votre action bonus pour effectuer deux attaques avec une arme qui utilise les munitions de ce carquois. Chaque fois que vous effectuez une attaque à distance, votre carquois remplace magiquement la munition que vous venez d''utiliser par une nouvelle munition similaire non magique. Chaque munition créée par ce sort est détruite lorsque le sort prend fin. Si le carquois n''est plus en votre possession, le sort prend fin.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Carquois magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Carquois magique' AND s.ruleset = '5';

-- Cercle de pouvoir
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Cercle de pouvoir', 5, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous irradiez de l''énergie divine, distordant et diffusant de l''énergie magique à 9 mètres autour de vous. Jusqu''à la fin du sort, la sphère se déplace en même temps que vous de sorte que vous en restez l''épicentre. Pour la durée du sort, toute créature amicale dans la zone (vous y compris) a un avantage à ses jets de sauvegarde effectués contre des sorts et tout autre effet magique.

De plus, lorsque les créatures affectées réussissent un jet de sauvegarde effectué contre un sort ou un effet magique qui leur permet de réduire de moitié les dégâts subis en cas de réussite au jet de sauvegarde, elles ne prennent aucun dégât de la part de ce sort ou effet magique.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cercle de pouvoir' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Cercle de pouvoir' AND s.ruleset = '5';

-- Cercle de téléportation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Cercle de téléportation', 5, '1 minute', 3, '["V","M"]', 'des craies et encres rares imprégnées de pierres précieuses d''une valeur d''au moins 50 po, que le sort consomme', '{"amount":50,"unit":"po","consumed":true}', 0, '1 round', 'round', 1, 0, 'Pendant que vous incantez le sort, vous dessinez sur le sol un cercle de 3 mètres de diamètre constitué de symboles qui lient votre position à un cercle de téléportation permanent de votre choix dont vous connaissez la séquence des symboles et qui se trouve sur le même plan d''existence que vous. Un portail scintillant s''ouvre dans le cercle que vous avez dessiné et reste ouvert jusqu''à la fin de votre prochain tour. Toute créature qui entre dans le portail apparaît instantanément à 1,50 mètre du portail de destination ou dans l''espace inoccupé le plus proche si cet espace est déjà pris.

Nombre de grands temples, guildes et autres endroits importants ont installé des portails de téléportation permanents quelque part dans leur enceinte. Chacun de ces cercles de téléportation permanent a sa propre et unique séquence de symboles ; une chaîne de runes magiques arrangées d''une manière particulière. Lorsque vous gagnez pour la première fois la possibilité de lancer ce sort, vous apprenez les séquences de symboles pour deux destinations du plan matériel, déterminées par le MD. Vous pouvez apprendre de nouvelles séquences au cours de vos aventures. Vous pouvez mémoriser une nouvelle séquence de symboles après l''avoir étudiée pendant 1 minute.

Vous pouvez créer un cercle de téléportation permanent en lançant ce sort au même endroit, tous les jours pendant 1 an. Vous n''êtes pas obligé de traverser le cercle de téléportation lorsque vous lancez ce sort pour créer un cercle de téléportation permanent.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cercle de téléportation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Cercle de téléportation' AND s.ruleset = '5';

-- Châtiment du ban
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment du ban', 5, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature avec une attaque avec une arme avant que ce sort ne prenne fin, votre arme crépite avec force, votre attaque infligeant 5d10 dégâts de force supplémentaires à la cible. De plus, si cette attaque réduit la cible à 50 points de vie ou moins, vous la bannissez. Si la cible est native d''un autre plan d''existence que celui sur lequel vous vous trouvez, la cible disparaît, retournant sur son plan d''origine. Si la cible est native du plan d''existence sur lequel vous êtes, la créature est envoyée sur un demi-plan non-dangereux. Tant qu''elle s''y trouve, la cible est incapable d''agir. Elle y reste jusqu''à ce que le sort prenne fin, puis la cible réapparaît à l''endroit qu''elle avait quitté ou à l''espace inoccupé le plus proche si cet espace est déjà occupé.', 1, NULL, NULL, NULL, '[{"damage_type":"force","damage_at_slot_level":{"5":"5d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment du ban' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment du ban' AND s.ruleset = '5';

-- Colonne de flamme
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Colonne de flamme', 5, '1 action', 18, '["V","S","M"]', 'une pincée de soufre', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une colonne verticale de feu divin dévale des cieux vers un endroit que vous spécifiez dans la portée du sort. Chaque créature située dans un cylindre de 3 mètres de rayon et de 12 mètres de haut centré sur le point spécifié doit effectuer un jet de sauvegarde de Dextérité, subissant 4d6 dégâts de feu et 4d6 dégâts radiants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les dégâts de feu ou les dégâts radiants (selon votre choix) sont augmentés de 1d6 pour chaque niveau d''emplacement au-delà du niveau 5.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":3,"height":12}', '[{"damage_type":"fire","damage_at_slot_level":{"5":"4d6"}},{"damage_type":"radiant","damage_at_slot_level":{"5":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Colonne de flamme' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Colonne de flamme' AND s.ruleset = '5';

-- Communion
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Communion', 5, '1 minute', 0, '["V","S","M"]', 'de l''encens et une fiole d''eau bénite ou maudite', NULL, 1, '1 minute', 'minute', 1, 0, 'Vous entrez en contact avec votre dieu ou un intermédiaire divin et vous posez jusqu''à trois questions qui peuvent être répondues par oui ou par non. Vous devez poser vos questions avant la fin du sort. Vous recevez une réponse correcte à chaque question.

Les entités divines ne sont pas nécessairement omniscientes. Vous pouvez donc recevoir une réponse « incertaine » si la question concerne un sujet qui est hors du domaine de connaissance de la divinité. Dans le cas où une réponse monosyllabique s''avérerait déroutante ou opposée aux intérêts de la divinité, le MD peut faire une courte phrase en guise de réponse.

Si vous incantez le sort plus d''une fois avant la fin de votre prochain repos long, il y a une probabilité cumulative de 25 % de ne recevoir aucune réponse et ce, pour chaque incantation après la première. Le MD fait ce jet en secret.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Communion' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Communion' AND s.ruleset = '5';

-- Communion avec la nature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Communion avec la nature', 5, '1 minute', 0, '["V","S"]', NULL, NULL, 1, 'Instantanée', 'instant', NULL, 0, 'Vous ne faites brièvement qu''un avec la nature et obtenez des informations sur le territoire alentour. À l''extérieur, le sort vous donne la connaissance du terrain à 4,5 km autour de vous. Dans des grottes ou tout autre milieu souterrain, le rayon de connaissance est réduit à 90 mètres. Le sort ne fonctionne pas là où des constructions ont pris la place de la nature, comme dans des donjons ou des villes.

Vous obtenez instantanément la connaissance de trois types d''informations sur la zone, parmi celles proposées ci-dessous :

- Terrain et plans d''eau
- Plantes, minéraux, animaux ou peuples courants
- Puissants célestes, fiélons, fées, élémentaires ou morts-vivants
- Influence des autres plans d''existence
- Bâtiments

Par exemple, vous pourriez déterminer l''emplacement d''un puissant mort-vivant dans la zone, la localisation des principales sources d''eau potables, et situer les villes à proximité.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Communion avec la nature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Communion avec la nature' AND s.ruleset = '5';

-- Cône de froid
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Cône de froid', 5, '1 action', 0, '["V","S","M"]', 'un petit cône de cristal ou de verre', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un souffle d''air froid est propulsé de vos mains. Chaque créature se trouvant dans les 18 mètres du cône doit effectuer un jet de sauvegarde de Constitution. Une créature subit 8d8 dégâts de froid en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Une créature tuée par le sort devient une statue de glace jusqu''à son dégel.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 5.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"cone","size":18}', '[{"damage_type":"cold","damage_at_slot_level":{"5":"8d8","6":"9d8","7":"10d8","8":"11d8","9":"12d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cône de froid' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Cône de froid' AND s.ruleset = '5';

-- Contagion
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contagion', 5, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, '7 jours', 'day', 7, 0, 'Votre toucher est vecteur de maladie. Effectuez une attaque au corps à corps avec un sort contre une créature à portée. Si le coup touche, la cible est empoisonnée.

À la fin de chacun des tours de la cible empoisonnée, celle-ci doit effectuer un jet de sauvegarde de Constitution. Si elle en réussit trois, la cible n''est plus empoisonnée et le sort prend fin. Si elle en échoue trois, la cible n''est plus empoisonnée mais vous choisissez une des maladies indiquées ci-dessous. La cible est alors sujette à cette maladie jusqu''à la fin de la durée du sort.

Étant donné que le sort reproduit une maladie naturelle chez sa cible, tout effet qui peut normalement guérir une maladie, ou au moins en réduire les effets, s''applique.

**Bouille-crâne**. L''esprit de la créature devient fiévreux. La créature a un désavantage aux jets d''Intelligence et aux jets de sauvegarde d''Intelligence. De plus, la créature se comporte comme si elle était sous l''effet d''un sort de *confusion* lorsqu''elle est en combat.

**Convulsions**. La créature est parcourue de tremblements incontrôlés. La créature a un désavantage aux jets de Dextérité, aux jets de sauvegarde de Dextérité et aux jets d''attaque basés sur la Dextérité.

**Fièvre répugnante**. Une violente fièvre se saisit du corps de la créature. La créature a un désavantage aux jets de Force, aux jets de sauvegarde de Force et aux jets d''attaque basés sur la Force.

**Mal aveuglant**. La créature a du mal à réfléchir et ses yeux deviennent blancs laiteux. La créature a un désavantage aux jets de Sagesse et aux jets de sauvegarde de Sagesse. Elle est de plus aveuglée.

**Mort poisseuse**. La créature perd du sang de manière incontrôlable. La créature a un désavantage aux jets de Constitution et aux jets de sauvegarde de Constitution. De plus, chaque fois que la créature subit des dégâts, elle est étourdie jusqu''à la fin de son tour suivant.

**Pourriture**. La chair de la créature se dégrade. La créature a un désavantage aux jets de Charisme et est vulnérable à tous les types de dégâts.', 7, '{"ability":"con"}', 'melee', NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contagion' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Contagion' AND s.ruleset = '5';

-- Contrat
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contrat', 5, '1 heure', 18, '["V","S","M"]', 'un bijou valant au minimum 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, '24 heures', 'hour', 24, 0, 'Avec ce sort, vous tentez de vous attacher les services d''un céleste, d''un élémentaire, d''une fée ou d''un fiélon. La créature doit être à portée pendant toute la durée de l''incantation (typiquement, la créature est tout d''abord invoquée à l''intérieur d''un sort de cercle magique inversé, pour qu''elle ne puisse pas s''échapper, tandis que vous lancez ce sort). À la fin de l''incantation, la cible doit effectuer un jet de sauvegarde de Charisme. En cas d''échec, elle est tenue de vous servir pour toute la durée du sort. Si la créature a été invoquée ou a été créée par un autre sort, la durée du sort est étendue pour correspondre à celle du sort *contrat*.

Une créature liée doit suivre vos instructions au mieux de ses capacités. Vous pouvez ordonner à la créature de vous accompagner lors de vos aventures, de garder un lieu, ou de délivrer un message. La créature obéit à la lettre à vos instructions, mais si la créature vous est hostile, elle interprétera vos ordres afin d''accomplir ses propres objectifs. Si la créature exécute complètement les instructions qu''elle a reçues avant que le sort ne prenne fin, elle voyage jusqu''à vous pour vous en informer si vous vous trouvez tous deux dans le même plan d''existence. Si vous êtes dans des plans d''existence différents, elle retourne à l''endroit où vous l''avez asservie et y reste jusqu''à ce que le sort prenne fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau supérieur, la durée du sort passe à 10 jours avec un emplacement de niveau 6, à 30 jours pour un niveau 7, à 180 jours pour un niveau 8, et elle passe à 1 an et 1 jour en utilisant un emplacement de niveau 9.', 1, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contrat' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Contrat' AND s.ruleset = '5';

-- Coquille antivie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Coquille antivie', 5, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Une barrière scintillante émane de vous dans un rayon de 3 mètres et se déplace avec vous, restant centrée autour de vous et bloquant les créatures autres que celles de type mort-vivant ou artificiel. La barrière reste en place pour toute la durée du sort.

La barrière empêche les créatures affectées de pénétrer ou de traverser la zone. Une créature affectée peut lancer des sorts ou effectuer des attaques avec des armes à distance ou des armes à allonge au travers de la barrière.

Si vous vous déplacez de sorte qu''une créature affectée est obligée de passer au travers de la barrière, le sort prend fin.', 1, NULL, NULL, '{"shape":"emanation","size":3}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Coquille antivie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Coquille antivie' AND s.ruleset = '5';

-- Création
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Création', 5, '1 minute', 9, '["V","S","M"]', 'un petit bout de matériau du même type que celui composant l''objet que vous souhaitez créer', NULL, 0, 'Spéciale', 'special', NULL, 0, 'Vous extirpez de la Gisombre des brumes ténébreuses qui vous serviront de matériau pour créer, à portée, un objet non vivant en matière végétale : du tissu, de la corde, du bois, ou quelque chose de similaire. Vous pouvez également utiliser ce sort pour créer un objet minéral comme de la pierre, du cristal ou du métal. L''objet créé ne doit pas dépasser un cube de 1,50 mètre d''arête, et vous devez déjà avoir vu la forme et les matériaux que vous souhaitez donner à l''objet.

La durée d''effet du sort dépend du matériau de l''objet. Si l''objet comporte plusieurs matériaux, utilisez la durée la plus courte.

| Matériau | Durée |
| --- | --- |
| Matière végétale | 1 jour |
| Pierre ou cristal | 12 heures |
| Métaux précieux | 1 heure |
| Gemmes | 10 minutes |
| Adamantium ou mithral | 1 minute |

Utiliser un matériau créé à l''aide du sort *création* en tant que composante matérielle d''un autre sort fait automatiquement échouer cet autre sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les arêtes du cube augmentent de 1,50 mètre pour chaque niveau d''emplacement au-delà du niveau 5.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Création' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Création' AND s.ruleset = '5';

-- Dissipation du mal et du bien
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Dissipation du mal et du bien', 5, '1 action', 0, '["V","S","M"]', 'de l''eau bénite ou de la poudre de fer et d''argent', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une énergie chatoyante vous enveloppe et vous protège des fées, des morts-vivants et des créatures originaires d''autres plans que le plan matériel. Pour la durée du sort, les célestes, élémentaires, fées, fiélons et morts-vivants ont un désavantage aux jets d''attaque contre vous.

Vous pouvez mettre fin prématurément au sort en utilisant l''une ou l''autre des options suivantes.

**Annulation d''enchantement**. Par une action, vous touchez une créature à portée qui est charmée, effrayée ou possédée par un céleste, un élémentaire, une fée, un fiélon ou un mort-vivant. La créature que vous touchez cesse immédiatement d''être charmée, effrayé ou possédée par de telles créatures.

**Renvoi**. Par une action, effectuez une attaque au corps à corps avec un sort contre un céleste, un élémentaire, une fée, un fiélon ou un mort-vivant à portée. Si votre attaque touche, vous tentez de renvoyer cette créature sur son plan d''origine. La créature doit réussir un jet de sauvegarde de Charisme sous peine d''être envoyée sur son plan natif (si elle ne s''y trouve pas actuellement). S''ils ne sont pas sur leur plan natif, les morts-vivants sont envoyés dans la Gisombre et les fées dans la Féerie.', 1, '{"ability":"cha","success":"none"}', 'melee', NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Dissipation du mal et du bien' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Dissipation du mal et du bien' AND s.ruleset = '5';

-- Domination de personne
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Domination de personne', 5, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez de subjuguer un humanoïde à portée que vous pouvez voir. Celui-ci doit réussir un jet de sauvegarde de Sagesse ou être charmé pour la durée du sort. Si vous ou des créatures qui vous sont amies le combattez, il bénéficie d''un avantage à son jet de sauvegarde.

Tant que la cible est charmée, vous établissez un contact télépathique avec elle aussi longtemps que vous vous trouvez tous les deux sur le même plan d''existence. Vous pouvez utiliser ce lien télépathique pour donner des ordres à la créature, tant que vous êtes conscient (aucune action requise). La créature fait tout ce qui est en son pouvoir pour obéir. Vous pouvez préciser un type d''action à la fois simple et général, comme « Attaque cette créature », « Cours jusque-là » ou « Rapporte cet objet ». Si la créature exécute la demande et ne reçoit pas d''autres indications de votre part, elle se défend au mieux de sa capacité.

Vous pouvez utiliser une action pour obtenir le contrôle total et précis de la cible. Jusqu''à la fin de votre prochain tour, la créature agit seulement selon vos choix et elle ne peut rien faire sans que vous ne l''autorisiez. Pendant cette période, vous pouvez provoquer une réaction de la part de la créature, mais l''usage de cette réaction sera aussi le vôtre.

Chaque fois que la cible subit des dégâts, elle tente un nouveau jet de sauvegarde de Sagesse. Si elle réussit, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6, la durée du sort sous concentration augmente jusqu''à 10 minutes. Avec un emplacement de sort de niveau 7, la durée du sort sous concentration augmente jusqu''à 1 heure. Avec un emplacement de sort de niveau 8 ou supérieur, la durée du sort sous concentration augmente jusqu''à 8 heures.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Domination de personne' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Domination de personne' AND s.ruleset = '5';

-- Double illusoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Double illusoire', 5, '1 action', 0, '["S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous devenez invisible au moment même où un double illusoire apparaît à l''endroit où vous êtes. Le double persiste pour la durée du sort, mais l''invisibilité prend fin si vous attaquez ou si vous incantez un sort.

Vous pouvez utiliser une action pour déplacer votre double illusoire jusqu''à deux fois votre vitesse tout en le faisant gesticuler, parler et agir comme vous l''entendez.

Vous pouvez voir à travers ses yeux et entendre par ses oreilles comme si vous étiez là où il est. À chacun de vos tours, par une action bonus, vous pouvez retrouver vos sens et inversement. Tant que vous utilisez ses sens, vous êtes aveugle et sourd à votre environnement immédiat.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Double illusoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Double illusoire' AND s.ruleset = '5';

-- Éveil
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Éveil', 5, '8 heures', 1.5, '["V","S","M"]', 'une agate d''une valeur d''au moins 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Après avoir passé le temps d''incantation à tracer des symboles magiques sur une pierre précieuse, vous touchez une bête ou une plante de taille TG ou inférieure. La cible doit avoir une valeur d''Intelligence inférieure ou égale à 3, ou bien ne pas avoir de valeur d''Intelligence du tout.

La cible obtient une valeur d''Intelligence égale à 10. La cible gagne également la capacité de parler une langue que vous connaissez. Si la cible est une plante, elle gagne la capacité de mouvoir ses branches, ses racines, ses sarments, ses lianes, et ainsi de suite, et gagne des sens similaires à ceux des humains. Votre MD choisit les caractéristiques appropriées à la plante que vous avez éveillée, comme l''arbre éveillé ou l''arbuste éveillé.

Vous charmez la bête ou la plante éveillée pendant 30 jours ou jusqu''à ce que vous, ou vos compagnons, nuisiez à la cible. Lorsque le charme prend fin, la créature éveillée choisit si elle reste amicale envers vous, en fonction de la manière dont vous l''avez traité lorsqu''elle était charmée.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Éveil' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Éveil' AND s.ruleset = '5';

-- Fléau d'insectes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fléau d''insectes', 5, '1 action', 90, '["V","S","M"]', 'quelques cristaux de sucre, quelques grains de céréale et un peu de graisse', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une nuée de criquets bourdonnants occupent une sphère de 6 mètres de rayon centrée sur un point dans la portée du sort. La sphère s''étend au-delà des coins. La sphère persiste pour la durée du sort et la visibilité dans la zone est réduite. L''espace de la sphère est un terrain difficile.

Lorsque la sphère apparait, chaque créature s''y trouvant doit effectuer un jet de sauvegarde de Constitution, subissant 4d10 dégâts perforants en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Une créature doit aussi effectuer ce jet de sauvegarde lorsqu''elle pénètre dans l''espace du sort pour la première lors d''un tour ou lorsqu''elle y termine son tour.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les dégâts augmentent de 1d10 pour chaque niveau d''emplacement au-delà du niveau 5.', 2, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":6}', '[{"damage_type":"piercing","damage_at_slot_level":{"5":"4d10","6":"5d10","7":"6d10","8":"7d10","9":"8d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fléau d''insectes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Fléau d''insectes' AND s.ruleset = '5';

-- Invocation de volée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation de volée', 5, '1 action', 45, '["V","S","M"]', 'une pièce de munition ou une arme de lancer', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous tirez une munition non magique avec une arme à distance ou lancez une arme non magique dans les airs et choisissez un point à portée. Des centaines de reproductions de cette munition ou de cette arme tombent en une véritable pluie de projectiles puis disparaissent. Chaque créature, présente dans un cylindre haut de 6 mètres et d''un rayon de 12 mètres centré au point que vous avez choisi, doit effectuer un jet de sauvegarde de Dextérité. Une créature subit 8d8 dégâts en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Le type de dégâts infligés est le même que celui de la munition ou de l''arme.', 2, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":12,"height":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation de volée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Invocation de volée' AND s.ruleset = '5';

-- Lien télépathique de Rary
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Lien télépathique de Rary', 5, '1 action', 9, '["V","S","M"]', 'des coquilles d''œufs pondus par des créatures d''espèces différentes', NULL, 1, '1 heure', 'hour', 1, 0, 'Vous tissez un lien télépathique unissant jusqu''à huit créatures consentantes de votre choix et à portée, chacune psychiquement liée aux autres pour toute la durée du sort. Les créatures ayant une valeur d''Intelligence inférieure ou égale à 2 ne peuvent pas être affectées par ce sort.

Jusqu''à ce que le sort prenne fin, les cibles peuvent communiquer télépathiquement via ce lien, qu''elles aient ou non une langue en commun. La communication est possible quelle que soit la distance qui sépare les cibles, mais elle ne fonctionne plus pour des créatures se trouvant sur différents plans d''existence.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lien télépathique de Rary' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Lien télépathique de Rary' AND s.ruleset = '5';

-- Main de Bigby
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Main de Bigby', 5, '1 action', 36, '["V","S","M"]', 'une coquille d''œuf et un gant en peau de serpent', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez une main de force luminescente et translucide de taille G dans un espace inoccupé à portée et que vous pouvez voir. La main reste pour la durée du sort, et elle se déplace selon vos ordres, reproduisant les mouvements de votre propre main.

La main est un objet ayant une CA de 20 et un nombre de points de vie égal à votre maximum de points de vie. Si elle tombe à 0 point de vie, le sort prend fin. Elle a une Force de 26 (+8) et une Dextérité de 10 (+0). La main ne remplit pas l''espace qu''elle occupe.

Lorsque vous lancez ce sort et par une action bonus aux tours qui suivent, vous pouvez déplacer la main jusqu''à 18 mètres puis lui appliquer l''un des effets suivants.

**Poing de Bigby**. La main frappe une créature ou un objet à 1,50 mètre d''elle. Effectuez une attaque au corps à corps avec un sort pour la main en utilisant vos statistiques de jeu. Si l''attaque touche, la cible subit 4d8 dégâts de force.

**Main de force de Bigby**. La main tente de pousser une créature située à 1,50 mètre d''elle, dans une direction de votre choix. Effectuez un jet de Force de la main contre un jet de Force (Athlétisme) de la cible. Si la cible est de taille M ou inférieure, vous avez un avantage au jet. Si vous gagnez l''opposition, la main repousse la cible sur une distance en mètre égale à 1,50 x (1 + le modificateur de votre caractéristique d''incantation). La main se déplace avec la cible pour rester à 1,50 mètre d''elle.

**Main broyeuse de Bigby**. La main tente d''agripper une créature de taille G ou inférieure se trouvant à 1,50 mètre d''elle. Vous utilisez la Force de la main pour résoudre la tentative. Si la cible est de taille M ou inférieure, vous avez un avantage au jet. Tant que la main agrippe la cible, vous pouvez utiliser une action bonus pour que la main la broie. Lorsque vous faites ainsi, la cible subit un nombre de points de dégâts contondants égal à 2d6 + le modificateur de votre caractéristique d''incantation.

**Main d''interposition de Bigby**. La main s''interpose entre vous et une créature de votre choix jusqu''à ce que vous donniez à la main un ordre différent. La main se déplace de sorte à toujours rester entre vous et la cible, vous donnant un abri partiel contre la cible. La cible ne peut pas se déplacer au travers de l''espace occupé par la main si sa valeur de Force est inférieure ou égale à celle de la main. Si la valeur de Force de la cible est supérieure à celle de la main, elle peut se déplacer dans votre direction en traversant l''espace de la main, mais son espace est considéré comme étant un terrain difficile pour la cible.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, les dégâts du Poing de Bigby augmentent de 2d8 et les dégâts de la Main broyeuse de Bigby augmentent de 2d6, et ce pour chaque emplacement de niveau supérieur au 5eme.', 5, NULL, 'melee', NULL, '[{"damage_type":"force","label":"Poing de Bigby","damage_at_slot_level":{"5":"4d8","6":"6d8","7":"8d8","8":"10d8","9":"12d8"}},{"damage_type":"bludgeoning","label":"Main broyeuse de Bigby","isSpellcastingModifierAdded":true,"damage_at_slot_level":{"5":"2d6","6":"4d6","7":"6d6","8":"8d6","9":"10d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Main de Bigby' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Main de Bigby' AND s.ruleset = '5';

-- Modification de mémoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Modification de mémoire', 5, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez de remodeler la mémoire d''une autre créature. Une créature que vous pouvez voir doit effectuer un jet de sauvegarde de Sagesse. Si vous êtes en train de combattre la créature, elle obtient un avantage à son jet de sauvegarde. En cas d''échec, vous charmez la cible pour toute la durée du sort. La cible charmée est incapable d''agir et inconsciente de ce qui se passe autour d''elle, mais elle peut toutefois toujours vous entendre. Si elle subit des dégâts ou est la cible d''un autre sort, ce sort prend fin, et la mémoire de la cible n''est pas modifiée.

Tant qu''elle est charmée, vous pouvez modifier la mémoire de la cible concernant un événement qui s''est passé dans les 24 dernières heures et qui a duré au maximum 10 minutes. Vous pouvez supprimer de manière permanente tout souvenir de cet événement, permettre à la cible de se rappeler très clairement de cet événement ainsi que du moindre détail le concernant, modifier ses souvenirs concernant les détails de l''événement, ou lui implanter des souvenirs d''autres événements.

Vous devez parler à la cible pour lui décrire comme ses souvenirs sont affectés, et elle doit être capable de comprendre votre langage pour que les modifications de mémoire prennent racine. Son esprit comble les lacunes de votre description. Si le sort prend fin avant que vous n''ayez fini de décrire les modifications de mémoire de la cible, ses souvenirs ne sont pas altérés. Sinon, les modifications de mémoire prennent effet lorsque le sort se termine.

Une mémoire modifiée n''affecte pas nécessairement le comportement d''une créature, en particulier si les souvenirs sont en contradiction avec les tendances naturelles de la créature, avec son alignement, ou avec ses convictions. Une mémoire modifiée de manière illogique, comme l''implantation du souvenir de l''incroyable bonheur qu''a éprouvé la créature en prenant un bain d''acide, est ignorée, probablement un mauvais rêve. Le MD devrait faire en sorte qu''une mémoire modifiée de façon trop absurde n''affecte pas la créature de manière significative.

Un sort de *délivrance des malédictions* ou de *restauration supérieure* lancé sur la cible restaure la véritable mémoire de la créature.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, vous pouvez modifier la mémoire de la cible concernant un événement datant de 7 jours maximum (niveau 6), 30 jours maximum (niveau 7), 1 an maximum (niveau 8), ou de n''importe quelle période du passé de la créature (niveau 9).', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Modification de mémoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Modification de mémoire' AND s.ruleset = '5';

-- Mur de force
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de force', 5, '1 action', 36, '["V","S","M"]', 'une pincée de poudre réalisée en pilant une pierre semi-précieuse translucide', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Un mur de force invisible apparaît en un point de votre choix à portée. Le mur prend l''orientation que choisissez, comme une barrière verticale, horizontale, ou avec angle. Il peut flotter librement dans les airs ou s''appuyer sur une surface solide. Vous pouvez lui donner la forme d''un dôme hémisphérique ou d''une sphère ayant un rayon de 3 mètres maximum, ou lui donner la forme d''une surface plane constituée de dix panneaux de 3 mètres de côté chacun. Chaque panneau doit être contigu à un autre panneau. Quelle que soit sa forme, le mur a une épaisseur de 6 millimètres. Il reste en place pendant toute la durée du sort. Si le mur traverse l''espace occupé par une créature lorsqu''il apparaît, la créature est repoussée d''un côté du mur (vous choisissez le côté).

Rien ne peut traverser physiquement le mur. Il est immunisé à tous les types de dégâts et ne peut être dissipé avec un sort de *dissipation de la magie*. Cependant, un sort de *désintégration* détruit le mur instantanément. Le mur est également présent dans le plan éthéré, bloquant les voyages éthérés au travers du mur.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de force' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de force' AND s.ruleset = '5';

-- Mur de pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de pierre', 5, '1 action', 36, '["V","S","M"]', 'un petit bloc de granite', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Un mur non magique de pierre solide émerge à un point que vous choisissez dans la portée. Le mur fait 15 cm d''épaisseur et est composé de dix panneaux de 3 mètres sur 3 mètres. Chaque panneau doit être contigu avec au moins un autre panneau. Vous pouvez aussi créer des panneaux de 3 mètres par 6 mètres qui ne font que de 7,50 cm d''épaisseur.

Si le mur traverse l''espace d''une créature quand il apparaît, la créature est poussée d''un côté du mur (à votre choix). Si une créature devrait être entourée de tous côtés par le mur (ou par le mur et une autre surface solide), cette créature peut alors faire un jet de sauvegarde de Dextérité. En cas de réussite, elle peut utiliser sa réaction pour se déplacer de sa vitesse et éviter que la paroi ne l''entoure complètement.

Le mur peut prendre la forme que vous désirez, mais il ne peut pas occuper l''espace d''une créature ou d''un objet. Le mur ne doit pas forcément être vertical ou posséder des fondations fermes. Cependant, il doit reposer solidement sur de la pierre existante. Ainsi, vous pouvez utiliser ce sort pour créer un pont qui enjambe un gouffre ou créer une rampe.

Si vous créez une envergure supérieure à 6 mètres de longueur, vous devez réduire de moitié la taille de chaque panneau pour créer des supports. Vous pouvez façonner grossièrement le mur pour créer des créneaux, des remparts, etc.

Le mur est un objet de pierre qui peut être endommagé et donc ébréché. Chaque panneau a une CA de 15 et 30 points de vie par tranche de 2,50 cm. Réduire un panneau à 0 point de vie le détruit et pourrait provoquer l''effondrement des autres panneaux qui lui sont reliés, à la discrétion du MD.

Si vous maintenez votre concentration sur ce sort pendant toute sa durée, le mur devient permanent et ne peut plus être dissipé. Sinon, le mur disparaît lorsque le sort se termine.', 5, '{"ability":"dex"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de pierre' AND s.ruleset = '5';

-- Mythes et légendes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mythes et légendes', 5, '10 minutes', 0, '["V","S","M"]', 'de l''encens d''une valeur d''au moins 250 po, que le sort consume, et quatre bâtonnets d''ivoire d''une valeur d''au moins 50 po chacun', '{"amount":250,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Nommez ou décrivez une personne, un lieu ou un objet. Le sort apporte à votre esprit une brève et sommaire information à propos de la chose que vous avez nommée. L''information peut être présentée sous forme de contes, d''histoires oubliées ou même d''informations secrètes qui n''ont jamais été révélées. Si la chose que vous avez nommée n''a pas de résonance légendaire, vous n''obtenez aucune information. Plus vous avez déjà d''information à propos de la chose, plus précises et détaillées seront les informations que vous recevrez.

Ce que vous apprenez est précis mais peut être dissimulé dans un langage figuré. Par exemple, si vous avez une mystérieuse hache magique dans votre main, le sort peut révéler cette information : « Malheur au scélérat qui touche de ses mains la hache, car le manche tranchera celles du malin. Seul un vrai Enfant de la pierre, aimant et aimé de Moradin, pourrait réveiller le vrai pouvoir de cette hache, et seulement avec le mot sacré Rudnogg sur les lèvres ».', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mythes et légendes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mythes et légendes' AND s.ruleset = '5';

-- Passage par les arbres
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Passage par les arbres', 5, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous gagnez la capacité de pénétrer dans un arbre et de vous déplacer à l''intérieur pour ressortir par un autre arbre de la même espèce se trouvant à 150 mètres maximum. Les deux arbres doivent être vivants et être au moins aussi grands que vous. Vous devez utiliser 1,50 mètre de votre mouvement pour entrer dans l''arbre. Vous connaissez immédiatement l''emplacement de tous les autres arbres de la même espèce se trouvant à 150 mètres à la ronde et, faisant partie du mouvement que vous avez utilisé pour pénétrer dans l''arbre, vous pouvez vous déplacer à l''intérieur d''un autre arbre ou sortir de l''arbre dans lequel vous êtes. Vous apparaissez à l''endroit de votre choix à 1,50 mètre de l''arbre de destination en dépensant 1,50 mètre de mouvement supplémentaire. S''il ne vous reste plus de mouvement à dépenser, vous apparaissez à 1,50 mètre de l''arbre par lequel vous êtes entré.

Vous pouvez utiliser ce moyen de transport une fois par tour pendant toute la durée du sort. Vous devez terminer chacun de vos tours en dehors d''un arbre.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Passage par les arbres' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Passage par les arbres' AND s.ruleset = '5';

-- Passe-muraille
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Passe-muraille', 5, '1 action', 9, '["V","S","M"]', 'une pincée de graine de sésame', NULL, 0, '1 heure', 'hour', 1, 0, 'Un passage apparaît à un endroit de votre choix que vous pouvez voir sur une surface en bois, en plâtre ou en pierre (tel qu''un mur, un plancher ou un plafond) à portée, et disparaît à la fin du sort. Vous choisissez la taille de l''ouverture (jusqu''à 1,50 mètre de large, 2,50 mètres de haut et 6 mètres de profondeur. Le passage n''engendre pas d''instabilité dans la structure environnante.

Quand l''ouverture disparaît, toutes créatures ou tous objets encore présents dans le passage créé se retrouvent éjectés sans dommage vers un endroit non occupé près de la surface sur laquelle a été lancé le sort.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Passe-muraille' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Passe-muraille' AND s.ruleset = '5';

-- Quête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Quête', 5, '1 minute', 18, '["V"]', NULL, NULL, 0, '30 jours', 'day', 30, 0, 'Vous placez un ordre magique sur une créature que vous pouvez voir et à portée, la forçant ainsi à vous rendre service ou à s''interdire certaines actions ou activités, selon ce que vous décidez. Si la créature peut vous comprendre, elle doit réussir un jet de sauvegarde de Sagesse sous peine d''être charmée pour toute la durée du sort. Tant que vous charmez cette créature, elle subit 5d10 dégâts psychiques chaque fois qu''elle agit directement à l''encontre de vos instructions, mais pas plus d''une fois par jour. Une créature qui ne peut pas vous comprendre n''est pas affectée par ce sort.

Vous pouvez lui donner n''importe quel ordre de votre choix, à l''exception d''une activité qui se terminerait inévitablement par sa mort. Si vous lui donnez l''ordre de se suicider, le sort prend fin.

Vous pouvez mettre fin prématurément au sort en utilisant une action pour l''annuler. Un sort de *délivrance des malédictions, restauration supérieure* ou *souhait* met également fin au sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou 8, la durée du sort passe à 1 an. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 9, le sort persiste jusqu''à ce qu''il soit dissipé par l''un des sorts mentionnés ci-dessus.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Quête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Magicien', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Quête' AND s.ruleset = '5';

-- Rappel à la vie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Rappel à la vie', 5, '1 heure', 1.5, '["V","S","M"]', 'un diamant valant au moins 500 po, que le sort consomme', '{"amount":500,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous ramenez à la vie une créature morte depuis moins de 10 jours que vous touchez. Si l''âme de la créature est à la fois consentante et libre de rejoindre le corps, la créature revient à la vie avec 1 point de vie.

Ce sort neutralise les poisons et guérit les maladies normales affligeant la créature au moment de sa mort. Cependant, il n''enraye pas les maladies magiques, les malédictions et autres affections du genre. Si de tels effets ne sont pas enrayés avant l''incantation du sort, ils affligent toujours la cible à son retour à la vie. Ce sort ne peut rappeler un mort-vivant à la vie.

Ce sort referme les blessures mortelles, mais il ne restaure pas les parties du corps qui ont été amputées. Si la créature a perdu des parties de son corps ou des organes essentiels à sa survie, comme la tête, le sort échoue automatiquement.

Revenir du monde des morts est une épreuve. La cible subit une pénalité de -4 à tous ses jets d''attaque, de sauvegarde et de caractéristique. À chaque fois que la cible termine un repos long, la pénalité est réduite de 1 jusqu''à ce qu''elle soit nulle.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rappel à la vie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Rappel à la vie' AND s.ruleset = '5';

-- Réincarnation
INSERT INTO roll_tables (key, ruleset, name, die, entries, created_at)
SELECT 'reincarnate', '5', 'Réincarnation', 100, '[{"min":1,"max":4,"text":"Drakéide"},{"min":5,"max":13,"text":"Nain des collines"},{"min":14,"max":21,"text":"Nain des montagnes"},{"min":22,"max":25,"text":"Elfe noir"},{"min":26,"max":34,"text":"Haut-elfe"},{"min":35,"max":42,"text":"Elfe des bois"},{"min":43,"max":46,"text":"Gnome des forêts"},{"min":47,"max":52,"text":"Gnome des roches"},{"min":53,"max":56,"text":"Demi-elfe"},{"min":57,"max":60,"text":"Demi-orc"},{"min":61,"max":68,"text":"Halfelin pied-léger"},{"min":69,"max":76,"text":"Halfelin robuste"},{"min":77,"max":96,"text":"Humain"},{"min":97,"max":100,"text":"Tieffelin"}]', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM roll_tables WHERE key = 'reincarnate' AND ruleset = '5');

INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, roll_table_id)
SELECT 'Réincarnation', 5, '1 heure', 1.5, '["V","S","M"]', 'des huiles et des onguents rares valant au moins 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez un humanoïde mort ou une partie de cet humanoïde mort. À condition que l''humanoïde ne soit pas mort depuis plus de 10 jours, le sort crée un nouveau corps adulte pour cet humanoïde et appelle son âme pour qu''elle entre dans ce corps. Si l''âme de la cible n''est pas libre, ou si elle n''en a pas envie, le sort échoue.

La magie façonne un nouveau corps pour que la créature s''y installe, ce qui fait que la race de la créature peut changer. Le MD lance 1d100 et consulte la table ci-dessous pour déterminer quelle forme va prendre la créature lorsqu''elle reviendra à la vie, le MD peut sinon choisir la forme du corps.

La créature réincarnée se rappelle de sa vie passée. Elle conserve les capacités qu''elle possédait sous son ancienne forme ; elle change cependant de race, et change donc de traits raciaux en conséquence.', 8, NULL, NULL, NULL, NULL, NULL, (SELECT id FROM roll_tables WHERE key = 'reincarnate' AND ruleset = '5')
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Réincarnation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Réincarnation' AND s.ruleset = '5';

-- Restauration supérieure
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Restauration supérieure', 5, '1 action', 1.5, '["V","S","M"]', 'de la poussière de diamant valant au moins 100 po, que le sort consomme', '{"amount":100,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous imprégnez une créature que vous touchez d''une énergie positive afin d''annuler un effet débilitant. Vous pouvez réduire de un le niveau d''épuisement de la cible, ou mettre un terme aux effets suivants affligeant la cible :

- Un effet de charme ou de pétrification de la cible
- Une malédiction, incluant le lien de la cible avec un objet magique maudit
- Toute réduction à l''une des valeurs de caractéristique de la cible
- Un effet qui réduit le maximum de points de vie de la cible', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Restauration supérieure' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Restauration supérieure' AND s.ruleset = '5';

-- Sanctification
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sanctification', 5, '24 heures', 1.5, '["V","S","M"]', 'des herbes, des huiles et de l''encens d''une valeur d''au moins 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous touchez un point et imprégnez la zone autour d''une énergie sacrée (ou maudite). La zone peut avoir un rayon allant jusqu''à 18 mètres, et le sort échoue si le rayon inclut une zone déjà sous l''effet d''un sort de *sanctification*. La zone affectée est sujette aux effets suivants.

Premièrement, les célestes, les élémentaires, les fées, les fiélons et les morts-vivants ne peuvent pas entrer dans la zone, elles ne peuvent pas non plus charmer, effrayer ou posséder des créatures présentes dans la zone sanctifiée. Vous pouvez enlever de cette liste un ou plusieurs types de créatures (sur lesquelles l''effet ne s''appliquera donc pas).

Deuxièmement, vous pouvez apposer un effet supplémentaire à la zone. Choisissez l''effet parmi la liste suivante, ou choisissez un effet proposé par le MD. Certains de ces effets s''appliquent à des créatures dans la zone ; vous pouvez choisir si l''effet s''applique à toutes les créatures dans la zone, seulement aux créatures qui vénèrent un certain dieu ou suivent un chef particulier, ou seulement aux créatures d''une certaine sorte, comme les orcs ou les trolls. Lorsqu''une créature qui devrait être affectée pénètre la zone d''effet du sort pour la première fois de son tour ou commence son tour dans la zone d''effet, elle doit effectuer un jet de sauvegarde de Charisme. Si elle le réussit, la créature ignore l''effet additionnel jusqu''à ce qu''elle quitte la zone d''effet.

**Courage**. Les créatures affectées ne peuvent pas être effrayées tant qu''elles sont dans la zone d''effet.

**Ténèbres**. Les ténèbres emplissent la zone. Les lumières normales, ainsi que les lumières magiques créées à partir de sorts de niveau inférieur au niveau de l''emplacement de sort que vous avez utilisé pour lancer ce sort, ne peuvent illuminer la zone.

**Lumière du jour**. Une lumière vive emplit la zone. Les ténèbres magiques, créées à partir de sorts d''un niveau inférieur au niveau de l''emplacement de sort que vous avez utilisé pour lancer ce sort, ne peuvent étouffer la lumière.

**Protection contre une énergie**. Les créatures affectées présentes dans la zone obtiennent la résistance à un type de dégâts de votre choix, à l''exception des types contondant, perforant et tranchant.

**Vulnérabilité à une énergie**. Les créatures affectées présentes dans la zone obtiennent la vulnérabilité face à un type de dégâts de votre choix, à l''exception des types contondant, perforant et tranchant.

**Repos éternel**. Les corps morts enterrés dans la zone ne peuvent pas devenir des morts-vivants.

**Interférence extradimensionnelle**. Les créatures affectées ne peuvent ni se déplacer ni voyager en utilisant la téléportation ou des moyens extradimensionnels ou interplanaires.

**Peur**. Les créatures affectées sont effrayées tant qu''elles se trouvent dans la zone d''effet.

**Silence**. Aucun son ne peut être produit dans la zone d''effet et les sons extérieurs ne parviennent pas à y pénétrer.

**Langues**. Les créatures affectées peuvent communiquer avec toutes les autres créatures présentes dans la zone d''effet, même si elles n''ont aucun langage en commun.', 5, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sanctification' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Sanctification' AND s.ruleset = '5';

-- Scrutation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Scrutation', 5, '10 minutes', 0, '["V","S","M"]', 'un focaliseur d''une valeur d''au moins 1 000 po, comme une boule de cristal, un miroir en argent, ou une vasque remplie d''eau bénite', '{"amount":1000,"unit":"po"}', 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous pouvez voir et entendre une créature spécifique que vous choisissez et qui se trouve dans le même plan d''existence que vous. La cible doit effectuer un jet de sauvegarde de Sagesse, avec un modificateur dépendant de votre niveau de connaissance et du lien physique qui vous relie à elle. Si la cible sait que vous lancez ce sort, elle peut choisir d''échouer volontairement son jet de sauvegarde si elle souhaite être observée.

| Connaissance | Modificateur au jet de sauvegarde |
| --- | --- |
| Seconde main (vous avez entendu parler de la cible) | +5 |
| Première main (vous avez rencontré la cible) | +0 |
| Familier (vous connaissez bien la cible) | −5 |

| Lien | Modificateur au jet de sauvegarde |
| --- | --- |
| Un portrait ou un dessin | −2 |
| Une possession ou un vêtement | −4 |
| Un morceau de corps, une mèche de cheveux, un bout d''ongle, ou similaire | −10 |

En cas de réussite au jet de sauvegarde, la cible n''est pas affectée et vous ne pouvez plus utiliser ce sort contre elle pendant 24 heures. En cas d''échec, le sort crée un capteur invisible à 3 mètres de la cible. Vous pouvez voir et entendre comme si vous étiez à la place du capteur. Le capteur se déplace avec la cible, restant à 3 mètres d''elle pour toute la durée du sort. Une créature qui peut voir l''invisible voit le capteur comme un orbe lumineux de la taille de votre poing. Plutôt que de cibler une créature, vous pouvez cibler un lieu que vous avez déjà vu par le passé. Dans ce cas, le capteur apparaît à l''endroit ciblé et ne bouge pas.', 3, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Scrutation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Scrutation' AND s.ruleset = '5';

-- Soins de groupe
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Soins de groupe', 5, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un flot d''énergie curative émane d''un point de votre choix dans la portée du sort. Choisissez jusqu''à six créatures dans une sphère d''un rayon de 9 mètres centrée sur ce point. Chaque cible récupère un nombre de points de vie égal à 3d8 + le modificateur de votre caractéristique d''incantation. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, la quantité de points de vie récupérés est augmentée de 1d8 pour chaque niveau d''emplacement au-delà du niveau 5.', 5, NULL, NULL, '{"shape":"sphere","size":9}', NULL, '{"heal_type":"hit_points","isSpellcastingModifierAdded":true,"heal_at_slot_level":{"5":"3d8","6":"4d8","7":"5d8","8":"6d8","9":"7d8"}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Soins de groupe' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Soins de groupe' AND s.ruleset = '5';

-- Songe
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Songe', 5, '1 minute', 100000, '["V","S","M"]', 'une poignée de sable, un peu d''encre et une plume arrachée d''un oiseau endormi', NULL, 0, '8 heures', 'hour', 8, 0, 'Ce sort façonne les rêves d''une créature. Choisissez comme cible une créature que vous connaissez. La cible doit être située sur le même plan d''existence que vous. Les créatures qui ne dorment pas, comme les elfes, ne peuvent être contactées par ce sort. Vous, ou une cible consentante que vous touchez, entrez dans un état de transe, agissant comme un messager. Pendant la transe, le messager est conscient de son environnement, mais il ne peut ni agir, ni bouger.

Si la cible est endormie, le messager apparait dans les rêves de la cible et peut entretenir une conversation avec la cible aussi longtemps qu''elle reste endormie, dans la durée du sort. Le messager peut aussi façonner l''environnement du rêve en créant des paysages, des objets ou d''autres images. Le messager peut émerger de la transe à sa guise. Ce faisant, le sort se termine prématurément. La cible garde un souvenir précis du rêve à son réveil. Si la cible est éveillée lorsque vous incantez le sort, le messager le sait et il peut soit mettre un terme à la transe (et au sort), soit attendre que la cible s''endorme. Le messager apparait alors dans les rêves de la cible.

Le messager peut prendre la forme d''un monstre terrifiant aux yeux de la cible. Dans ce cas, le message peut livrer un message d''au plus dix mots et la cible doit réussir un jet de sauvegarde de Sagesse, sans quoi les échos d''une monstruosité fantasmagorique donnent naissance à un cauchemar qui persiste tout au long de la période de sommeil de la cible. Au terme de quoi, elle n''obtient pas les bénéfices de ce repos. De plus, lorsque la cible se réveille, elle subit 3d6 dégâts psychiques.

Si vous possédez une partie du corps, une mèche de cheveux, un ongle coupé ou une portion semblable du corps de la cible, celle-ci fait son jet de sauvegarde avec un désavantage.', 6, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Songe' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Songe' AND s.ruleset = '5';

-- Télékinésie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Télékinésie', 5, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous obtenez la capacité de déplacer ou manipuler les créatures ou les objets par la pensée. Lorsque vous lancez ce sort, et par une action à chaque tour pour la durée du sort, vous pouvez user de votre volonté sur une créature ou un objet que vous pouvez voir et à portée, générant l''effet correspondant (voir ci-dessous). Vous pouvez affecter la même cible tour après tour, ou en choisir une nouvelle à tout moment. Si vous changez de cible, la cible précédente n''est plus affectée par le sort.

**Créature**. Vous pouvez essayer de déplacer une créature de taille TG ou inférieure. Effectuez un jet de caractéristique avec votre caractéristique d''incantation contre un jet de Force de la créature. Si vous gagnez l''opposition, vous déplacez la créature jusqu''à 9 mètres dans n''importe quelle direction, même vers le haut, mais pas au-delà de la portée du sort. Jusqu''à la fin de votre prochain tour, la créature est entravée par votre emprise télékinétique. Une créature envoyée en hauteur est suspendue au milieu des airs. Lors des tours suivants, vous pouvez utiliser votre action pour tenter de maintenir votre emprise télékinétique sur la créature en effectuant un nouveau jet d''opposition.

**Objet**. Vous pouvez essayer de déplacer un objet dont le poids ne dépasse pas les 500 kg. Si l''objet n''est pas porté ou tenu, vous le déplacez automatiquement jusqu''à 9 mètres dans n''importe quelle direction, dans la limite de la portée du sort. Si l''objet est porté ou tenu par une créature, vous devez effectuer un jet de caractéristique avec votre caractéristique d''incantation contre un jet de Force de la créature. Si vous gagnez l''opposition, vous arrachez l''objet à la créature et pouvez le déplacer de 9 mètres dans toutes les directions, dans les limites de la portée du sort.

Vous pouvez exercer un contrôle fin sur les objets avec votre emprise télékinétique, comme manipuler un objet simple, ouvrir une porte ou un contenant, déposer ou récupérer un objet d''un contenant ouvert, ou déverser le contenu d''une fiole.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Télékinésie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Télékinésie' AND s.ruleset = '5';

-- Vague destructrice
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Vague destructrice', 5, '1 action', 0, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous frappez le sol, créant une onde d''énergie divine qui se propage à partir de vous. Chaque créature que vous choisissez, située à 9 mètres ou moins de vous, doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, elle subit 5d6 dégâts de tonnerre ainsi que 5d6 dégâts radiants ou nécrotiques (au choix) et tombe à terre. En cas de réussite elle ne subit que la moitié de ces dégâts et ne tombe pas à terre.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"emanation","size":9}', '[{"damage_type":"thunder","damage_at_slot_level":{"5":"5d6"}},{"damage_type":"radiant","label":"Radiants ou nécrotiques (au choix)","damage_at_slot_level":{"5":"5d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Vague destructrice' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Vague destructrice' AND s.ruleset = '5';

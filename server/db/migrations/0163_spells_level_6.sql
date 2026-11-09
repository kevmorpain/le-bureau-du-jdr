-- Sorts de niveau 6 du socle (#176 D1) : les 26 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_6.ts, gardé par test/nuxt/spellsLevel6Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Allié planaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Allié planaire', 6, '10 minutes', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous sollicitez l''aide d''une entité d''Outremonde. Vous devez connaître l''être en question : un dieu, un primordial, un prince démon ou un autre être au pouvoir cosmique. Cette entité envoie un céleste, un élémentaire ou un fiélon qui lui est loyal pour vous aider, faisant apparaître cette créature dans un espace inoccupé à portée. Si vous connaissez le nom spécifique d''une créature, vous pouvez prononcer ce nom au moment de lancer ce sort pour invoquer précisément cette créature, mais vous risquez quand même de recevoir une autre créature (au choix du MD).

Lorsque la créature apparaît, elle n''est pas contrainte d''agir d''une manière particulière. Vous pouvez demander à la créature de vous rendre un service en échange d''un paiement, mais elle n''est pas obligée de s''exécuter. Un large éventail de requêtes s''offre à vous, des plus simples (« Fais-nous survoler le gouffre », « Aide-nous à combattre »") aux plus complexes (« Espionne nos ennemis », « Protège-nous pendant notre incursion dans le donjon »). Vous devez être capable de communiquer avec la créature pour pouvoir négocier ses services.

Le paiement peut prendre diverses formes. Un céleste pourrait demander que vous fassiez une importante donation sous forme d''or ou d''objets magiques à un temple allié, tandis qu''un fiélon pourrait demander le sacrifice d''un être vivant ou une part du trésor. Certaines créatures pourraient vous rendre service à condition que vous acceptiez une quête pour elle.

Le tarif généralement pratiqué pour une tâche dont la durée est calculée en minutes est de 100 po par minute. Une tâche dont la durée se calcule en heures est de 1 000 po par heure. Et une tâche dont la durée se calcule en jours (jusqu''à un maximum de 10 jours) est de 10 000 po par jour. Le MD peut ajuster ces tarifs en fonction des raisons pour lesquelles vous lancez ce sort. Si la tâche s''accorde à l''éthique de la créature, le paiement pourrait être divisé par deux, voire non requis. Typiquement, une tâche non dangereuse ne requiert que la moitié du paiement suggéré ci-dessus, tandis qu''une tâche particulièrement dangereuse pourrait nécessiter une offrande beaucoup plus importante. Les créatures acceptent rarement les tâches qui semblent suicidaires.

Après qu''une créature ait accompli la tâche que vous lui avez confiée, ou lorsque la durée de service convenue arrive à échéance, la créature retourne sur son plan après vous avoir fait un rapport, si cela est approprié à la tâche ou si elle le peut. Si vous n''êtes pas capable de vous entendre sur le paiement de la tâche, la créature retourne immédiatement dans son plan d''origine.

Une créature enrôlée dans votre groupe compte comme un membre à part entière, recevant son quota de points d''expérience comme tous les autres membres.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Allié planaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Allié planaire' AND s.ruleset = '5';

-- Barrière de lames
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Barrière de lames', 6, '1 action', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez un mur de lames acérées et tourbillonnantes faites d''énergie magique. Le mur apparait dans la portée du sort et il persiste pour sa durée. Vous pouvez modeler un mur rectiligne mesurant jusqu''à 30 mètres de long, 6 mètres de haut et 1,50 mètre d''épaisseur, ou un mur circulaire mesurant jusqu''à 18 mètres de diamètre, 6 mètres de haut et 1,50 mètre d''épaisseur. Le mur confère un abri important (3/4) aux créatures situées derrière, et l''espace occupé par le mur est un terrain difficile.

Lorsqu''une créature pénètre dans la zone du mur pour la première fois de son tour ou lorsqu''elle débute son tour dans la zone, la créature doit effectuer un jet de sauvegarde de Dextérité, subissant 6d10 dégâts tranchants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"slashing","damage_at_slot_level":{"6":"6d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Barrière de lames' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Barrière de lames' AND s.ruleset = '5';

-- Chaîne d'éclairs
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Chaîne d''éclairs', 6, '1 action', 45, '["V","S","M"]', 'quelques poils ; un morceau d''ambre, de verre ou un bâtonnet de cristal ; et 3 épingles en argent', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous créez un trait électrifié qui s''arque à partir d''une cible de votre choix que vous pouvez voir et à portée. Trois traits s''élancent de la cible pour se diriger vers trois autres cibles. Chacune d''entre elles doit être à 9 mètres ou moins de la première cible. La cible peut être une créature ou un objet et ne peut être ciblée que par un seul des traits.

Toute cible doit effectuer un jet de sauvegarde de Dextérité, subissant 10d8 dégâts de foudre en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de sort de niveau 7 ou supérieur, un trait additionnel s''élance de la première cible vers une autre cible pour chaque niveau d''emplacement au-delà du niveau 6.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"lightning","damage_at_slot_level":{"6":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Chaîne d''éclairs' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Chaîne d''éclairs' AND s.ruleset = '5';

-- Contamination
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contamination', 6, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous libérez une infection virulente sur une créature que vous voyez dans la portée du sort. La cible doit effectuer un jet de sauvegarde de Constitution, subissant 14d6 dégâts nécrotiques en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Les dégâts ne peuvent réduire les points de vie de la cible sous 1. Si la cible échoue le jet de sauvegarde, son maximum de points de vie est amputé pour 1 heure de la même quantité de dégâts nécrotiques subis. Tout effet qui enraye la maladie permet au maximum de points de vie de la créature de retrouver sa valeur normale avant la fin de l''effet du sort.', 7, '{"ability":"con","success":"half"}', NULL, NULL, '[{"damage_type":"necrotic","damage_at_slot_level":{"6":"14d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contamination' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Contamination' AND s.ruleset = '5';

-- Convocations instantanées de Drawmij
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Convocations instantanées de Drawmij', 6, '1 minute', 1.5, '["V","S","M"]', 'un saphir valant au moins 1 000 po', '{"amount":1000,"unit":"po"}', 1, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous touchez un objet pesant au mieux 5 kg dont chacune des dimensions ne peut dépasser 1,80 mètre. Le sort dépose une marque invisible à sa surface et écrit, toujours de manière invisible, le nom de l''objet sur le saphir que vous avez utilisé comme composante matérielle. Chaque fois que vous lancez ce sort, vous devez utiliser un saphir différent.

Par la suite, n''importe quand, vous pouvez utiliser votre action pour prononcer le nom de l''objet et broyer le saphir. L''objet apparaît instantanément dans votre main, quels que soient la distance ou les plans qui vous séparent. Le sort prend alors fin.

Si une autre créature porte ou tient l''objet, briser le saphir ne téléporte pas l''objet jusqu''à vous mais vous informe de qui le possède actuellement et où cette créature se trouve en ce moment.

Le sort *dissipation de la magie*, ou un effet similaire, lancé avec succès sur le saphir met fin à l''effet du sort.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocations instantanées de Drawmij' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Convocations instantanées de Drawmij' AND s.ruleset = '5';

-- Danse irrésistible d'Otto
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Danse irrésistible d''Otto', 6, '1 action', 9, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez une créature visible et à portée. La cible entame une danse hilarante et maladroite, tapant des pieds et applaudissant pendant la durée du sort. Les créatures ne pouvant être charmées sont immunisées à ce sort.

La victime doit utiliser tout son mouvement pour danser tout en restant à la même place et à un désavantage à ses jets de sauvegarde de Dextérité et ses jets d''attaque. Les autres créatures ont un avantage à leur jet d''attaque contre la victime. Par une action, la victime peut tenter un jet de sauvegarde de Sagesse afin de regagner le contrôle d''elle-même. Sur un jet réussi, le sort prend fin.', 4, '{"ability":"wis"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Danse irrésistible d''Otto' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Danse irrésistible d''Otto' AND s.ruleset = '5';

-- Festin des héros
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Festin des héros', 6, '10 minutes', 9, '["V","S","M"]', 'un bol incrusté de joyaux valant au moins 1 000 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous produisez un grand festin, incluant des breuvages et des mets magnifiques. Le festin prend 1 heure pour être consommé et disparaît au bout de cette période. C''est à ce moment que les effets bénéfiques s''appliquent. Jusqu''à douze convives peuvent prendre part au festin.

Une créature qui partage le festin reçoit de nombreux bénéfices. La créature est guérie des maladies et des empoisonnements. Elle devient immunisée aux poisons, ne peut être effrayée et tous ses jets de sauvegarde de Sagesse ont un avantage. Son maximum de points de vie est aussi augmenté de 2d10 et elle gagne la même quantité de points de vie. Ces bénéfices persistent pendant 24 heures.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Festin des héros' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Festin des héros' AND s.ruleset = '5';

-- Globe d'invulnérabilité
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Globe d''invulnérabilité', 6, '1 action', 0, '["V","S","M"]', 'une bulle de verre ou de cristal qui éclate au terme du sort', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une barrière immobile et légèrement chatoyante prend la forme d''une sphère de 3 mètres de rayon autour de vous, et persiste pour la durée du sort.

Tout sort de niveau 5 ou moins incanté à l''extérieur de la barrière ne peut affecter les créatures et les objets qu''elle englobe, même si le sort utilise un emplacement de sort supérieur. Un tel sort peut cibler les créatures et les objets à l''intérieur de la barrière, mais ce sort n''a pas d''effet sur eux. De la même manière, la zone à l''intérieur de la sphère est exclue des zones affectées par de tels sorts.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, la barrière bloque les sorts d''un niveau supérieur pour chaque niveau d''emplacement au-delà du niveau 6.', 1, NULL, NULL, '{"shape":"emanation","size":3}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Globe d''invulnérabilité' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Globe d''invulnérabilité' AND s.ruleset = '5';

-- Guérison
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Guérison', 6, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Choisissez une créature que vous voyez dans la portée du sort. Une décharge d''énergie positive engouffre la créature lui permettant de récupérer 70 points de vie. Ce sort met aussi un terme à un aveuglement, une surdité et toutes autres maladies accablant la cible. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, la quantité de points de vie récupérés est augmentée de 10 pour chaque niveau d''emplacement au-delà du niveau 6.', 5, NULL, NULL, NULL, NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"6":"70","7":"80","8":"90","9":"100"}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Guérison' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Guérison' AND s.ruleset = '5';

-- Illusion programmée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Illusion programmée', 6, '1 action', 36, '["V","S","M"]', 'un bout de toison de mouton et de la poudre de jade d''une valeur d''au moins 25 po', '{"amount":25,"unit":"po"}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous créez l''image illusoire d''un objet, d''une créature, ou de tout autre phénomène visible dans la portée du sort et qui s''active sous certaines conditions. L''illusion est imperceptible avant que les conditions ne soient remplies. Elle doit tenir dans un cube de 9 mètres d''arête, et vous décidez, lorsque vous lancez ce sort, du comportement de l''illusion et des sons qu''elle émet. Cette animation programmée peut durer jusqu''à 5 minutes.

Lorsque les conditions que vous avez spécifiées sont remplies, l''illusion prend vie et exécute les animations et sons que vous avez prédéfinis. Une fois que l''illusion arrive à la fin de l''enchaînement, elle disparaît et reste inactive pendant 10 minutes. Après cette durée, l''illusion peut de nouveau être activée.

La condition de déclenchement peut être générale ou aussi détaillée que vous le souhaitez, elle doit cependant être basée sur un phénomène auditif ou visuel survenant à 9 mètres ou moins de la zone d''apparition de l''illusion. Par exemple, vous pourriez créer une illusion de vous-même qui apparaîtrait et mettrait en garde ceux qui tenteraient d''ouvrir une porte piégée, ou vous pourriez faire en sorte que l''illusion n''apparaisse que lorsqu''une créature prononce un mot ou une phrase spécifique.

Les interactions physiques avec l''image révèlent qu''il s''agit d''une illusion, car les choses passent au travers. Une créature qui utilise son action pour examiner l''image peut déterminer qu''il s''agit d''une illusion en réussissant un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort. Si une créature découvre le caractère illusoire de l''image, cette créature peut voir au travers de l''image, et tout son produit par l''illusion lui semble faux et sonne creux.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Illusion programmée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Illusion programmée' AND s.ruleset = '5';

-- Interdiction
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Interdiction', 6, '10 minutes', 1.5, '["V","S","M"]', 'quelques gouttes d''eau bénite, des encens très rares, et de la poudre de rubis pour une valeur minimum de 1 000 po', '{"amount":1000,"unit":"po"}', 1, '1 jour', 'day', 1, 0, 'Vous créez une défense contre les déplacements magiques qui protège jusqu''à 4,500 mètres carré d''espace au sol sur une hauteur de 9 mètres au-dessus du sol. Pour la durée du sort, les créatures ne peuvent pas se téléporter dans cette zone en utilisant des portails, comme ceux créés par le sort *portail*, pour pénétrer la zone. Le sort imperméabilise la zone aux voyages planaires, et pour cela, empêche les créatures d''accéder à la zone en passant par le plan Astral, le plan éthéré, la Féerie et la Gisombre, ou grâce au sort *changement de plan*.

De plus, le sort inflige des dégâts aux créatures des types que vous choisissez lorsque vous lancez ce sort. Choisissez un ou plus des types suivants : céleste, élémentaire, fée, fiélon, et mort-vivant. Lorsqu''une créature du type choisi pénètre dans l''aire du sort pour la première fois de son tour, ou y commence son tour, la créature subit 5d10 dégâts radiants ou nécrotiques (choix que vous avez effectué lors de l''incantation du sort).

Lorsque vous lancez ce sort, vous pouvez désigner un mot de passe. Une créature qui prononce le mot de passe au moment où elle pénètre dans la zone ne subit pas les dégâts du sort.

La zone affectée par ce sort ne peut pas se superposer à une zone créée par un autre sort d''*interdiction*. Si vous lancez *interdiction* chaque jour pendant 30 jours sur la même zone, le sort durera jusqu''à ce qu''il soit dissipé et les composantes matérielles seront consommées lors de la dernière incantation.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Interdiction' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Interdiction' AND s.ruleset = '5';

-- Marche sur le vent
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Marche sur le vent', 6, '1 minute', 9, '["V","S","M"]', 'du feu et de l''eau bénite', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous et jusqu''à 10 créatures consentantes que vous pouvez voir et à portée, êtes transformés en vapeur pour la durée du sort, ressemblant à de petits nuages. Tant qu''elle est sous cette forme de nuage, une créature obtient une vitesse de vol de 90 mètres ainsi que la résistance aux dégâts des armes non magiques. Les seules actions que peut effectuer une créature sous cette forme sont l''action Foncer et le retour à sa forme normale. Revenir à sa forme normale prend 1 minute, durant laquelle la créature est incapable d''agir et ne peut pas se déplacer. Jusqu''à la fin du sort, une créature peut revenir en forme nuageuse, ce qui lui prendra également 1 minute de transformation.

Si une créature est sous forme nuageuse et en train de voler lorsque l''effet prend fin, la créature redescend à la vitesse de 18 mètres par round pendant 1 minute jusqu''à ce qu''elle touche terre, ce qu''elle fait sans encombre. Si elle ne touche pas le sol après 1 minute, la créature chute de la distance restante.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Marche sur le vent' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Marche sur le vent' AND s.ruleset = '5';

-- Mot de retour
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mot de retour', 6, '1 action', 1.5, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous, et jusqu''à cinq créatures consentantes se trouvant à 1,50 mètre de vous, êtes instantanément téléportés dans un sanctuaire préalablement choisi. Vous, et toutes les créatures téléportées avec vous, apparaissez à l''endroit inoccupé le plus proche de lieu que vous avez choisi lorsque vous avez préparé votre sanctuaire (voir ci-dessous). Si vous lancez ce sort sans avoir au préalable préparer un sanctuaire, le sort n''a aucun effet.

Vous devez désigner un sanctuaire en lançant ce sort dans un lieu, comme un temple, dédié, ou puissamment connecté, à votre dieu. Si vous tentez de lancer ce sort de cette manière dans une zone qui n''est pas dédiée à votre dieu, le sort n''a aucun effet.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de retour' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Mot de retour' AND s.ruleset = '5';

-- Mur d'épines
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur d''épines', 6, '1 action', 36, '["V","S","M"]', 'une poignée d''épines', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez un mur résistant mais souple de broussailles enchevêtrées et hérissées d''aiguilles acérées. Le mur apparaît sur une surface solide à portée et reste en place pendant toute la durée du sort. Vous pouvez choisir de créer un mur long de 18 mètres, haut de 3 mètres et épais de 1,50 mètre, ou bien un mur circulaire de 6 mètres de diamètre, d''une hauteur maximale de 6 mètres et de 1,50 mètre d''épaisseur. Le mur bloque la vue.

Lorsque le mur apparaît, chaque créature se trouvant dans la zone doit effectuer un jet de sauvegarde de Dextérité, subissant 7d8 dégâts perforants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Une créature peut se déplacer au travers du mur, quoique lentement et difficilement. Pour chaque mètre de progression la créature doit dépenser 4 mètres de déplacement. Par ailleurs, la première fois du tour qu''une créature entre dans le mur ou y termine son tour, elle doit effectuer un jet de sauvegarde de Dextérité, subissant 7d8 dégâts tranchants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, les deux types de dégâts sont augmentés de 1d8 pour chaque niveau d''emplacement au-delà du niveau 6.', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"piercing","damage_at_slot_level":{"6":"7d8","7":"8d8","8":"9d8","9":"10d8"}},{"damage_type":"slashing","damage_at_slot_level":{"6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur d''épines' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Mur d''épines' AND s.ruleset = '5';

-- Mur de glace
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de glace', 6, '1 action', 36, '["V","S","M"]', 'un petit morceau de quartz', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez un mur de glace sur une surface solide à portée. Vous pouvez lui donner la forme d''un dôme hémisphérique ou d''une sphère de 3 mètres de rayon maximum, ou bien lui donner la forme d''une surface plane composée de 10 panneaux de 3 mètres de côté chacun, chaque panneau devant être contigu à un autre panneau. Quelle que soit sa forme, le mur est épais de 30 cm et reste en place pendant toute la durée du sort.

Si le mur traverse l''espace occupé par une créature lorsqu''il apparaît, la créature est repoussée d''un côté du mur et doit effectuer un jet de sauvegarde de Dextérité. La créature subit 10d6 dégâts de froid en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Le mur est un objet qui peut être endommagé, il est donc possible d''y créer une brèche. Il possède une CA de 12 et 30 points de vie par section de 3 mètres, et est vulnérable aux dégâts de feu. Réduire une section de 3 mètres à 0 point de vie la détruit et laisse place à un voile d''air glacial à l''endroit que le mur occupait. Une créature se déplaçant au travers de ce voile glacial pour la première fois de son tour doit effectuer un jet de sauvegarde de Constitution. La créature subit 5d6 dégâts de froid en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, les dégâts qu''inflige le mur lorsqu''il apparaît augmentent de 2d6, et les dégâts infligés aux créatures qui traversent le voile d''air glacial augmentent de 1d6, pour chaque niveau d''emplacement au-delà du niveau 6.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"cold","label":"Apparition du mur","damage_at_slot_level":{"6":"10d6","7":"12d6","8":"14d6","9":"16d6"}},{"damage_type":"cold","label":"Traversée du voile d''air glacial","damage_at_slot_level":{"6":"5d6","7":"6d6","8":"7d6","9":"8d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de glace' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de glace' AND s.ruleset = '5';

-- Pétrification
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Pétrification', 6, '1 action', 18, '["V","S","M"]', 'une pincée de chaux, de l''eau, et un peu de terre', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez de changer en pierre une créature que vous pouvez voir et à portée. Si le corps de la cible est fait de chair, la créature doit effectuer un jet de sauvegarde de Constitution. Si elle échoue, elle est entravée car sa chair commence à durcir. Si elle réussit, la créature n''est pas affectée.

Une créature entravée par ce sort doit effectuer un nouveau de jet de sauvegarde de Constitution à la fin de chacun de ses tours. Si elle réussit trois fois son jet de sauvegarde contre ce sort, le sort prend fin. Si elle échoue trois fois son jet de sauvegarde contre ce sort, elle est changée en pierre et soumise à l''état pétrifié pour toute la durée du sort. Les succès ou échecs n''ont pas besoin d''être consécutifs ; conservez une trace du résultat de chaque jet jusqu''à ce que la cible cumule trois échecs ou trois réussites.

Si la créature est physiquement brisée tandis qu''elle est pétrifiée, elle souffre de difformités similaires lorsqu''elle retourne à son état original.

Si vous maintenez votre concentration sur ce sort pendant sa durée maximale, la créature est changée en pierre jusqu''à ce que cet effet soit dissipé.', 8, '{"ability":"con","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Pétrification' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Pétrification' AND s.ruleset = '5';

-- Portail magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Portail magique', 6, '1 action', 150, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez des portails de téléportation reliés qui restent ouverts toute la durée du sort. Choisissez deux points au sol que vous pouvez voir, l''un à 3 mètres ou moins de vous et l''autre à 150 mètres ou moins de vous. Un portail circulaire de 3 mètres de diamètre s''ouvre sur chaque point. Si un portail allait s''ouvrir sur un espace occupé par une créature, le sort échoue et l''incantation est perdue.

Les portails sont des anneaux luisants en deux dimensions remplis de brumes qui lévitent à quelques centimètres au-dessus des points que vous avez choisis. Un anneau n''est visible que d''un côté (celui de votre choix), ce même côté qui fonctionne comme portail.

Toute créature ou objet entrant dans un portail ressort par l''autre portail comme s''ils étaient adjacents l''un de l''autre. Passer au travers d''un portail par le côté non fonctionnel n''a aucun effet. La brume qui remplit chaque portail est opaque et bloque la vision au travers. À votre tour, vous pouvez faire tourner les anneaux par une action bonus de sorte que la face active des portails soit orientée dans une autre direction.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Portail magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Portail magique' AND s.ruleset = '5';

-- Prévoyance
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Prévoyance', 6, '10 minutes', 0, '["V","S","M"]', 'une statuette vous représentant, sculptée dans l''ivoire et incrustée de pierres précieuses d''une valeur d''au moins 1 500 po', '{"amount":1500,"unit":"po"}', 0, '10 jours', 'day', 10, 0, 'Choisissez un sort de niveau 5 ou inférieur que vous pouvez lancer, qui a une durée d''incantation de 1 action et qui peut vous cibler. Vous lancez ce sort (appelé sort conditionné) au cours du lancement du sort *prévoyance*. Vous dépensez les emplacements de sorts des deux sorts, mais le sort conditionné ne prend pas effet immédiatement ; il ne prend effet que lorsque certaines circonstances ont lieu. Vous déterminez ces circonstances lorsque vous lancez ces deux sorts. Par exemple, *prévoyance* lancé avec le sort *respiration aquatique* pourrait stipuler que *respiration aquatique* ne prend effet que lorsque vous êtes complètement immergé dans l''eau ou tout autre liquide similaire.

Le sort conditionné prend effet immédiatement après que les conditions de déclenchement ne soient remplies pour la première fois, que vous le vouliez ou non, ce qui met fin au sort *prévoyance*.

Le sort conditionné ne prend effet que sur vous, même s''il peut normalement cibler d''autres créatures. Vous ne pouvez utiliser qu''un seul sort de *prévoyance* à la fois. Si vous lancez ce sort de nouveau, l''effet du sort *prévoyance* déjà actif sur vous se termine. Le sort *prévoyance* se termine également si vous ne portez plus sa composante matérielle sur vous.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Prévoyance' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Prévoyance' AND s.ruleset = '5';

-- Protections et sceaux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Protections et sceaux', 6, '10 minutes', 1.5, '["V","S","M"]', 'de l''encens allumé, une cuillerée de soufre et d''huile, une ficelle nouée, une petite quantité de sang de mastodonte des ombres, et un petit bâtonnet d''argent d''une valeur d''au moins 10 po', '{"amount":10,"unit":"po"}', 0, '24 heures', 'hour', 24, 0, 'Vous établissez des défenses magiques qui protègent jusqu''à 225 mètres carré d''espace au sol (un carré de 15 mètres de côté, ou une centaine de carrés de 1,50 mètre de côté, ou 25 carrés de 3 mètres de côté). La zone protégée magiquement peut faire jusqu''à 6 mètres de hauteur, et avoir la forme que vous désirez. Vous pouvez protéger plusieurs étages d''une forteresse en partageant la zone d''effet entre eux, tant que vous êtes capable de marcher entre chacune de ces zones de manière continue pendant que vous lancez ce sort.

Lorsque vous lancez ce sort, vous pouvez également spécifier un mot de passe qui, lorsqu''il est dit à haute voix, immunise la personne qui l''a prononcé des effets de ce sort.

Le sort *protections et sceaux* applique les effets suivants dans la zone protégée.

**Couloirs**. De la brume remplit tous les couloirs protégés, les obscurcissant fortement. De plus, à chaque intersection ou embranchement offrant un choix de direction, il y a 50 % de chance qu''une autre créature que vous aille dans la direction opposée à celle qu''elle a choisie.

**Portes**. Toutes les portes de la zone protégée sont verrouillées magiquement, comme si elles étaient sous l''effet du sort *verrou magique*. De plus, vous pouvez dissimuler jusqu''à 10 portes avec une illusion (équivalent à un objet illusoire formé à partir du sort *illusion mineure*) qui leur donne l''apparence de portion de mur.

**Escaliers**. Les toiles d''araignée remplissent tous les escaliers de la zone protégée, du sol au plafond, du début à la fin, comme avec le sort *toile d''araignée*. Les fibres de la toile repoussent au bout de 10 minutes s''ils ont été brûlés ou arrachés tant que le sort *protections et sceaux* est actif.

**Autres effets du sort**. Vous pouvez installer l''un des effets magiques suivants dans la partie de la forteresse protégée par ce sort.

- Placez le sort *lumières dansantes* dans quatre couloirs. Vous pouvez choisir un programme simple que les lumières répètent tant que le sort *protections et sceaux* est actif.
- Placez le sort *bouche magique* en deux endroits.
- Placez le sort *nuage nauséabond* en deux endroits. Les vapeurs apparaissent aux endroits que vous désignez ; elles y réapparaissent au bout de 10 minutes si elles ont été dispersées par le vent tant que le sort *protections et sceaux* est actif.
- Placez un sort de *bourrasque* constant dans un couloir ou une pièce.
- Placez un sort de *suggestion* dans un endroit. Vous choisissez une zone de 1,50 mètre de côté, et toute créature qui pénètre ou traverse la zone reçoit mentalement la suggestion.

Toute la zone protégée irradie la magie. Un sort de *dissipation de la magie* lancé sur un effet spécifique, s''il est couronné de succès, ne supprime que cet effet.

Vous pouvez faire en sorte que la structure que vous protégez le soit de manière permanente. Pour cela, lancez ce sort tous les jours pendant un an.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Protections et sceaux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Protections et sceaux' AND s.ruleset = '5';

-- Rayon de soleil
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Rayon de soleil', 6, '1 action', 0, '["V","S","M"]', 'une loupe', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un rayon de lumière intense est émis de votre main sur une ligne de 18 mètres de long et de 1,50 mètre de large. Chaque créature se trouvant sur cette ligne doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, une créature subit 6d8 dégâts radiants et est aveuglée jusqu''à votre prochain tour. En cas de réussite, elle subit la moitié de ces dégâts et n''est pas aveuglée par ce sort. Les morts-vivants et les vases ont un désavantage pour ce jet de sauvegarde.

Vous pouvez créer une nouvelle ligne de lumière par une action, à chacun de vos tours, jusqu''à ce que le sort prenne fin.

Pour toute la durée du sort, un point de lumière intense brille dans votre main. Il répand une lumière vive dans un rayon de 9 mètres et une lumière faible sur 9 mètres supplémentaires. Cette lumière est équivalente à celle du soleil.', 5, '{"ability":"con","success":"half"}', NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"6":"6d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayon de soleil' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Rayon de soleil' AND s.ruleset = '5';

-- Sens de l'orientation
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sens de l''orientation', 6, '1 minute', 0, '["V","S","M"]', 'un jeu d''outils divinatoires, comme des ossements, des bâtons d''ivoire, des cartes, des dents ou des runes gravées, valant au moins 100 po, et un objet originaire de l''endroit à atteindre', '{"amount":100,"unit":"po"}', 0, 'Concentration, jusqu''à 1 jour', 'day', 1, 1, 'Ce sort vous permet de déterminer le chemin physique le plus court et le plus direct pour atteindre une destination déterminée avec laquelle vous êtes familier et qui se trouve sur le même plan d''existence. Si vous nommez une destination située sur un autre plan d''existence ou une destination mouvante (comme une forteresse mobile) ou une destination vague (comme « l''antre du dragon vert »), le sort échoue.

Pour la durée du sort, aussi longtemps que vous êtes sur le même plan d''existence que la destination, vous en connaissez la distance et la direction. Lorsque vous vous y déplacez, chaque fois que vous êtes confronté à un choix d''itinéraire, vous déterminez automatiquement lequel présente la route la plus courte et la plus directe (mais pas nécessairement la plus sure) vers votre destination.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sens de l''orientation' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Sens de l''orientation' AND s.ruleset = '5';

-- Sphère glaciale d'Otiluke
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sphère glaciale d''Otiluke', 6, '1 action', 90, '["V","S","M"]', 'une petite sphère de cristal', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un globe d''énergie glaciale est projeté du bout de votre doigt vers un point de votre choix, à portée, où il explose en une sphère d''un rayon de 18 mètres. Chaque créature se trouvant dans la zone doit effectuer un jet de sauvegarde de Constitution, subissant 10d6 dégâts de froid en cas de réussite, ou la moitié de ces dégâts en cas de réussite.

Si le globe percute une masse d''eau ou un liquide composé principalement d''eau (à l''exception des créatures constituées d''eau), il gèle le liquide sur une profondeur de 15 cm et une zone carrée de 9 mètres de côté. La glace reste en place pendant 1 minute. Les créatures qui étaient en train de nager à la surface de l''eau gelée son piégées par la glace. Une créature piégée peut utiliser son action pour effectuer un jet de Force contre le DD de sauvegarde de votre sort pour se libérer.

Si vous le souhaitez, vous pouvez vous abstenir de tirer le globe une fois que vous avez fini d''incanter le sort. Un petit globe de la taille d''une pierre à fronde, froid au toucher, apparaît alors dans votre main. À n''importe quel moment, vous, ou une autre créature à qui vous avez donné le globe, pouvez le lancer (avec une portée de 12 mètres) ou le projeter avec une fronde (la portée du globe devient celle de la fronde). Il se brise à l''impact, avec les mêmes effets que s''il avait été lancé directement suite à l''incantation du sort. Vous pouvez également poser le globe au sol sans le briser. Au bout d''une minute, si le globe n''est toujours pas brisé, il explose.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 6.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":18}', '[{"damage_type":"cold","damage_at_slot_level":{"6":"10d6","7":"11d6","8":"12d6","9":"13d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère glaciale d''Otiluke' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère glaciale d''Otiluke' AND s.ruleset = '5';

-- Suggestion de groupe
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Suggestion de groupe', 6, '1 action', 18, '["V","M"]', 'une langue de serpent et un rayon de miel ou une goutte d''huile douce', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous proposez un plan d''activité (limitée à une phrase ou deux) et influencez magiquement jusqu''à 12 créatures que vous pouvez voir dans la portée du sort et qui peuvent vous entendre et vous comprendre. Les créatures qui ne peuvent pas être charmées sont à l''abri de cet effet. La suggestion doit être formulée de manière que la réalisation de l''action semble raisonnable. Demander à la créature de se poignarder, de s''empaler sur une lance, de s''immoler ou tout autre acte qui lui serait dommageable met un terme au sort.

Chacune des cibles doit faire un jet de sauvegarde de Sagesse. En cas d''échec, elle poursuit le cours de l''action que vous avez décrit au mieux de ses possibilités. Le plan d''action proposé peut se poursuivre pendant toute la durée du sort. Si l''activité qui est suggérée peut être réalisée en un temps plus court, le sort prend fin lorsque le sujet termine ce qu''il lui a été demandé de faire.

Vous pouvez également spécifier des conditions qui déclencheront une activité spéciale pendant la durée du sort. Par exemple, vous pourriez suggérer à un groupe de soldats d''offrir leurs bourses au premier mendiant qu''ils rencontrent. Si la condition n''est pas remplie avant que le sort expire, l''activité n''est pas effectuée.

Si vous, ou un de vos compagnons, blessez une des créatures sous l''effet de ce sort, il prend fin pour cette créature.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7, la durée du sort augmente à 10 jours. Avec un emplacement de sort de niveau 8, la durée du sort augmente à 30 jours. Avec un emplacement de sort de niveau 9, la durée du sort augmente à une année plus un jour.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Suggestion de groupe' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Suggestion de groupe' AND s.ruleset = '5';

-- Terraformage
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Terraformage', 6, '1 action', 36, '["V","S","M"]', 'une lame en fer et un mélange d''argile, de terre meuble et de sable dans un petit sac', NULL, 0, 'Concentration, jusqu''à 2 heures', 'hour', 2, 1, 'Choisissez une superficie de terrain pas plus large que 12 mètres de côté dans la portée du sort. Vous pouvez façonner la terre, le sable ou l''argile dans la zone de la manière que vous souhaitez pour la durée du sort. Vous pouvez élever ou abaisser l''altitude de la zone, déblayer ou remblayer une tranchée, ériger ou aplatir un mur ou former un pilier. La mesure de telles modifications ne peut excéder la moitié de la dimension la plus large de la zone. Ainsi, si vous remodelez un carré de 12 mètres d''arête, vous pouvez créer un pilier de 6 mètres de hauteur, élever ou abaisser l''altitude de ce carré de 6 mètres, creuser une tranchée de 6 mètres de profondeur, et ainsi de suite. Les changements prennent 10 minutes pour s''achever.

À la fin de chaque période de 10 minutes que vous passez concentré sur le sort, vous pouvez terraformer une nouvelle superficie.

Puisque la transformation du relief s''effectue lentement, les créatures présentes dans la zone ne peuvent être piégées ou blessées par les mouvements du sol.

Ce sort ne peut manipuler la pierre naturelle et les constructions en pierre. La roche et les structures se déplacent pour s''accommoder au nouveau relief. Si votre terraformage place une structure en position précaire, elle pourrait s''écrouler.

De même, le sort n''affecte pas la croissance de la végétation. Les plantes sont transportées par le mouvement du sol.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Terraformage' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Terraformage' AND s.ruleset = '5';

-- Urne magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Urne magique', 6, '1 minute', 0, '["V","S","M"]', 'une gemme, du cristal, un reliquaire et un quelconque récipient ornemental valant au moins 500 po', '{"amount":500,"unit":"po"}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Votre corps sombre dans un état catatonique alors que votre âme le quitte pour se loger dans le récipient employé en tant que composante matérielle. Tant que votre âme demeure dans le récipient, vous êtes conscient de votre environnement comme si vous étiez à la place du récipient. Vous ne pouvez vous déplacer ou réagir. La seule action dont vous disposez est de projeter votre âme jusqu''à 30 mètres hors du récipient, soit pour retourner dans votre corps (et mettre fin au sort), soit pour tenter de posséder le corps d''un humanoïde.

Vous pouvez tenter de posséder un humanoïde visible à 30 mètres ou moins de vous. Les créatures protégées par un sort de *protection contre le mal et le bien* ou un sort de *cercle magique* ne peuvent être possédées. La cible doit réussir un jet de sauvegarde de Charisme, sans quoi votre âme prend place dans le corps de la cible et l''âme de la cible est séquestrée dans le récipient. En cas de réussite, la cible résiste à votre effort de la posséder, et vous ne pouvez pas tenter de la posséder à nouveau pour les 24 prochaines heures.

Lorsque vous prenez possession du corps d''une créature, vous le contrôlez. Vos caractéristiques sont remplacées par celle de la créature. Vous conservez néanmoins votre alignement et votre Intelligence, votre Sagesse et votre Charisme. Vous conservez aussi les bénéfices de vos capacités de classe. Si la cible est dotée de niveaux de classe, vous ne pouvez pas faire usage de ses caractéristiques.

Entre temps, l''âme de la créature possédée peut percevoir à partir du récipient avec ses propres sens, mais elle ne peut se déplacer ni prendre action.

Pendant que vous possédez un corps, vous pouvez utiliser votre action pour que votre âme retourne dans le récipient s''il se trouve à 30 mètres ou moins de vous. Ainsi, l''âme de la créature d''accueil retourne dans son corps. Si le corps d''accueil meurt pendant que vous y êtes, la créature meurt et vous devez réussir un jet de sauvegarde de Charisme contre le DD de sauvegarde de votre sort. Si vous réussissez et que le récipient est à 30 mètres ou moins de vous, vous réintégrez le récipient. Sinon, vous mourrez.

Si le récipient est détruit ou si le sort prend fin, votre âme retourne immédiatement dans votre corps. Si votre corps est à plus de 30 mètres de vous ou si votre corps est mort lorsque vous tentez d''y retourner, vous mourrez. Si l''âme d''une autre créature est dans le récipient au moment où il est détruit, l''âme de la créature retourne à son corps s''il est toujours vivant et à 30 mètres ou moins. Sinon, la créature meurt.

Lorsque le sort prend fin, le récipient se détruit.', 7, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Urne magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Urne magique' AND s.ruleset = '5';

-- Voie végétale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Voie végétale', 6, '1 action', 3, '["V","S"]', NULL, NULL, 0, '1 round', 'round', 1, 0, 'Ce sort crée un lien magique entre une plante inanimée de taille G ou supérieure se trouvant à portée et une autre plante pouvant se trouver n''importe où sur le même plan d''existence. Vous devez avoir déjà vu ou touché au moins une fois la plante de destination. Pour toute la durée du sort, n''importe quelle créature peut pénétrer dans la plante ciblée et en sortir par la plante de destination en utilisant 1,50 mètre de son mouvement.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Voie végétale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Voie végétale' AND s.ruleset = '5';

-- Sorts de niveau 4 du socle (#176 D1) : les 29 sorts PHB / SRD que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_4.ts, gardé par test/nuxt/spellsLevel4Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Assassin imaginaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Assassin imaginaire', 4, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous exploitez les cauchemars d''une créature à portée que vous pouvez voir et créez une illusion de ses plus grandes peurs, visible par elle seule. La cible doit réussir un jet de sauvegarde de Sagesse ; sinon elle est effrayée pendant toute la durée du sort.

À la fin de chacun de ses tours, avant la fin du sort, la cible doit réussir un jet de sauvegarde de Sagesse ou subir 4d10 dégâts psychiques. Si elle réussit, le sort prend fin.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, les dégâts augmentent de 1d10 par niveau d''emplacement au-delà du niveau 4 (soit 5d10 au niveau 5, etc.).', 6, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"4":"4d10","5":"5d10","6":"6d10","7":"7d10","8":"8d10","9":"9d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Assassin imaginaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Assassin imaginaire' AND s.ruleset = '5';

-- Aura de pureté
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura de pureté', 4, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une énergie purificatrice irradie de vous en une aura de 9 mètres de rayon, centrée sur vous et qui suit vos déplacements pendant toute la durée du sort. Chaque créature non hostile présente dans l''aura (vous compris) ne peut pas tomber malade, a la résistance aux dégâts de poison, et a l''avantage aux jets de sauvegarde contre les effets qui causent les états aveuglé, charmé, assourdi, effrayé, paralysé, empoisonné ou étourdi.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura de pureté' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin', 'Clerc') AND c.ruleset = '5'
WHERE s.name = 'Aura de pureté' AND s.ruleset = '5';

-- Aura de vie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura de vie', 4, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une énergie protectrice pour tout ce qui vit irradie de vous en une aura de 9 mètres de rayon, centrée sur vous et qui suit vos déplacements pendant toute la durée du sort. Chaque créature non hostile présente dans l''aura (vous compris) a la résistance aux dégâts nécrotiques, et son maximum de points de vie ne peut pas être réduit. Une créature vivante non hostile tombée à 0 point de vie regagne 1 point de vie au début de son tour si elle se trouve dans l''aura.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura de vie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin', 'Clerc') AND c.ruleset = '5'
WHERE s.name = 'Aura de vie' AND s.ruleset = '5';

-- Bannissement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bannissement', 4, '1 action', 18, '["V","S","M"]', 'un objet désagréable pour la cible', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez d''envoyer dans un autre plan d''existence une créature à portée que vous voyez. La cible doit réussir un jet de sauvegarde de Charisme, sinon elle est bannie.

Si la cible est native de votre plan, elle est placée dans un demi-plan inoffensif où elle est incapable d''agir jusqu''à la fin du sort ; elle réapparaît ensuite à l''endroit quitté ou dans l''espace inoccupé le plus proche. Si elle est native d''un autre plan, elle est renvoyée dans son plan dans une petite détonation. Si le sort prend fin avant une minute, elle réapparaît à l''endroit quitté (ou l''espace libre le plus proche) ; sinon elle ne revient pas.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, vous pouvez cibler une créature supplémentaire par niveau d''emplacement au-delà du niveau 4.', 1, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bannissement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Bannissement' AND s.ruleset = '5';

-- Bouclier de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bouclier de feu', 4, '1 action', 0, '["V","S","M"]', 'un peu de phosphore ou une luciole', NULL, 0, '10 minutes', 'minute', 10, 0, 'De fines flammes vaporeuses entourent votre corps pendant toute la durée du sort : elles émettent une lumière vive dans un rayon de 3 mètres, puis une lumière faible sur 3 mètres supplémentaires. Vous pouvez y mettre fin par une action.

Les flammes forment un bouclier de chaleur ou de froid, à votre choix. Le bouclier de chaleur vous donne la résistance aux dégâts de froid, celui de froid la résistance aux dégâts de feu. De plus, une créature située à 1,5 mètre ou moins de vous qui vous touche avec une attaque au corps à corps subit 2d8 dégâts de feu ou de froid, selon le modèle choisi.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bouclier de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Bouclier de feu' AND s.ruleset = '5';

-- Châtiment débilitant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment débilitant', 4, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature avec une attaque au corps à corps avec une arme pendant la durée du sort, votre arme frappe à la fois son corps et son esprit : elle inflige 4d6 dégâts psychiques supplémentaires. La cible doit réussir un jet de sauvegarde de Sagesse ; en cas d''échec, elle a le désavantage aux jets d''attaque et aux jets de caractéristique, et ne peut pas utiliser de réaction jusqu''à la fin de son prochain tour.', 5, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"4":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment débilitant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment débilitant' AND s.ruleset = '5';

-- Chien de garde de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Chien de garde de Mordenkainen', 4, '1 action', 9, '["V","S","M"]', 'un minuscule sifflet d''argent, un morceau d''os, et un bout de ficelle', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous invoquez un chien de garde fantomatique dans un espace inoccupé visible à portée de 9 mètres. Il reste jusqu''à ce que vous le renvoyiez par une action ou que vous vous éloigniez à plus de 30 mètres de lui.

Le chien est invisible pour toutes les créatures sauf vous, et on ne peut pas lui faire de mal. Il aboie bruyamment si une créature de taille P ou supérieure s''approche à 9 mètres ou moins de lui sans donner le mot de passe que vous avez défini. Il voit les créatures invisibles et le plan éthéré, et ignore les illusions. Au début de chacun de vos tours, il tente de mordre une créature hostile à 1,5 mètre ou moins de lui : son bonus d''attaque égale votre modificateur de caractéristique d''incantation plus votre bonus de maîtrise ; en cas de coup au but, il inflige 4d8 dégâts perforants.', 2, NULL, NULL, NULL, '[{"damage_type":"piercing","damage_at_slot_level":{"4":"4d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Chien de garde de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Chien de garde de Mordenkainen' AND s.ruleset = '5';

-- Coffre secret de Léomund
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Coffre secret de Léomund', 4, '1 action', 1.5, '["V","S","M"]', 'un coffre raffiné de 90 cm x 60 cm x 60 cm, fabriqué à partir de matériaux rares d''une valeur d''au moins 5 000 po, et une réplique de ce coffre en taille TP, dans les mêmes matériaux, d''une valeur d''au moins 50 po', '{"amount":5000,"unit":"po"}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous cachez un coffre et tout son contenu dans le plan éthéré. Vous devez toucher à la fois le coffre et sa réplique miniature, qui sert de composante matérielle. Le coffre peut contenir jusqu''à un tiers de mètre cube de matériel non vivant (90 x 60 x 60 cm).

Tant que le coffre est dans le plan éthéré, une action suffit à toucher la réplique pour le rappeler : il apparaît sur le sol, dans un espace inoccupé à 1,5 mètre de vous au plus. Une action en touchant à la fois le coffre et sa réplique le renvoie dans le plan éthéré. Après 60 jours, chaque jour comporte 5 % de risque, cumulatif, que l''effet prenne fin. L''effet prend fin si vous relancez le sort, si la réplique est détruite, ou si vous y mettez fin par une action. Si l''effet prend fin alors que le grand coffre est toujours dans le plan éthéré, il est perdu à jamais.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Coffre secret de Léomund' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Coffre secret de Léomund' AND s.ruleset = '5';

-- Contrôle de l'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contrôle de l''eau', 4, '1 action', 90, '["V","S","M"]', 'une goutte d''eau et une pincée de sable', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Pendant toute la durée du sort, vous contrôlez toute étendue d''eau libre dans un cube de 30 mètres d''arête que vous choisissez. Par une action à votre tour, vous pouvez répéter le même effet ou en choisir un autre.

Crue : le niveau de toute l''eau de la zone monte de 6 mètres ; si la zone comprend une berge, l''eau se répand sur le sol sec. Dans une grande étendue d''eau, une vague de 6 mètres de haut traverse la zone et se brise ; tout véhicule de taille TG ou inférieure frappé a 25 % de risque de chavirer, et la vague se répète au début de votre tour suivant tant que l''effet dure. Scinder l''eau : une tranchée traverse la zone et forme deux murs d''eau jusqu''à la fin du sort ou un nouvel effet ; l''eau la remplit ensuite lentement jusqu''au tour suivant. Diriger le courant : l''eau de la zone s''écoule dans la direction choisie, même en franchissant obstacles et murs ; hors de la zone, elle reprend le courant du terrain. Tourbillon (étendue d''au moins 15 mètres de large et 7,5 mètres de profondeur) : un vortex de 1,5 mètre de large au pôle inférieur, 15 mètres au pôle supérieur et 7,5 mètres de profondeur. Toute créature ou objet dans l''eau à 7,5 mètres du vortex est attiré de 3 mètres vers lui ; une créature peut nager pour s''en éloigner par un jet de Force (Athlétisme) contre le DD de sauvegarde du sort. Une créature qui entre dans le vortex, ou y commence son tour pour la première fois du tour, fait un jet de sauvegarde de Force : en cas d''échec, elle subit 2d8 dégâts contondants et est happée jusqu''à la fin du sort ; en cas de réussite, elle subit la moitié des dégâts et n''est pas retenue. Une créature happée peut utiliser son action pour tenter de sortir à la nage, avec désavantage au jet de Force (Athlétisme). Un objet qui entre dans le vortex subit 2d8 dégâts contondants la première fois à chaque tour, et de nouveau à chaque tour où il le traverse.', 8, '{"ability":"str","success":"half"}', NULL, '{"shape":"cube","size":30}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"4":"2d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contrôle de l''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Contrôle de l''eau' AND s.ruleset = '5';

-- Divination
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Divination', 4, '1 action', 0, '["V","S","M"]', 'de l''encens et une offrande sacrificielle appropriée à votre religion, valant au moins 25 po, que le sort consomme', '{"amount":25,"unit":"po","consumed":true}', 1, 'Instantanée', 'instant', NULL, 0, 'Votre magie, accompagnée d''une offrande, vous met en contact avec votre dieu ou l''un de ses serviteurs. Vous posez une seule question portant sur un objectif, un événement ou une activité précise pouvant survenir dans les 7 jours. Le MD donne une réponse véridique, qui peut prendre la forme d''une courte phrase, d''un vers cryptique ou d''un présage.

Le sort ne tient pas compte des circonstances susceptibles de changer l''issue, comme l''incantation d''autres sorts ou la perte ou l''arrivée d''un compagnon. Si vous lancez le sort plus d''une fois avant la fin de votre prochain repos long, chaque incantation après la première comporte une probabilité cumulative de 25 % de recevoir une réponse aléatoire ; le MD fait ce jet en secret.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Divination' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Divination' AND s.ruleset = '5';

-- Domination de bête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Domination de bête', 4, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Le sort vise une bête visible à 18 mètres ou moins. Elle doit réussir un jet de sauvegarde de Sagesse, sinon elle est charmée pendant toute la durée du sort. Si vous-même ou une créature amicale de votre camp affrontez la bête visée, elle obtient un avantage à ce jet.

Tant que la bête est charmée et que vous êtes sur le même plan d''existence, un lien télépathique vous unit. Par ce lien, vous transmettez des ordres simples et généraux, sans action à dépenser tant que vous êtes conscient, et la bête fait de son mieux pour obéir ; à défaut de consigne supplémentaire, elle se défend et se protège.

Avec votre action, vous prenez un contrôle total et précis de la bête jusqu''à la fin de votre prochain tour : elle n''accomplit que les actions que vous choisissez. Vous pouvez aussi lui faire utiliser une réaction, en dépensant la vôtre. Chaque fois que la cible subit des dégâts, elle refait un jet de sauvegarde de Sagesse contre votre sort ; une réussite met fin au sort.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5, vous pouvez maintenir la concentration pendant 10 minutes ; avec un emplacement de niveau 6, pendant 1 heure ; avec un emplacement de niveau 7, pendant 8 heures.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Domination de bête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Domination de bête' AND s.ruleset = '5';

-- Fabrication
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fabrication', 4, '10 minutes', 36, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous convertissez des matières premières visibles à 36 mètres ou moins en objets manufacturés faits de cette matière, par exemple un pont de bois à partir d''arbres, une corde à partir d''une parcelle de chanvre, ou des vêtements de lin ou de laine.

L''objet peut être de taille G ou inférieure, c''est-à-dire tenir dans un cube de 3 mètres d''arête ou dans huit cubes de 1,50 mètre d''arête, à condition d''avoir assez de matière première. Si la matière visée est du métal, de la pierre ou tout autre minéral, l''objet est au maximum de taille M (tenant dans un cube de 1,50 mètre d''arête). La qualité de l''objet suit celle de la matière première utilisée.

Ni créatures ni objets magiques ne peuvent être créés ou transmutés. Vous ne pouvez pas non plus créer les objets qui exigent un artisanat poussé, comme bijoux, armes, lunettes ou armures, sauf si vous maîtrisez l''outil d''artisan correspondant.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fabrication' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Fabrication' AND s.ruleset = '5';

-- Façonnage de la pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Façonnage de la pierre', 4, '1 action', 1.5, '["V","S","M"]', 'de l''argile molle, qui devra être travaillée grossièrement dans la forme souhaitée pour l''objet en pierre', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez un objet en pierre de taille M ou P, ou un bloc de pierre d''au plus 1,50 mètre d''arête, et lui donnez la forme de votre choix. Par exemple, vous pouvez transformer un gros rocher en arme, statue ou coffre, ou ouvrir un petit passage à travers un mur de moins de 1,50 mètre d''épaisseur. Vous pouvez aussi façonner une porte de pierre et son encadrement pour pouvoir la fermer.

L''objet créé peut avoir au maximum deux charnières et un verrou ; des mécanismes plus fins sont impossibles.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Façonnage de la pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Façonnage de la pierre' AND s.ruleset = '5';

-- Gardien de la foi
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Gardien de la foi', 4, '1 action', 9, '["V"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Un gardien spectral de taille G apparaît au-dessus d''un espace inoccupé et visible de votre choix, à 9 mètres ou moins de vous, et y flotte pendant 8 heures. Il occupe cet espace : il est flou, sauf une épée étincelante et un bouclier portant le symbole de votre divinité.

Toute créature hostile qui, pour la première fois pendant son tour, se déplace dans un espace à 3 mètres ou moins du gardien doit réussir un jet de sauvegarde de Dextérité : elle subit 20 dégâts radiants en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Le gardien disparaît après avoir infligé 60 dégâts au total.', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"4":"20"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Gardien de la foi' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Gardien de la foi' AND s.ruleset = '5';

-- Insecte géant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Insecte géant', 4, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous transformez, à 9 mètres ou moins, jusqu''à dix mille-pattes, trois araignées, cinq guêpes ou un scorpion en version géante de leur forme naturelle, pour toute la durée du sort : mille-pattes géant, araignée géante, guêpe géante ou scorpion géant.

Chaque créature obéit à vos ordres verbaux ; en combat, elles agissent à votre tour, à chaque round. Le MD possède leurs statistiques et détermine leurs actions et leurs déplacements. Une créature reste géante jusqu''à 0 point de vie, ou jusqu''à ce que vous dépensiez une action pour annuler l''effet sur elle.

Le MD peut autoriser des cibles différentes de celles listées : par exemple, une abeille pourrait prendre les statistiques de la guêpe géante.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Insecte géant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Insecte géant' AND s.ruleset = '5';

-- Invisibilité supérieure
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invisibilité supérieure', 4, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous, ou une créature que vous touchez, devenez invisible jusqu''à la fin du sort. Tout ce que la cible porte ou transporte reste invisible tant que cela demeure sur elle.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invisibilité supérieure' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Invisibilité supérieure' AND s.ruleset = '5';

-- Invocation d'élémentaires mineurs
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation d''élémentaires mineurs', 4, '1 minute', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez des élémentaires qui apparaissent dans un espace inoccupé et visible, à 27 mètres ou moins. Vous choisissez une option : un élémentaire de FP 2 ou moins, deux de FP 1 ou moins, quatre de FP 1/2 ou moins, ou huit de FP 1/4 ou moins.

Un élémentaire invoqué disparaît à 0 point de vie ou à la fin du sort. Ces créatures sont amicales envers vous et vos compagnons ; elles agissent en groupe, avec leur propre initiative, et obéissent à vos ordres verbaux (sans action requise). Sans ordre de votre part, elles se défendent seulement contre les créatures qui leur sont hostiles. Le MD possède leurs statistiques.

**Aux niveaux supérieurs**. Avec certains emplacements supérieurs, vous choisissez l''une des options ci-dessus et davantage de créatures apparaissent : deux fois plus avec un emplacement de niveau 6, et trois fois plus avec un emplacement de niveau 8.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''élémentaires mineurs' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Invocation d''élémentaires mineurs' AND s.ruleset = '5';

-- Invocation d'êtres sylvestres
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation d''êtres sylvestres', 4, '1 action', 18, '["V","S","M"]', 'une baie sacrée par créature invoquée', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez des créatures de type fée qui apparaissent dans un espace inoccupé et visible, à 18 mètres ou moins. Vous choisissez une option : une fée de FP 2 ou moins, deux de FP 1 ou moins, quatre de FP 1/2 ou moins, ou huit de FP 1/4 ou moins.

Une créature invoquée disparaît à 0 point de vie ou à la fin du sort. Ces créatures sont amicales envers vous et vos compagnons ; elles agissent en groupe, avec leur propre initiative, et obéissent à vos ordres verbaux (sans action requise). Sans ordre de votre part, elles se défendent seulement contre les créatures qui leur sont hostiles. Le MD possède leurs statistiques.

**Aux niveaux supérieurs**. Avec des emplacements supérieurs, vous choisissez l''une des options ci-dessus et davantage de créatures apparaissent : deux fois plus avec un emplacement de niveau 6, et trois fois plus avec un emplacement de niveau 8.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''êtres sylvestres' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Invocation d''êtres sylvestres' AND s.ruleset = '5';

-- Liane avide
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Liane avide', 4, '1 action bonus', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous faites surgir du sol une liane dans un emplacement inoccupé de votre choix, visible et à 9 mètres ou moins. Au lancement, vous pouvez la faire fouetter une créature visible située à 9 mètres ou moins d''elle. Cette créature doit réussir un jet de sauvegarde de Dextérité, sinon elle est tirée de 6 mètres en direction de la liane.

Jusqu''à la fin du sort, à chacun de vos tours, vous pouvez utiliser une action bonus pour faire fouetter la même créature ou une autre.', 2, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Liane avide' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Liane avide' AND s.ruleset = '5';

-- Liberté de mouvement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Liberté de mouvement', 4, '1 action', 1.5, '["V","S","M"]', 'une lanière de cuir sanglée autour du bras ou un appendice semblable', NULL, 0, '1 heure', 'hour', 1, 0, 'Vous touchez une créature consentante. Pendant la durée du sort, ses déplacements ne sont pas freinés par un terrain difficile. Ni les sorts ni les autres effets magiques ne peuvent réduire sa vitesse, ni la rendre paralysée ou entravée.

Elle peut dépenser 1,50 mètre de son mouvement pour se dégager d''une contrainte non magique, comme des menottes ou l''étreinte d''une créature. Enfin, un environnement aquatique ne lui impose aucune pénalité de déplacement ni d''attaque.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Liberté de mouvement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Liberté de mouvement' AND s.ruleset = '5';

-- Localisation de créature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Localisation de créature', 4, '1 action', 0, '["V","S","M"]', 'quelques poils de chien de chasse', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous décrivez ou nommez une créature qui vous est familière, et vous percevez la direction de l''endroit où elle se trouve tant qu''elle est à 300 mètres ou moins de vous. Si elle se déplace, vous connaissez la direction de son déplacement.

Le sort peut viser une créature précise que vous connaissez, ou la créature la plus proche d''une espèce donnée (par exemple un humain ou une licorne), à condition d''avoir déjà vu au moins une fois une créature de cette espèce de près, à 9 mètres ou moins. Si la créature visée est sous une autre forme, par exemple sous l''effet de métamorphose, le sort ne la localise pas. Un cours d''eau d''au moins 3 mètres de large coupant le trajet direct vers la créature empêche aussi la localisation.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Localisation de créature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Magicien', 'Paladin', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Localisation de créature' AND s.ruleset = '5';

-- Mur de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de feu', 4, '1 action', 36, '["V","S","M"]', 'un petit morceau de phosphore', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez un mur de flammes sur une surface solide à portée. Il peut être rectiligne, jusqu''à 18 mètres de long, 6 mètres de haut et 30 cm d''épaisseur, ou circulaire, avec 6 mètres de diamètre, 6 mètres de haut et 30 cm d''épaisseur. Il est opaque et persiste pendant toute la durée du sort.

À son apparition, chaque créature dans sa zone effectue un jet de sauvegarde de Dextérité : elle subit 5d8 dégâts de feu en cas d''échec, la moitié en cas de réussite.

Un côté du mur, choisi au moment de l''incantation, inflige 5d8 dégâts de feu à chaque créature qui termine son tour à 3 mètres ou moins de ce côté ou à l''intérieur du mur. Une créature subit les mêmes dégâts lorsqu''elle entre pour la première fois dans le mur pendant un tour, ou lorsqu''elle y termine son tour. L''autre côté n''inflige aucun dégât.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, les dégâts augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 4 (le total passe donc à 6d8 au niveau 5, jusqu''à 10d8 au niveau 9).', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de feu' AND s.ruleset = '5';

-- Peau de pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Peau de pierre', 4, '1 action', 1.5, '["V","S","M"]', 'de la poussière de diamant d''une valeur d''au moins 100 po, que le sort consomme', '{"amount":100,"unit":"po","consumed":true}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une créature consentante et transformez sa chair en un revêtement aussi dur que la pierre. Tant que le sort dure, la cible acquiert une résistance aux dégâts non magiques contondants, perforants et tranchants.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Peau de pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Peau de pierre' AND s.ruleset = '5';

-- Porte dimensionnelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Porte dimensionnelle', 4, '1 action', 150, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous vous téléportez de votre position vers un autre point à portée, où vous arrivez exactement à l''endroit choisi. Ce point peut être un lieu visible, imaginé, ou décrit par une distance et une direction.

Vous pouvez transporter des objets jusqu''à votre capacité de charge, ainsi qu''une créature consentante de votre taille ou plus petite, portant un équipement jusqu''à sa propre capacité de charge. Cette créature doit être à 1,5 mètre ou moins de vous au moment de l''incantation.

Si l''endroit d''arrivée est déjà occupé par un objet ou une créature, vous et la créature qui vous accompagne subissez 4d6 dégâts de force et la téléportation échoue.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Porte dimensionnelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Porte dimensionnelle' AND s.ruleset = '5';

-- Protection contre la mort
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Protection contre la mort', 4, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Vous touchez une créature et lui accordez une protection contre la mort. La première fois que la cible tombe à 0 point de vie à cause de dégâts, elle passe à 1 point de vie à la place et le sort prend fin.

Si le sort est encore actif lorsque la cible subit un effet qui la tuerait instantanément sans infliger de dégâts, cet effet est sans effet sur elle, et le sort prend fin.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Protection contre la mort' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Protection contre la mort' AND s.ruleset = '5';

-- Sanctuaire privé de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sanctuaire privé de Mordenkainen', 4, '10 minutes', 36, '["V","S","M"]', 'une mince feuille de plomb, un morceau de verre opaque, un bout de coton ou d''étoffe, et de la chrysolite réduite en poudre', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous créez à portée une zone magiquement sécurisée, en forme de cube dont l''arête va de 1,5 mètre minimum à 30 mètres maximum. L''effet dure toute la durée du sort, ou jusqu''à ce que vous le dissipiez par une action.

À l''incantation, vous choisissez une ou plusieurs protections : les sons ne traversent pas la limite de la zone ; la limite devient une nappe de fumée noirâtre qui bloque la vision, y compris la vision dans le noir ; les capteurs créés par des sorts de divination ne peuvent ni apparaître dans la zone ni traverser son périmètre ; les créatures dans la zone ne peuvent pas être prises pour cible par des sorts de divination ; rien ne peut se téléporter dans la zone ni en sortir ; le voyage planaire y est bloqué.

Lancer ce sort au même endroit chaque jour pendant un an le rend permanent.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, l''arête du cube peut être augmentée de 30 mètres par niveau d''emplacement au-delà du niveau 4 (un emplacement de niveau 5 permet un cube de 60 mètres d''arête).', 1, NULL, NULL, '{"shape":"cube","size":30}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sanctuaire privé de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sanctuaire privé de Mordenkainen' AND s.ruleset = '5';

-- Sphère résiliente d'Otiluke
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sphère résiliente d''Otiluke', 4, '1 action', 9, '["V","S","M"]', 'un hémisphère de cristal et un hémisphère assorti de gomme arabique', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une sphère de force chatoyante enferme à portée une créature ou un objet de taille G ou inférieure. Une créature non consentante effectue un jet de sauvegarde de Dextérité ; en cas d''échec, elle est emprisonnée pendant toute la durée du sort.

Rien (objet physique, énergie ou effet de sort) ne peut traverser la paroi dans un sens ou dans l''autre, mais une créature à l''intérieur peut respirer normalement. La sphère est immunisée à tous les dégâts ; ce qui est à l''intérieur ne peut être endommagé par une attaque ou un effet venant de l''extérieur, et une créature à l''intérieur ne peut rien endommager à l''extérieur. La sphère n''a pas de poids et est juste assez grande pour contenir ce qu''elle enferme. La créature enfermée peut utiliser son action pour pousser contre la paroi et faire rouler la sphère à la moitié de sa vitesse de déplacement ; d''autres créatures peuvent aussi la pousser. Un sort de désintégration visant la sphère la détruit sans endommager son contenu.', 5, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère résiliente d''Otiluke' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère résiliente d''Otiluke' AND s.ruleset = '5';

-- Tempête de grêle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tempête de grêle', 4, '1 action', 90, '["V","S","M"]', 'une pincée de poussière et quelques gouttes d''eau', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une grêle dure comme la pierre s''abat dans un cylindre de 6 mètres de rayon et 12 mètres de haut, centré sur un point choisi à portée. Chaque créature dans le cylindre effectue un jet de sauvegarde de Dextérité : elle subit 2d8 dégâts contondants et 4d6 dégâts de froid en cas d''échec, la moitié en cas de réussite.

Les grêlons transforment la zone en terrain difficile jusqu''à la fin de votre prochain tour.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, les dégâts contondants augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 4. Les dégâts de froid ne sont pas modifiés.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":6,"height":12}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"4":"2d8","5":"3d8","6":"4d8","7":"5d8","8":"6d8","9":"7d8"}},{"damage_type":"cold","damage_at_slot_level":{"4":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tempête de grêle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Tempête de grêle' AND s.ruleset = '5';

-- Terrain hallucinatoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Terrain hallucinatoire', 4, '10 minutes', 90, '["V","S","M"]', 'un caillou, une brindille et un bout de plante verte', NULL, 0, '24 heures', 'hour', 24, 0, 'Pendant 24 heures, vous faites paraître un terrain dans un cube de 45 mètres d''arête, à portée, comme un autre type de terrain naturel, pour l''ouïe, l''odorat et la vue. Une zone découverte ou une route peut ainsi sembler être un marais, une colline, une crevasse, ou tout autre terrain difficile ou infranchissable. Un étang peut devenir une prairie, un précipice une pente douce, un ravin rocailleux une large route plate. Les structures, équipements et créatures de la zone ne changent pas d''apparence.

Les caractéristiques physiques du terrain restent inchangées : une créature qui y pénètre verra probablement au travers de l''illusion. Si le contact ne permet pas de distinguer l''illusion de la réalité, une créature qui l''examine attentivement peut effectuer un test d''Intelligence (Investigation) contre le DD de sauvegarde du sort pour cesser d''être affectée. Une créature qui sait qu''il s''agit d''une illusion la voit comme une image superposée au terrain réel.', 6, NULL, NULL, '{"shape":"cube","size":45}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Terrain hallucinatoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Terrain hallucinatoire' AND s.ruleset = '5';

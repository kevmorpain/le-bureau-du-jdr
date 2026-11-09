-- Sorts de niveau 4 du socle (#176 D1) : les 29 sorts PHB / SRD que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_4.ts, gardé par test/nuxt/spellsLevel4Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Assassin imaginaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Assassin imaginaire', 4, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous exploitez les cauchemars d''une créature à portée que vous pouvez voir et créez une manifestation illusoire de ses plus grandes peurs, visible uniquement de cette créature. La cible doit effectuer un jet de sauvegarde de Sagesse. Si elle l''échoue, la cible est effrayée pour la durée du sort. À la fin de chacun de ses tours avant que le sort ne prenne fin, la cible doit réussir un jet de sauvegarde de Sagesse ou subir 4d10 dégâts psychiques. En cas de réussite, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, les dégâts sont augmentés de 1d10 pour chaque niveau d''emplacement au-delà du niveau 4.', 6, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"4":"4d10","5":"5d10","6":"6d10","7":"7d10","8":"8d10","9":"9d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Assassin imaginaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Assassin imaginaire' AND s.ruleset = '5';

-- Aura de pureté
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura de pureté', 4, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une énergie purificatrice irradie de vous en une aura de 9 mètres de rayon. Jusqu''à la fin du sort, l''aura, centrée sur vous, se déplace en même temps que vous. Toute créature qui n''est pas hostile et est présente dans l''aura (vous y compris) ne peut pas tomber malade, a la résistance aux dégâts de poison, et a un avantage à ses jets de sauvegarde contre les effets provoquant les états suivants : aveuglé, charmé, assourdi, effrayé, paralysé, empoisonné et étourdi.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura de pureté' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Aura de pureté' AND s.ruleset = '5';

-- Aura de vie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura de vie', 4, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une énergie protégeant tout ce qui vit irradie de vous en une aura de 9 mètres de rayon. Jusqu''à la fin du sort, l''aura, centrée sur vous, se déplace en même temps que vous. Toute créature qui n''est pas hostile et est présente dans l''aura (vous y compris) a la résistance aux dégâts nécrotiques, et son maximum de points de vie ne peut pas être réduit. De plus, une créature vivante, non hostile, étant à 0 point de vie, regagne 1 point de vie lorsqu''elle débute son tour au sein de l''aura.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura de vie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Aura de vie' AND s.ruleset = '5';

-- Bannissement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bannissement', 4, '1 action', 18, '["V","S","M"]', 'un objet désagréable pour la cible', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez d''envoyer dans un autre plan d''existence une créature à portée que vous pouvez voir.

La cible doit réussir un jet de sauvegarde de Charisme sous peine d''être bannie.

Si la cible est native du plan d''existence sur lequel vous êtes, vous bannissez la cible sur un demi-plan non-dangereux. Tant qu''elle s''y trouve, la cible est incapable d''agir. La cible y reste jusqu''à ce que le sort prenne fin, puis elle réapparaît à l''endroit qu''elle a quitté ou dans l''espace inoccupé le plus proche si cet endroit est occupé.

Si la cible est native d''un plan d''existence différent de celui sur lequel vous vous trouvez, la cible est bannie dans une petite détonation, retournant dans son plan d''existence. Si ce sort se termine avant qu''une minute ne se soit écoulée, la cible réapparaît dans l''espace qu''elle a quitté ou dans l''espace inoccupé le plus proche si cet endroit est déjà occupé. Sinon, la cible ne revient pas.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 4.', 1, '{"ability":"cha","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bannissement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Ensorceleur', 'Magicien', 'Occultiste', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Bannissement' AND s.ruleset = '5';

-- Bouclier de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bouclier de feu', 4, '1 action', 0, '["V","S","M"]', 'un peu de phosphore ou une luciole', NULL, 0, '10 minutes', 'minute', 10, 0, 'De fines et vaporeuses flammes cernent votre corps pour la durée du sort, irradiant une lumière vive dans un rayon de 3 mètres et une lumière faible à trois mètres supplémentaires. Vous pouvez mettre fin au sort en utilisant une action pour le faire disparaitre.

Les flammes forment autour de vous un bouclier de chaleur ou de froid, à votre choix. Le bouclier de chaleur vous confère une résistance aux dégâts de froid et celui de froid une résistance aux dégâts de feu.

De plus, si une créature située à 1,50 mètre ou moins de vous vous touche avec une attaque au corps à corps, des flammes jaillissent du bouclier. L''attaquant subit alors 2d8 dégâts de feu ou de froid, selon le modèle choisi.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bouclier de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Bouclier de feu' AND s.ruleset = '5';

-- Châtiment débilitant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment débilitant', 4, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature lors d''une attaque au corps à corps avec une arme pendant la durée du sort, votre arme frappe à la fois le corps et l''esprit de la cible, et lui inflige 4d6 dégâts psychiques supplémentaires. La cible doit effectuer un jet de sauvegarde de Sagesse. En cas d''échec, elle a un désavantage à ses jets d''attaque et à ses jets de caractéristique, et ne peut utiliser de réaction, jusqu''à la fin de son prochain tour.', 5, '{"ability":"wis","success":"none"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"4":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment débilitant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment débilitant' AND s.ruleset = '5';

-- Chien de garde de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Chien de garde de Mordenkainen', 4, '1 action', 9, '["V","S","M"]', 'un minuscule sifflet d''argent, un morceau d''os, et un bout de ficelle', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous invoquez un chien de garde fantomatique dans un espace inoccupé que vous pouvez voir et à portée, où il reste pour la durée du sort, jusqu''à ce que vous le renvoyiez par une action, ou jusqu''à ce que vous vous déplaciez à plus de 30 mètres de lui.

Le chien est invisible pour toutes les créatures, vous excepté, et on ne peut pas lui faire du mal. Lorsqu''une créature de taille P ou supérieure s''approche à 9 mètres ou moins de lui sans donner le mot de passe que vous avez spécifié lorsque vous avez lancé le sort, le chien commence à aboyer bruyamment. Le chien voit les créatures invisibles et peut également voir le plan éthéré. Il ignore les illusions.

Au début de chacun de vos tours, le chien tente de mordre une créature se trouvant à 1,50 mètre ou moins de lui et qui vous est hostile. Le bonus à l''attaque du chien de garde est égal au modificateur de votre caractéristique d''incantation + votre bonus de maîtrise. Si le coup touche, il inflige 4d8 dégâts perforants.', 2, NULL, NULL, NULL, '[{"damage_type":"piercing","damage_at_slot_level":{"4":"4d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Chien de garde de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Chien de garde de Mordenkainen' AND s.ruleset = '5';

-- Coffre secret de Léomund
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Coffre secret de Léomund', 4, '1 action', 1.5, '["V","S","M"]', 'un coffre raffiné de 90 cm x 60 cm x 60 cm, fabriqué à partir de matériaux rares d''une valeur d''au moins 5 000 po, et une réplique de ce coffre en taille TP, dans les mêmes matériaux, d''une valeur d''au moins 50 po', '{"amount":5000,"unit":"po"}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous cachez un coffre, et tout son contenu, dans le plan éthéré. Vous devez toucher le coffre et sa réplique miniature qui vous sert de composante matérielle pour le sort. Le coffre peut contenir jusqu''à un tiers de mètre cube de matériel non-vivant (90 cm x 60 cm x 60 cm).

Tant que le coffre reste dans le plan éthéré, vous pouvez utiliser une action et toucher la réplique pour rappeler le coffre. Il apparaît sur le sol, dans un espace inoccupé, dans un rayon de 1,50 mètre de vous. Vous pouvez renvoyer le coffre dans le plan éthéré en utilisant une action et en touchant à la fois le coffre et sa réplique.

Passé un délai de 60 jours, il y a 5 % de risque par jour (les risques se cumulent de jour en jour) que l''effet du sort prenne fin. L''effet du sort prend fin si vous lancez de nouveau ce sort, si la réplique miniature du coffre est détruite, ou si vous choisissez de mettre un terme au sort par une action. Si le sort prend fin et que la version large du coffre se trouve toujours dans le plan éthéré, il est irrémédiablement perdu.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Coffre secret de Léomund' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Coffre secret de Léomund' AND s.ruleset = '5';

-- Contrôle de l'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contrôle de l''eau', 4, '1 action', 90, '["V","S","M"]', 'une goutte d''eau et une pincée de sable', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Jusqu''à la fin du sort, vous contrôlez toute étendue d''eau libre dans une zone cubique de 30 mètres d''arête de votre choix. Vous pouvez choisir parmi les effets suivants lors de l''incantation du sort. Par une action, durant votre tour, vous pouvez répéter le même effet ou en choisir un nouveau.

**Crue**. Vous provoquez l''augmentation de 6 mètres du niveau de toute l''eau présente dans la zone d''effet. Si la zone d''effet comprend une berge, l''eau se déverse sur le sol sec. Si votre zone d''effet se trouve au sein d''une importante étendue d''eau, vous créez plutôt une vague de 6 mètres de haut qui part d''un côté de la zone d''effet et se déplace jusqu''au côté opposé avant de se briser. Tout véhicule de taille TG ou inférieure frappé par la vague a 25 % de risque de chavirer. Le niveau de l''eau reste élevé jusqu''à la fin du sort ou jusqu''à ce que vous choisissiez un effet différent. Si cet effet produit une vague, la vague se répète au début de votre tour suivant tant que l''effet de Crue est effectif.

**Scinder l''eau**. Vous déplacez l''eau dans la zone de sorte à créer une tranchée. La tranchée s''étend au travers de la zone d''effet du sort, et scinde l''eau en deux, formant un mur de chaque côté. La tranchée reste en place jusqu''à la fin du sort ou jusqu''à ce que vous choisissiez un nouvel effet. L''eau remplit alors lentement la tranchée jusqu''au tour suivant, ramenant l''eau à son niveau normal.

**Diriger le courant**. Vous provoquez un courant dans la zone d''effet qui se dirige dans la direction de votre choix, même si l''eau doit pour cela submerger des obstacles, passer au-dessus des murs, ou prendre d''autres directions improbables. L''eau dans la zone d''effet se déplace dans la direction souhaitée, mais une fois en dehors de la zone d''effet, elle retrouve un courant basé sur les caractéristiques du terrain. L''eau continue à se déplacer dans la direction choisie jusqu''à ce que le sort prenne fin ou que vous choisissiez un nouvel effet.

**Tourbillon**. Cet effet requiert une étendue d''eau large de 15 mètres et profonde de 7,50 mètres minimum. Vous créez un tourbillon qui se forme au centre de la zone d''effet. Le tourbillon produit un vortex large de 1,50 mètre à son pôle inférieur, large de 15 mètres à son pôle supérieur, et profond de 7,50 mètres. Toute créature ou objet dans l''eau à 7,50 mètres du vortex est attiré de 3 mètres vers lui. Une créature peut nager pour s''éloigner du vortex à condition de réussir un jet de Force (Athlétisme) contre le DD de sauvegarde de votre sort.

Lorsqu''une créature entre dans le vortex pour la première fois de son tour ou débute son tour dans le vortex, elle doit effectuer un jet de sauvegarde de Force. En cas d''échec, la créature subit 2d8 dégâts contondants et est happée dans le vortex jusqu''à ce que le sort se termine. En cas de réussite, la créature subit la moitié de ces dégâts et n''est pas prisonnière du vortex. Une créature happée par le vortex peut utiliser son action pour essayer de nager hors du vortex comme décrit précédemment, mais elle subira un désavantage à son jet de Force (Athlétisme).

La première fois, à chaque tour, qu''un objet entre dans le vortex, l''objet subit 2d8 dégâts contondants ; ces dégâts sont de nouveau infligés à chaque tour que l''objet passe dans le vortex.', 8, '{"ability":"str","success":"half"}', NULL, '{"shape":"cube","size":30}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"4":"2d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contrôle de l''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Contrôle de l''eau' AND s.ruleset = '5';

-- Divination
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Divination', 4, '1 action', 0, '["V","S","M"]', 'de l''encens et une offrande sacrificielle appropriée à votre religion, valant au moins 25 po, que le sort consomme', '{"amount":25,"unit":"po","consumed":true}', 1, 'Instantanée', 'instant', NULL, 0, 'Votre magie accompagnée d''une offrande vous met en contact avec votre dieu ou un de ses serviteurs. Vous posez une seule question en vue d''un objectif, d''un événement ou d''une activité spécifique qui pourrait se produire dans les 7 jours. Le MD donne une réponse véridique. La réponse peut prendre la forme d''une courte phrase, d''un vers cryptique ou d''un présage.

Le sort ne considère pas les circonstances qui pourraient changer l''issue de la divination, comme l''incantation additionnelle de sorts ou la perte ou le gain d''un nouveau compagnon.

Si vous incantez le sort plus d''une fois avant la fin de votre prochain repos long, il y a une probabilité cumulative de 25 % de recevoir une réponse aléatoire, et ce, pour chaque incantation après la première. Le MD fait ce jet en secret.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Divination' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Divination' AND s.ruleset = '5';

-- Domination de bête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Domination de bête', 4, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez d''envoûter une bête à portée que vous pouvez voir. Elle doit réussir un jet de sauvegarde de Sagesse ou être charmée pour la durée du sort. Si vous, ou une autre créature qui vous est amicale, êtes en combat avec la bête ciblée, elle obtient un avantage à son jet de sauvegarde.

Tant que la bête est charmée et que vous vous trouvez dans le même plan d''existence, vous établissez une connexion télépathique avec elle. Vous pouvez utiliser ce lien télépathique pour transmettre des ordres à la créature tant que vous êtes conscient (aucune action requise), et la créature fera de son mieux pour vous obéir. Vous pouvez spécifier une action simple et générale telle que « Attaque cette créature », « Viens ici » ou « Rapporte cet objet ». Si la créature accomplit l''ordre donné et ne reçoit pas d''autres directives de votre part, elle se défend et se protège du mieux de ses capacités.

Vous pouvez utiliser votre action pour prendre un contrôle total et précis de la cible. Jusqu''à la fin de votre prochain tour, la créature n''effectue que les actions que vous choisissez, et ne fait rien que vous ne lui ayez autorisé. Durant ce moment, vous pouvez également forcer la créature à utiliser une réaction, mais pour cela vous devez dépenser votre réaction. À chaque fois que la cible subit des dégâts, elle doit effectuer un jet de sauvegarde de Sagesse contre votre sort. Si le jet de sauvegarde réussit, le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5, vous pouvez maintenir votre concentration sur ce sort pendant 10 minutes. Lorsque vous utilisez un emplacement de sort de niveau 6, vous pouvez maintenir votre concentration sur ce sort pendant 1 heure. Et en utilisant un emplacement de sort de niveau 7, vous pouvez maintenir votre concentration pendant 8 heures.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Domination de bête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Domination de bête' AND s.ruleset = '5';

-- Fabrication
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fabrication', 4, '10 minutes', 36, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous convertissez des matériaux bruts en objets confectionnés avec ces matières. Par exemple, vous pouvez fabriquer un pont en bois avec quelques arbres, une corde à partir d''une parcelle de chanvre, et des vêtements avec du lin ou de la laine.

Choisissez des matériaux bruts que vous pouvez voir et à portée. Vous pouvez fabriquer un objet de taille G ou inférieure (pouvant tenir dans un cube de 3 mètres d''arête, ou dans huit cubes de 1,50 mètre d''arête), à condition que vous utilisiez suffisamment de matière première. Si vous utilisez ce sort en ciblant du métal, de la pierre, ou tout autre substance minérale, l''objet fabriqué est, au maximum, de taille M (pouvant tenir dans un cube de 1,50 mètre d''arête). La qualité des objets créés par ce sort correspond à la qualité des matières premières utilisées.

Les créatures et les objets magiques ne peuvent pas être créés ou transmutés grâce à ce sort. Vous ne pouvez pas non plus utiliser ce sort pour créer des objets qui nécessitent d''ordinaire un haut niveau d''artisanat, comme des bijoux, des armes, des lunettes, ou des armures, à moins que vous n''ayez la maîtrise du type d''outils d''artisans en rapport avec l''objet que vous comptez fabriquer.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fabrication' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Fabrication' AND s.ruleset = '5';

-- Façonnage de la pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Façonnage de la pierre', 4, '1 action', 1.5, '["V","S","M"]', 'de l''argile molle, qui devra être travaillée grossièrement dans la forme souhaitée pour l''objet en pierre', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez un objet en pierre de taille M ou P ou un bloc de pierre d''un maximum de 1,50 mètre d''arête et vous lui donnez n''importe quelle forme qui vous convient. Par exemple, vous pouvez transformer un gros rocher en arme, statue ou coffre, ou réaliser un petit passage à travers un mur, tant que le mur fait moins de 1,50 mètre d''épaisseur. Vous pouvez aussi façonner une porte de pierre et son encadrement pour pouvoir la fermer. L''objet que vous créez peut avoir un maximum de deux charnières et un verrou mais des détails mécaniques plus fins sont impossibles.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Façonnage de la pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Façonnage de la pierre' AND s.ruleset = '5';

-- Gardien de la foi
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Gardien de la foi', 4, '1 action', 9, '["V"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Un gardien spectral de taille G apparait et flotte au-dessus d''un espace de votre choix, inoccupé et visible, dans la portée et pour la durée du sort. Le gardien occupe cet espace et il est flou à l''exception d''une épée étincelante et d''un bouclier montrant le symbole de votre divinité.

Toute créature vous étant hostile qui se déplace pour la première fois lors de son tour dans un espace à 3 mètres ou moins du gardien doit effectuer un jet de sauvegarde de Dextérité, subissant 20 dégâts radiants en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Le gardien se volatilise après avoir infligé un total de 60 dégâts.', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"4":"20"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Gardien de la foi' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Gardien de la foi' AND s.ruleset = '5';

-- Insecte géant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Insecte géant', 4, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous transformez jusqu''à dix mille-pattes, trois araignées, cinq guêpes, ou un scorpion, à portée, en version géante de leur forme naturelle pour toute la durée du sort. Un mille-pattes devient un mille-pattes géant, une araignée devient une araignée géante, une guêpe devient une guêpe géante, et un scorpion devient un scorpion géant.

Chaque créature obéit à vos ordres verbaux et, en combat, à chaque round, elles agissent à votre tour. Le MD possède les statistiques de ces créatures et détermine leurs actions et déplacements.

Une créature reste à sa taille géante pour la durée du sort, jusqu''à ce qu''elle tombe à 0 point de vie, ou jusqu''à ce que vous utilisiez une action pour annuler l''effet sur elle.

Le MD peut vous autoriser à choisir des cibles différentes de celles présentées ci-dessus. Par exemple, si vous transformez une abeille, sa version géante pourrait avoir les mêmes statistiques que la guêpe géante.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Insecte géant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Insecte géant' AND s.ruleset = '5';

-- Invisibilité supérieure
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invisibilité supérieure', 4, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous ou une créature que vous touchez devenez invisible jusqu''à la fin de la durée du sort. Tout ce que porte ou transporte la cible est invisible tant que ça demeure sur sa personne.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invisibilité supérieure' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Invisibilité supérieure' AND s.ruleset = '5';

-- Invocation d'élémentaires mineurs
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation d''élémentaires mineurs', 4, '1 minute', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez les élémentaires qui apparaissent dans un espace inoccupé à portée, que vous pouvez voir. Vous choisissez l''une des options d''apparition suivantes :

- Un élémentaire de FP 2 ou inférieur
- Deux élémentaires de FP 1 ou inférieur
- Quatre élémentaires de FP 1/2 ou inférieur
- Huit élémentaires de FP 1/4 ou inférieur

Un élémentaire invoqué par ce sort disparaît lorsqu''il tombe à 0 point de vie ou lorsque le sort prend fin.

Les créatures invoquées ont une attitude amicale envers vous et vos compagnons. Lancez l''initiative pour le groupe de créatures invoquées ; il a ses propres tours de jeu. Elles obéissent aux ordres verbaux que vous leur donnez (aucune action requise). Si vous ne leur donnez aucun ordre, elles ne font que se défendre contre les créatures qui leur sont hostiles. Le MD possède les statistiques des créatures.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant certains niveaux d''emplacements de sorts supérieurs, vous choisissez l''une des options d''invocations ci-dessus, et un nombre plus important de créatures apparaîtra ; deux fois plus avec un emplacement de sort de niveau 6 et trois fois plus avec un emplacement de sort de niveau 8.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''élémentaires mineurs' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Invocation d''élémentaires mineurs' AND s.ruleset = '5';

-- Invocation d'êtres sylvestres
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation d''êtres sylvestres', 4, '1 action', 18, '["V","S","M"]', 'une baie sacrée par créature invoquée', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez des créatures de type fée qui apparaissent dans un espace inoccupé que vous pouvez voir et à portée. Choisissez l''une des options d''invocation suivantes :

- Une fée de FP 2 ou inférieur
- Deux fées de FP 1 ou inférieur
- Quatre fées de FP 1/2 ou inférieur
- Huit fées de FP 1/4 ou inférieur

Une créature invoquée disparaît lorsqu''elle tombe à 0 point de vie ou lorsque le sort se termine.

Les créatures invoquées ont une attitude amicale envers vous et vos compagnons. Lancez l''initiative pour le groupe de créatures invoquées ; il a ses propres tours de jeu. Elles obéissent aux ordres verbaux que vous leur donnez (aucune action requise). Si vous ne leur donnez aucun ordre, elles ne font que se défendre contre les créatures qui leur sont hostiles. Le MD possède les statistiques des créatures.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant des niveaux d''emplacements de sorts supérieurs, vous choisissez l''une des options d''invocation ci-dessus, et un nombre plus important de créatures apparaîtra ; deux fois plus avec un emplacement de sort de niveau 6 et trois fois plus avec un emplacement de sort de niveau 8.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''êtres sylvestres' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Invocation d''êtres sylvestres' AND s.ruleset = '5';

-- Liane avide
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Liane avide', 4, '1 action bonus', 9, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous invoquez une liane qui surgit du sol dans un emplacement inoccupé de votre choix, que vous pouvez voir et qui est à portée. Lorsque vous lancez ce sort, vous pouvez faire en sorte que la liane fouette une créature située à 9 mètres ou moins d''elle et que vous pouvez voir. La créature doit réussir un jet de sauvegarde de Dextérité sous peine d''être tirée de 6 mètres en direction de la liane.

Jusqu''à ce que le sort prenne fin, vous pouvez diriger la liane pour qu''elle fouette la même créature, ou une autre créature, par une action bonus à chacun de vos tours.', 2, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Liane avide' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Liane avide' AND s.ruleset = '5';

-- Liberté de mouvement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Liberté de mouvement', 4, '1 action', 1.5, '["V","S","M"]', 'une lanière de cuir sanglée autour du bras ou un appendice semblable', NULL, 0, '1 heure', 'hour', 1, 0, 'Vous touchez une créature consentante. Pour la durée du sort, les mouvements de la cible ne sont pas limités par un terrain difficile. Les sorts et autres effets magiques ne peuvent ni réduire la vitesse de la cible ni la rendre paralysée ou entravée.

La cible peut aussi dépenser 1,50 mètre de son mouvement pour se dégager d''une contrainte non magique, comme des menottes ou l''étreinte d''une créature. Enfin, l''environnement aquatique n''impose aucune pénalité sur les mouvements et les attaques de la cible.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Liberté de mouvement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Liberté de mouvement' AND s.ruleset = '5';

-- Localisation de créature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Localisation de créature', 4, '1 action', 0, '["V","S","M"]', 'quelques poils de chien de chasse', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Décrivez ou nommez une créature qui vous est familière. Vous percevez la direction vers le lieu où se situe la créature aussi longtemps qu''elle est à 300 mètres ou moins de vous. Si la créature se déplace, vous connaissez la direction de son déplacement.

Le sort peut localiser une créature spécifique que vous connaissez ou la plus proche créature d''une espèce particulière (comme un humain ou une licorne), à condition d''avoir déjà vu au moins une fois cette créature de près (à 9 mètres ou moins). Si la créature décrite ou nommée est dans une autre forme, en étant sous l''effet du sort *métamorphose* notamment, le sort ne localise pas la créature.

Ce sort ne peut localiser une créature si un cours d''eau d''au moins 3 mètres de large fait obstacle à un trajet direct entre vous et la créature.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Localisation de créature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Magicien', 'Paladin', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Localisation de créature' AND s.ruleset = '5';

-- Mur de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de feu', 4, '1 action', 36, '["V","S","M"]', 'un petit morceau de phosphore', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez un mur de flammes sur une surface solide dans la portée du sort. Vous pouvez façonner le mur jusqu''à 18 mètres de longueur, 6 mètres de hauteur et 30 cm d''épaisseur. Vous pouvez également en faire un mur circulaire de 6 mètres de diamètre, 6 mètres de hauteur et 30 cm d''épaisseur. Le mur est opaque et persiste pour la durée du sort.

Lorsque le mur apparaît, chaque créature dans la zone doit effectuer un jet de sauvegarde de Dextérité, subissant 5d8 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Un côté du mur, que vous déterminez lors de l''incantation du sort, inflige 5d8 dégâts de feu à chaque créature qui termine son tour à 3 mètres ou moins de ce côté ou à l''intérieur du mur. Une créature subit les mêmes dégâts lorsqu''elle pénètre dans le mur pour la première fois lors d''un tour ou lorsqu''elle y termine son tour.

L''autre côté du mur n''inflige aucun dégât.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, les dégâts du sort augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 4.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur de feu' AND s.ruleset = '5';

-- Peau de pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Peau de pierre', 4, '1 action', 1.5, '["V","S","M"]', 'de la poussière de diamant d''une valeur d''au moins 100 po, que le sort consomme', '{"amount":100,"unit":"po","consumed":true}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Ce sort transforme la chair d''une créature consentante que vous touchez en un revêtement aussi dur que la pierre. Jusqu''à ce que le sort se termine, la cible obtient la résistante aux dégâts non magiques contondants, perforants et tranchants.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Peau de pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Peau de pierre' AND s.ruleset = '5';

-- Porte dimensionnelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Porte dimensionnelle', 4, '1 action', 150, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous vous téléportez de votre position actuelle vers un autre endroit dans la portée du sort. Vous arrivez exactement à l''endroit désiré. Ce peut être un lieu que vous voyez, que vous visualisez ou que vous pouvez décrire en énonçant une distance et une direction, comme « 60 mètres droit devant » ou « vers le haut, à 45 degrés sur 90 mètres ».

Vous pouvez transporter des objets tant que leurs poids ne dépassent pas votre capacité de chargement. Vous pouvez aussi emmener une créature consentante de votre taille ou plus petite, qui porte de l''équipement jusqu''à sa capacité de chargement. La créature doit être à 1,50 mètre ou moins de vous lorsque vous lancez ce sort.

Si vous devriez arriver à un endroit déjà occupé par un objet ou une créature, vous et la créature se déplaçant avec vous subissez 4d6 dégâts de force et la téléportation échoue.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Porte dimensionnelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Porte dimensionnelle' AND s.ruleset = '5';

-- Protection contre la mort
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Protection contre la mort', 4, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, '8 heures', 'hour', 8, 0, 'Vous touchez une créature et vous lui octroyez une mesure de protection contre la mort.

La première fois que la cible atteint 0 point de vie à cause de dégâts reçus, la cible passe à 1 point de vie et le sort prend fin.

Si le sort est toujours actif lorsque la cible est victime d''un effet qui la tuerait instantanément sans causer de dégât, cet effet est nul pour la cible, et le sort prend fin.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Protection contre la mort' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Protection contre la mort' AND s.ruleset = '5';

-- Sanctuaire privé de Mordenkainen
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sanctuaire privé de Mordenkainen', 4, '10 minutes', 36, '["V","S","M"]', 'une mince feuille de plomb, un morceau de verre opaque, un bout de coton ou d''étoffe, et de la chrysolite réduite en poudre', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous créez, à portée, une zone sécurisée magiquement. La zone est un cube de 1,50 mètre d''arête minimum à 30 mètres d''arête maximum. L''effet reste actif pour toute la durée du sort ou jusqu''à ce que vous le dissipiez en utilisant une action.

Lorsque vous lancez ce sort, vous décidez quelle sorte de sécurité il confère en choisissant une ou plusieurs options parmi les suivantes :

- Les sons ne peuvent pas traverser la barrière située à la limite de la zone d''effet du sort.
- La barrière de la zone d''effet est matérialisée en une nappe de fumée noirâtre, bloquant ainsi la vision (y compris la vision dans le noir) au travers.
- Les capteurs ou détecteurs créés par des sorts de divination ne peuvent pas apparaître à l''intérieur de la zone protégée ou passer au travers de la barrière située à son périmètre.
- Les créatures dans la zone ne peuvent pas être la cible de sorts de divination.
- Rien ne peut se téléporter à l''intérieur de la zone protégée, pour y entrer ou pour en sortir.
- Le voyage planaire est bloqué dans l''enceinte de la zone protégée.

Lancer ce sort au même endroit, tous les jours pendant un an, rend son effet permanent.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, vous pouvez augmenter la taille du cube de 30 mètres pour chaque niveau d''emplacement au-delà du niveau 4. Ainsi vous pourriez protéger un cube de 60 mètres d''arête en utilisant un emplacement de sort de niveau 5.', 1, NULL, NULL, '{"shape":"cube","size":30}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sanctuaire privé de Mordenkainen' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sanctuaire privé de Mordenkainen' AND s.ruleset = '5';

-- Sphère résiliente d'Otiluke
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sphère résiliente d''Otiluke', 4, '1 action', 9, '["V","S","M"]', 'un hémisphère de cristal et un hémisphère assorti de gomme arabique', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une chatoyante sphère de force cloître une créature ou un objet de taille G ou inférieure à portée. Une créature non-consentante doit effectuer un jet de sauvegarde de Dextérité. En cas d''échec, la créature est emprisonnée pour la durée du sort.

Rien (que ce soit un objet physique, de l''énergie, ou les effets d''un sort) ne peut passer au travers de la barrière, pour en sortir ou pour y entrer, cependant une créature dans la sphère peut respirer normalement. La sphère est immunisée à tous les dégâts, et une créature ou objet présent dans la sphère ne peut pas être endommagé par une attaque ou un effet provenant de l''extérieur, de même, une créature à l''intérieur de la sphère ne peut pas faire de dommage à l''extérieur.

La sphère n''a pas de poids et est tout juste assez large pour contenir la créature ou l''objet qu''elle emprisonne. Une créature cloîtrée peut utiliser son action pour pousser contre la paroi de la sphère et ainsi faire rouler la sphère de la moitié de sa vitesse de déplacement. De la même manière, le globe peut être poussé et ainsi déplacé par les autres créatures.

Un sort de *désintégration* ciblant le globe le détruit sans rien endommager de ce qu''il contient.', 5, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère résiliente d''Otiluke' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère résiliente d''Otiluke' AND s.ruleset = '5';

-- Tempête de grêle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tempête de grêle', 4, '1 action', 90, '["V","S","M"]', 'une pincée de poussière et quelques gouttes d''eau', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une pluie de grêle dure comme la pierre tombe au sol dans un cylindre de 6 mètres de rayon et de 12 mètres de haut centré sur le point choisi à l''intérieur de la portée du sort. Chaque créature dans le cylindre doit faire un jet de sauvegarde de Dextérité. Une créature subit 2d8 dégâts contondants et 4d6 dégâts de froid en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Les grêlons transforment la zone d''effet de la tempête en un terrain difficile jusqu''à la fin de votre prochain tour.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, les dégâts contondants augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 4.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":6,"height":12}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"4":"2d8","5":"3d8","6":"4d8","7":"5d8","8":"6d8","9":"7d8"}},{"damage_type":"cold","damage_at_slot_level":{"4":"4d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tempête de grêle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Tempête de grêle' AND s.ruleset = '5';

-- Terrain hallucinatoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Terrain hallucinatoire', 4, '10 minutes', 90, '["V","S","M"]', 'un caillou, une brindille et un bout de plante verte', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous faites en sorte qu''un terrain dans un cube de 45 mètres d''arête, à portée, paraisse (d''un point de vue auditif, olfactif et visuel) être d''un autre type de terrain naturel. Ainsi, un terrain à ciel ouvert ou une route peut ressembler à un marais, une colline, une crevasse, ou n''importe quel autre terrain difficile ou insurmontable. Un étang peut être illusoirement converti en prairie d''herbe verte, un précipice peut ressembler à une pente douce, et un ravin rocailleux peut prendre l''allure d''une large route plate. Les structures manufacturées, les équipements et les créatures dans la zone ne voient pas leur apparence changer.

Les caractéristiques palpables du terrain ne sont pas modifiées, ce qui fait que les créatures qui pénètrent dans la zone voient probablement au travers de l''illusion. Si la différence entre l''illusion et la réalité n''est pas évidente par le contact, une créature qui examine attentivement l''illusion peut tenter un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort pour ne plus en être affectée. Une créature qui comprend que l''illusion en est une, la voit comme une vague image superposée au terrain réel.', 6, NULL, NULL, '{"shape":"cube","size":45}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Terrain hallucinatoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Terrain hallucinatoire' AND s.ruleset = '5';

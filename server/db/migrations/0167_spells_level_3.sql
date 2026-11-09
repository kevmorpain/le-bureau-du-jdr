-- Sorts de niveau 3 du socle (#176 D1) : les 26 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_3.ts, gardé par test/nuxt/spellsLevel3Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Animation des morts
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Animation des morts', 3, '1 minute', 3, '["V","S","M"]', 'une goutte de sang, un morceau de chair et une pincée de poussière d''os', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Ce sort crée un serviteur mort-vivant. Choisissez un tas d''ossements ou le cadavre d''un humanoïde de taille M ou P dans la portée du sort. Votre sort insuffle un semblant de vie à la cible pour la relever en tant que créature morte-vivante. La cible devient un squelette si vous avez choisi des ossements, ou un zombi si vous avez choisi un cadavre.

À chacun de vos tours, vous pouvez utiliser une action bonus pour commander mentalement les créatures que vous avez animées avec ce sort si elles sont à 18 mètres ou moins de vous. Si vous contrôlez plusieurs créatures, vous commandez simultanément autant de créatures que vous le souhaitez en donnant le même ordre à chacune d''elles. Vous décidez de l''action prise par la créature et du mouvement qu''elle fait. Vous pouvez aussi émettre une consigne générale, comme monter la garde devant une pièce ou dans un couloir. Si vous ne donnez aucun ordre, la créature ne fait que se défendre contre les créatures qui lui sont hostiles. Une fois qu''un ordre est donné, la créature s''exécute jusqu''à ce que la tâche soit complétée.

La créature est sous votre contrôle pour une période de 24 heures, à la fin de quoi elle cesse d''obéir à votre commandement. Pour maintenir le contrôle de la créature pour 24 heures supplémentaires, vous devez incanter ce sort sur la créature avant la fin de la période actuelle de 24 heures. L''usage de ce sort réaffirme votre contrôle sur 4 créatures ou moins animées par ce sort, plutôt que d''en animer une nouvelle.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, vous animez ou réaffirmez votre contrôle sur deux créatures mortes-vivantes additionnelles pour chaque niveau d''emplacement au-delà du niveau 3. Chaque créature doit provenir d''un cadavre ou d''un tas d''ossements différent.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Animation des morts' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Animation des morts' AND s.ruleset = '5';

-- Appel de la foudre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Appel de la foudre', 3, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Un nuage d''orage prend la forme d''un cylindre de 3 mètres de hauteur et d''un rayon de 18 mètres centré sur un point visible à portée au-dessus de vous. Le sort échoue si vous ne pouvez voir un point en l''air là où le nuage devrait apparaître (par exemple, si vous vous trouvez dans une pièce trop petite pour accueillir le nuage).

Lorsque vous incantez le sort, choisissez un point visible sous le nuage. Un éclair jaillit du nuage jusqu''au point choisi. Chaque créature à 1,50 mètre ou moins de ce point doit effectuer un jet de sauvegarde de Dextérité, subissant 3d10 dégâts de foudre en cas d''échec, ou la moitié de ces dégâts en cas de réussite. À chacun de vos tours, jusqu''à la fin du sort, vous pouvez utiliser votre action pour appeler la foudre de cette manière, en ciblant le même point ou un nouveau.

Si vous êtes en extérieur et dans des conditions orageuses lors de l''incantation de ce sort, le sort vous permet de contrôler l''orage plutôt que d''en créer un nouveau. Dans ces conditions, les dégâts du sort augmentent de 1d10.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, les dégâts augmentent de 1d10 pour chaque niveau d''emplacement au-delà du niveau 3.', 2, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":18,"height":3}', '[{"damage_type":"lightning","damage_at_slot_level":{"3":"3d10","4":"4d10","5":"5d10","6":"6d10","7":"7d10","8":"8d10","9":"9d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Appel de la foudre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Appel de la foudre' AND s.ruleset = '5';

-- Arme élémentaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Arme élémentaire', 3, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Une arme non magique que vous touchez devient une arme magique. Choisissez l''un des types de dégâts suivants : acide, froid, feu, foudre ou tonnerre. Pour la durée du sort, l''arme obtient un bonus de +1 aux jets d''attaque et inflige 1d4 dégâts supplémentaires, du type que vous avez choisi, lorsqu''elle touche.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou 6, le bonus aux jets d''attaque monte à +2 et les dégâts supplémentaires montent à 2d4. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 7 ou supérieur, le bonus monte à +3 et les dégâts supplémentaires à 3d4.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Arme élémentaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Arme élémentaire' AND s.ruleset = '5';

-- Aura de vitalité
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura de vitalité', 3, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une énergie régénératrice irradie de vous en une aura de 9 mètres de rayon. Jusqu''à la fin du sort, l''aura, centrée sur vous, se déplace en même temps que vous. Vous pouvez utiliser une action bonus pour qu''une créature présente dans l''aura (vous y compris) récupère 2d6 points de vie.', 5, NULL, NULL, '{"shape":"emanation","size":9}', NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"3":"2d6"}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura de vitalité' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Aura de vitalité' AND s.ruleset = '5';

-- Aura du croisé
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura du croisé', 3, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un pouvoir sacré irradie de vous sous la forme d''une aura de 9 mètres de rayon, réveillant la hardiesse des créatures amicales. Jusqu''à la fin du sort, l''aura se déplace en même temps que vous, centrée sur vous. Toute créature dans l''aura qui ne vous est pas hostile (y compris vous-même) inflige 1d4 dégâts radiants supplémentaires lorsqu''elle touche avec une attaque avec une arme.', 5, NULL, NULL, '{"shape":"emanation","size":9}', '[{"damage_type":"radiant","damage_at_slot_level":{"3":"1d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura du croisé' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Aura du croisé' AND s.ruleset = '5';

-- Châtiment aveuglant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment aveuglant', 3, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature avec une attaque au corps à corps avec une arme durant la durée du sort, votre arme rayonne d''une vive lumière, et l''attaque inflige à la cible 3d8 dégâts radiants supplémentaires. De plus, la cible doit réussir un jet de sauvegarde de Constitution sous peine d''être aveuglée jusqu''à la fin du sort.

Une créature aveuglée par ce sort effectue un nouveau jet de sauvegarde de Constitution à la fin de chacun de ses tours. Sur un jet de sauvegarde réussi, elle n''est plus aveuglée.', 5, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"3":"3d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment aveuglant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment aveuglant' AND s.ruleset = '5';

-- Clignotement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Clignotement', 3, '1 action', 0, '["V","S"]', NULL, NULL, 0, '1 minute', 'minute', 1, 0, 'Lancez un d20 à la fin de chacun de vos tours pour toute la durée du sort. Si le résultat du jet est 11 ou plus, vous disparaissez du plan d''existence actuel et apparaissez dans le plan éthéré (le sort échoue mais l''emplacement de sort est dépensé si vous vous trouvez déjà dans le plan éthéré). Au début de votre prochain tour, ou lorsque le sort prend fin si vous êtes dans le plan éthéré, vous retournez dans un espace inoccupé de votre choix que vous pouvez voir et situé à 3 mètres maximum de l''endroit où vous avez disparu. S''il n''y a aucun espace inoccupé de disponible à portée, vous apparaissez dans l''espace inoccupé le plus proche (choisi aléatoirement si plus d''un espace inoccupé remplissant les conditions est disponible). Vous pouvez annuler ce sort par une action.

Lorsque vous êtes dans le plan éthéré, vous pouvez voir et entendre le plan dont vous êtes originaire, qui apparaît en nuances de gris, mais vous ne pouvez voir à plus de 18 mètres. Vous ne pouvez affecter et être affecté que par d''autres créatures du plan éthéré. Les créatures qui n''y sont pas ne peuvent ni vous percevoir ni interagir avec vous, à moins qu''une capacité le leur permette.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Clignotement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Clignotement' AND s.ruleset = '5';

-- Communication avec les plantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Communication avec les plantes', 3, '1 action', 0, '["V","S"]', NULL, NULL, 0, '10 minutes', 'minute', 10, 0, 'Vous procurez aux plantes dans un rayon de 9 mètres autour de vous une sensibilité et une animation limitée, leur donnant la capacité de communiquer avec vous et suivre vos ordres simples. Vous pouvez interroger les plantes sur des événements récents qui se sont déroulés dans la zone du sort et récupérer ainsi des informations concernant les créatures qui sont passées par là, les conditions météorologiques ou d''autres situations.

Vous pouvez également transformer un terrain difficile, causé par la croissance des plantes (comme des taillis ou des sous-bois), en un terrain ordinaire pour la durée du sort. Ou vous pouvez transformer un terrain ordinaire où des plantes sont présentes, en terrain difficile pour la durée du sort, créant des plantes rampantes ou des branches afin d''entraver des poursuivants, par exemple.

Les plantes devraient pouvoir réaliser d''autres tâches pour vous, à la discrétion du MD. Le sort ne permet pas aux plantes de se déraciner pour se déplacer, mais elles peuvent bouger librement leurs branches, vrilles et tiges.

Si une créature végétale se situe dans la zone, vous pouvez communiquer avec elle, comme si vous parliez un langage commun, mais vous ne gagnez aucune capacité magique pour l''influencer.

Ce sort peut obliger les plantes créées par le sort *enchevêtrement* à relâcher une créature entravée.', 8, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Communication avec les plantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Communication avec les plantes' AND s.ruleset = '5';

-- Contresort
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Contresort', 3, '1 réaction', 18, '["S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, '**Temps d''incantation** : 1 réaction, que vous prenez lorsque vous voyez une créature à 18 mètres ou moins qui incante un sort.

Vous tentez d''interrompre une créature au moment où elle incante un sort. Si la créature incante un sort de niveau 3 ou inférieur, son sort échoue et il n''a aucun effet. Si elle incante un sort de niveau 4 ou supérieur, effectuez un jet de caractéristique selon celle qui sert à lancer vos sorts. Le DD est de 10 + le niveau du sort. En cas de réussite, le sort de la créature échoue et il n''a aucun effet.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, le sort interrompu n''a aucun effet si son niveau est inférieur ou égal à celui du niveau de l''emplacement de sort utilisé.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Contresort' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Contresort' AND s.ruleset = '5';

-- Création de nourriture et d'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Création de nourriture et d''eau', 3, '1 action', 9, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous créez 22,5 kg de nourriture et 120 litres d''eau sur le sol ou dans des contenants, à portée, ce qui est assez pour subvenir aux besoins de quinze humanoïdes ou de cinq montures pour 24 heures. La nourriture est fade mais nourrissante, et se gâte si elle n''est pas mangée au-delà de 24 heures. L''eau est claire et ne croupit pas.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Création de nourriture et d''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Création de nourriture et d''eau' AND s.ruleset = '5';

-- Croissance végétale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Croissance végétale', 3, '1 action ou 8 heures', 45, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Ce sort canalise une force vitale vers les plantes présentes dans une zone spécifique. Il y a deux usages possibles du sort. L''un procure des bénéfices immédiats alors que l''autre s''étale sur un plus long terme.

Si vous lancez ce sort en utilisant 1 action, choisissez un point dans la portée du sort. Toutes plantes normales présentes dans un rayon de 30 mètres autour de ce point croissent avec vigueur. Une créature se déplaçant à travers la zone doit consommer 4 mètres de mouvement pour parcourir 1 mètre.

Vous pouvez désigner une ou plusieurs zones de dimension variable comme étant exclues de la zone d''effet du sort.

Si vous lancez ce sort sur une période de 8 heures, vous enrichissez le sol. Toutes les plantes présentes dans une surface de 400 mètres de rayon centrée sur point dans la portée du sort sont enrichies pour 1 année. Les plantes produisent deux fois plus de nourriture lors de la récolte.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Croissance végétale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Croissance végétale' AND s.ruleset = '5';

-- Éclair
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Éclair', 3, '1 action', 0, '["V","S","M"]', 'un morceau de fourrure et un bâtonnet d''ambre, de cristal ou de verre', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un rayon de foudre formant une ligne d''une longueur de 30 mètres et d''une largeur de 1,50 mètre jaillit de vous dans la direction de votre choix. Toute créature sur la ligne doit effectuer un jet de sauvegarde de Dextérité, subissant 8d6 dégâts de foudre en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

L''éclair enflamme les objets inflammables qui ne sont pas portés ou transportés.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 3.', 5, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"lightning","damage_at_slot_level":{"3":"8d6","4":"9d6","5":"10d6","6":"11d6","7":"12d6","8":"13d6","9":"14d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Éclair' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Éclair' AND s.ruleset = '5';

-- Flèche de foudre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Flèche de foudre', 3, '1 action bonus', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous effectuez une attaque à distance avec une arme pendant la durée de ce sort, la munition, ou l''arme elle même si c''est une arme de lancer, se transforme en un éclair de foudre. Effectuez le jet d''attaque normalement. La cible subit, au lieu des dégâts normaux de l''arme, 4d8 dégâts de foudre si le coup touche, ou la moitié de ces dégâts en cas d''échec.

Que vous touchiez ou non, chaque créature se trouvant dans un rayon de 3 mètres autour de la cible doit effectuer un jet de sauvegarde de Dextérité. Chacune de ces créatures subit 2d8 dégâts de foudre en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

La munition, ou l''arme, retrouve ensuite sa forme habituelle.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, les dégâts de chaque effet du sort augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 3.', 8, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":3}', '[{"damage_type":"lightning","label":"Cible","damage_at_slot_level":{"3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}},{"damage_type":"lightning","label":"Créatures à 3 mètres de la cible","damage_at_slot_level":{"3":"2d8","4":"3d8","5":"4d8","6":"5d8","7":"6d8","8":"7d8","9":"8d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flèche de foudre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Flèche de foudre' AND s.ruleset = '5';

-- Forme gazeuse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Forme gazeuse', 3, '1 action', 1.5, '["V","S","M"]', 'un morceau de gaze et une volute de fumée', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous transformez une créature consentante que vous touchez, ainsi que tout ce qu''elle porte et transporte, en un nuage brumeux pour la durée du sort. Le sort prend fin si la créature atteint 0 point de vie. Une créature immatérielle n''est pas affectée.

Alors qu''elle est dans cet état, la cible ne peut se déplacer que par le vol, à la vitesse de 3 mètres. La cible peut pénétrer et occuper l''espace d''une autre créature. La cible possède une résistance aux dégâts non magiques, et elle a un avantage à ses jets de sauvegarde de Force, Dextérité et Constitution. La cible peut passer par de petits trous, des ouvertures étroites et même par des fissures. Cependant, elle considère les liquides comme des surfaces dures. La cible ne peut chuter et elle se maintient dans les airs même lorsqu''elle est étourdie ou autrement indisposée.

Alors qu''elle est dans l''état d''un nuage brumeux, la cible ne peut parler ou manipuler des objets. Les objets qu''elle transportait ou tenait ne peuvent être lâchés ou utilisés de quelconque façon. La cible ne peut attaquer ou lancer des sorts.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Forme gazeuse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Forme gazeuse' AND s.ruleset = '5';

-- Hâte
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Hâte', 3, '1 action', 9, '["V","S","M"]', 'un copeau de racine de réglisse', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez une créature consentante visible dans la portée du sort. Jusqu''à la fin de la durée du sort, la vitesse de la cible est doublée, elle bénéficie d''un bonus de +2 à la CA, elle a un avantage à ses jets de sauvegarde de Dextérité, et elle obtient une action supplémentaire à chacun de ses tours. Cette action peut être utilisée pour Attaquer (une seule attaque avec une arme), Foncer, Se désengager, Se cacher ou Utiliser un objet.

Lorsque le sort prend fin, la cible ne peut plus bouger ou agir jusqu''à la fin de son prochain tour, car une vague de léthargie la submerge.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Hâte' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Hâte' AND s.ruleset = '5';

-- Image majeure
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Image majeure', 3, '1 action', 36, '["V","S","M"]', 'un morceau de toison', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez l''image d''un objet, d''une créature ou d''un quelconque phénomène visible qui ne déborde pas d''un cube de 6 mètres d''arête. L''image apparait à un endroit visible dans la portée et pour la durée du sort. Elle parait bel et bien réelle, incluant les sons, les odeurs et la température appropriés à la chose montrée. Vous ne pouvez pas créer une chaleur ou un froid suffisamment intense pour infliger des dégâts, un son si fort qu''il inflige des dégâts de tonnerre ou qu''il assourdisse une créature ou bien une odeur qui pourrait rendre une créature malade (comme la puanteur d''un troglodyte).

Tant que vous êtes dans la portée de l''illusion, vous pouvez utiliser votre action pour déplacer l''image à un autre endroit dans la portée du sort. Au moment où l''image change d''endroit, vous pouvez modifier son apparence de sorte que le mouvement de l''image semble naturel. Par exemple, en supposant que vous créez l''image d''une créature et que vous la déplacez, vous pouvez changer l''image de telle sorte que la créature semble marcher. De la même manière, vous pouvez faire en sorte que l''illusion génère divers sons à des moments différents. Vous pouvez même simuler une conversation, par exemple.

Une interaction physique avec l''image révèle sa nature illusoire puisqu''on peut passer au travers. Une créature qui utilise son action pour examiner l''image peut conclure que c''est une image en réussissant un jet d''Intelligence (Investigation) contre le DD de sauvegarde de votre sort. Si une créature discerne l''illusion pour ce qu''elle est, la créature peut voir à travers l''image et les autres qualités sensorielles de l''image s''évanouissent aux yeux de la créature.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, le sort persiste jusqu''au moment de sa dissipation, sans requérir de concentration.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Image majeure' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Image majeure' AND s.ruleset = '5';

-- Invocation d'animaux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation d''animaux', 3, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez les esprits des fées qui prennent la forme de bêtes et apparaissent dans des espaces inoccupés à portée que vous pouvez voir. Choisissez ce qui apparaîtra via l''une des options suivantes :

- Une bête de FP 2 ou inférieur
- Deux bêtes de FP 1 ou inférieur
- Quatre bêtes de FP 1/2 ou inférieur
- Huit bêtes de FP 1/4 ou inférieur

Chaque bête est également considérée comme une fée, et elle disparaît lorsqu''elle tombe à 0 point de vie ou lorsque le sort prend fin. Les créatures invoquées sont amicales envers vous et vos compagnons. Lancez l''initiative pour le groupe de créatures invoquées ; il a ses propres tours de jeu. Elles obéissent aux ordres verbaux que vous leur donnez (aucune action requise). Si vous ne leur donnez aucun ordre, elles ne font que se défendre contre les créatures qui leur sont hostiles. Le MD possède les statistiques des créatures.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant certains niveaux d''emplacement de sort, vous choisissez l''option d''invocation ci-dessus, et plus de créatures apparaissent : deux fois plus de créatures invoquées avec un emplacement de sort de niveau 5, trois fois plus avec un emplacement de sort de niveau 7, et quatre fois plus avec un emplacement de sort de niveau 9.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''animaux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Invocation d''animaux' AND s.ruleset = '5';

-- Invocation de projectiles
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Invocation de projectiles', 3, '1 action', 0, '["V","S","M"]', 'une pièce de munition ou une arme de lancer', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous lancez une arme non magique ou tirez une munition non magique en l''air pour créer un cône d''armes identiques propulsées vers l''avant, qui disparaissent une fois l''autre course terminée. Chaque créature dans un cône de 18 mètres doit effectuer un jet de sauvegarde de Dextérité, subissant 3d8 dégâts en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Le type de dégâts est le même que celui de l''arme ou de la munition utilisée comme composante.', 2, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cone","size":18}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation de projectiles' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Invocation de projectiles' AND s.ruleset = '5';

-- Marche sur l'eau
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Marche sur l''eau', 3, '1 action', 9, '["V","S","M"]', 'un morceau de liège', NULL, 1, '1 heure', 'hour', 1, 0, 'Le sort attribue la capacité de se déplacer sur toute surface liquide (eau, acide, boue, neige, sables mouvants, lave, etc.) comme si c''était un sol dur. Les créatures qui traversent de la lave en fusion subissent tout de même les dégâts dus à la chaleur. Jusqu''à dix créatures consentantes et que vous pouvez voir dans la portée du sort obtiennent cette capacité pour la durée du sort.

Si vous ciblez une créature submergée dans un liquide, le sort déplace la cible vers la surface du liquide à une vitesse de 18 mètres par round.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Marche sur l''eau' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide', 'Ensorceleur', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Marche sur l''eau' AND s.ruleset = '5';

-- Monture fantôme
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Monture fantôme', 3, '1 minute', 9, '["V","S"]', NULL, NULL, 1, '1 heure', 'hour', 1, 0, 'Une créature semi-réelle de taille G ressemblant à un cheval apparaît, à portée, sur le sol dans un espace inoccupé de votre choix. Vous décidez de l''apparence de la créature, elle est cependant équipée d''une selle, de mors et d''une bride. Tout l''équipement créé grâce à ce sort disparaît dans un nuage de fumée s''il est éloigné à plus de 3 mètres de la monture.

Pour toute la durée du sort, vous, ou une créature de votre choix, pouvez chevaucher la monture. La créature utilise les statistiques d''un cheval de selle, à l''exception de sa vitesse de déplacement qui est de 30 mètres, il peut également parcourir 15 km en une heure, ou 20 km s''il voyage à un rythme rapide. Lorsque le sort prend fin, la monture disparaît progressivement, donnant 1 minute à son cavalier pour mettre pied à terre. Le sort se termine si vous utilisez votre action pour le dissiper ou si la monture subit des dégâts.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Monture fantôme' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Monture fantôme' AND s.ruleset = '5';

-- Mur de vent
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur de vent', 3, '1 action', 36, '["V","S","M"]', 'un minuscule éventail et une plume d''oiseau exotique', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un mur de puissants vents s''élève du sol à un endroit de votre choix. Vous pouvez créer un mur pouvant faire, au mieux, 15 mètres de long, 4,50 mètres de haut et 30 cm d''épaisseur. Vous pouvez donner au mur la forme que vous souhaitez, à condition qu''il soit continuellement en contact avec le sol. Le mur reste en place pour toute la durée du sort.

Lorsque le mur apparaît, chaque créature se trouvant dans la zone doit effectuer un jet de sauvegarde de Force. Une créature subit 3d8 dégâts contondants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Le vent violent garde les brumes, brouillards, et autres gaz éloignés. Les objets et créatures volants de taille P ou inférieure ne peuvent pas passer au travers du mur. S''ils ne sont pas tenus ou fixés, les objets légers amenés dans le mur s''envolent. Les flèches, carreaux et autres projectiles ordinaires tirés en direction de cibles situées de l''autre côté du mur sont détournés et automatiquement perdus (les rochers projetés par des géants ou des engins de siège, ou tout autre projectile similaire, ne sont pas affectés). Les créatures sous forme gazeuse ne peuvent pas traverser le mur de vent.', 5, '{"ability":"str","success":"half"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"3":"3d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur de vent' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Mur de vent' AND s.ruleset = '5';

-- Nuage nauséabond
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Nuage nauséabond', 3, '1 action', 27, '["V","S","M"]', 'un œuf pourri ou plusieurs feuilles de chou puant', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez une sphère de gaz jaune nauséabond de 6 mètres de rayon, centrée sur un point à portée. Le nuage se propage dans tous les coins et la visibilité de la zone est fortement réduite. Le nuage persiste dans l''air pour la durée du sort.

Chaque créature totalement dans le nuage au début de son tour doit effectuer un jet de sauvegarde de Constitution contre le poison. En cas d''échec, la créature est prise de nausées et chancelle, perdant ainsi son action. Les créatures qui n''ont pas besoin de respirer ou qui sont immunisées contre le poison réussissent automatiquement leur jet de sauvegarde.

Un vent modéré (d''au moins 15 km/h) disperse le nuage après 4 rounds. Un vent fort (d''au moins 30 km/h) le disperse après 1 round.', 2, '{"ability":"con","success":"none"}', NULL, '{"shape":"sphere","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nuage nauséabond' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Nuage nauséabond' AND s.ruleset = '5';

-- Petite hutte de Léomund
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Petite hutte de Léomund', 3, '1 minute', 0, '["V","S","M"]', 'une petite perle de cristal', NULL, 1, '8 heures', 'hour', 8, 0, 'Un dôme immobile de 3 mètres de rayon apparaît autour et au-dessus de vous et reste à cet endroit, immobile, jusqu''à la fin du sort. Le sort prend fin si vous quittez cette zone.

Neuf créatures de taille M ou inférieure peuvent tenir sous le dôme avec vous. Le sort échoue si la zone contient une créature plus grande ou plus de neuf créatures. Les créatures et objets qui se trouvent sous le dôme lorsque vous lancez ce sort peuvent en sortir et y rentrer librement. Toutes les autres créatures et objets sont bloqués et ne peuvent le traverser. Les sorts et effets magiques, lancés de l''intérieur ou de l''extérieur du dôme, ne peuvent pas non plus passer au travers. L''atmosphère dans la zone est confortable et sec, quel que soit le climat extérieur.

Jusqu''à ce que le sort prenne fin, vous pouvez faire en sorte que l''intérieur du dôme soit faiblement éclairé voire plongé dans les ténèbres. Le dôme est opaque depuis l''extérieur, de la couleur de votre choix, mais il est transparent depuis l''intérieur.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Petite hutte de Léomund' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Petite hutte de Léomund' AND s.ruleset = '5';

-- Respiration aquatique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Respiration aquatique', 3, '1 action', 9, '["V","S","M"]', 'un court roseau ou un morceau de paille', NULL, 1, '24 heures', 'hour', 24, 0, 'Ce sort procure à un maximum de dix créatures consentantes, à portée et que vous pouvez voir, la capacité de respirer sous l''eau jusqu''à la fin de sa durée. Les créatures affectées conservent également leur mode de respiration normal.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Respiration aquatique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Respiration aquatique' AND s.ruleset = '5';

-- Tempête de neige
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tempête de neige', 3, '1 action', 45, '["V","S","M"]', 'une pincée de poussière et quelques gouttes d''eau', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Tant que le sort persiste, une pluie glacée et de la neige tombent dans un cylindre de 6 mètres de hauteur avec un rayon de 12 mètres, centré sur un point déterminé dans la portée du sort. La visibilité dans la zone est nulle et les flammes nues dans la zone sont éteintes.

Le sol dans la zone est couvert de glace glissante, rendant le terrain difficile. Lorsqu''une créature pénètre dans la zone du sort pour la première fois d''un tour ou lorsqu''elle y débute son tour, elle doit réussir un jet de sauvegarde de Dextérité ou tomber à terre.

Si une créature commence son tour dans la zone d''effet du sort tout en étant concentrée sur un sort, elle doit réussir un jet de sauvegarde de Constitution contre le DD de sauvegarde de votre sort, sans quoi elle perd sa concentration.', 2, '{"ability":"dex","success":"none"}', NULL, '{"shape":"cylinder","size":12,"height":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tempête de neige' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Tempête de neige' AND s.ruleset = '5';

-- Toucher du vampire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Toucher du vampire', 3, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Le contact de votre main nimbée d''ombres peut aspirer la force vitale des autres et soigner vos plaies. Effectuez une attaque au corps à corps avec un sort contre une créature à votre portée. Si vous touchez, la cible subit 3d6 dégâts nécrotiques, et vous récupérez un nombre de points de vie égal à la moitié des dégâts nécrotiques infligés. Jusqu''à la fin du sort, vous pouvez attaquer de nouveau à chacun de vos tours en utilisant une action.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, les dégâts augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 3.', 7, NULL, 'melee', NULL, '[{"damage_type":"necrotic","damage_at_slot_level":{"3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Toucher du vampire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Toucher du vampire' AND s.ruleset = '5';

-- Sorts de niveau 6 hors socle (Xanathar, Tasha) (#176 D1) : les 13 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_6.ts, gardé par test/nuxt/spellsLevelHorsSocle6Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Bosquet des druides
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Bosquet des druides', 6, '10 minutes', 1.5, '["V","S","M"]', 'du gui, que le sort consomme, récolté avec une faucille en or lors d''une pleine lune', '{"consumed":true}', 0, '24 heures', 'hour', 24, 0, 'Vous invoquez les esprits de la nature pour protéger une zone, en extérieur ou sous terre, en forme de cube de 9 à 27 mètres de côté. Constructions et structures ne sont pas affectées. Si vous lancez ce sort chaque jour dans la même zone pendant 1 an, ses effets deviennent permanents jusqu''à dissipation. Lors de l''incantation, vous pouvez désigner des créatures immunisées aux effets du sort, ainsi qu''un mot de passe qui, prononcé à voix haute, rend immunisé quiconque le dit. Toute la zone irradie la magie : une *dissipation de la magie* réussie ne retire qu''un seul effet, que choisit le lanceur du sort, et le sort ne se dissipe que lorsque tous ses effets ont disparu.

**Brouillard épais**. Vous pouvez emplir de brouillard épais n''importe quel carré de 1,50 mètre de côté de la zone, ce qui réduit la visibilité. Il s''élève jusqu''à 3 mètres de haut, et chaque déplacement de 1,50 mètre dedans coûte 3 mètres de déplacement de plus. Pour une créature immunisée, il ne gêne pas la vue et ressemble à une légère brume parsemée de petites particules vertes.

**Liane agrippante**. Vous pouvez emplir d''herbes et de lianes agrippantes tout carré de 1,50 mètre de côté non occupé par le brouillard, comme le sort *enchevêtrement*. Pour une créature immunisée, elles sont souples et peuvent former un siège ou un lit temporaire.

**Gardiens du bosquet**. Vous pouvez animer jusqu''à quatre arbres de la zone, qui se déracinent. Ils ont les statistiques d''un arbre éveillé, mais ne parlent pas et leur écorce porte des symboles druidiques. Si une créature non immunisée entre dans la zone, les gardiens l''attaquent jusqu''à ce que les intrus soient repoussés ou éliminés. Ils obéissent à vos ordres tant que vous êtes dans la zone (sans action) ; sans ordre et sans intrus, ils restent inactifs. Ils ne peuvent pas quitter la zone. À la fin du sort, leur animation disparaît et ils reprennent racine sur place si possible.

**Effets supplémentaires**. Vous pouvez ajouter dans la zone l''un de ces effets magiques :

- Une *bourrasque* constante à deux endroits de votre choix.
- Une *croissance d''épines* à un endroit de votre choix.
- Un *mur de vent* à deux endroits de votre choix.

Pour une créature immunisée, les vents sont une douce brise parfumée et les épines sont inoffensives.', 1, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bosquet des druides' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Bosquet des druides' AND s.ruleset = '5';

-- Cage des âmes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Cage des âmes', 6, '1 réaction', 18, '["V","S","M"]', 'une petite cage d''argent d''une valeur d''au moins 100 po', '{"amount":100,"unit":"po"}', 0, '8 heures', 'hour', 8, 0, 'Réaction déclenchée lorsqu''un humanoïde que vous voyez à 18 mètres ou moins de vous meurt.

Ce sort arrache l''âme de l''humanoïde mourant et l''enferme dans la petite cage qui sert de composante matérielle. L''âme y reste jusqu''à la fin du sort ou jusqu''à ce que vous brisiez la cage (ce qui met fin au sort aussitôt). Tant qu''une âme est piégée, l''humanoïde mort ne peut pas être ramené à la vie. Vous pouvez exploiter l''âme de plusieurs façons ; elle peut servir jusqu''à 6 fois, et à la sixième utilisation elle est libérée et le sort prend fin.

**Vol de vie**. Par une action bonus, vous drainez l''énergie de l''âme et regagnez 2d8 points de vie.

**Interroger l''âme**. Vous posez une question à l''âme (sans action) et recevez par télépathie une brève réponse que vous comprenez quelle que soit la langue. L''âme ne sait que ce qu''elle savait de son vivant, mais elle doit répondre sincèrement et de son mieux ; la réponse tient en une ou deux courtes phrases et peut être énigmatique.

**Partage d''expérience**. Par une action bonus, vous vous imprégnez de l''expérience de l''âme et obtenez un avantage à votre prochain jet d''attaque, de caractéristique ou de sauvegarde ; si vous ne l''utilisez pas avant le début de votre prochain tour, il est perdu.

**Vision des morts**. Par une action, vous nommez un lieu que l''humanoïde a vu de son vivant : un capteur invisible y apparaît, à condition d''être sur le même plan d''existence que vous. Il persiste tant que vous vous concentrez, jusqu''à 10 minutes, et vous voyez et entendez comme si vous étiez à sa place.

Toute créature qui voit le capteur (avec *voir l''invisible* ou la vision véritable, par exemple) perçoit une image translucide de l''humanoïde tourmenté dont vous avez piégé l''âme.', 7, NULL, NULL, NULL, NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"6":"2d8"}}', 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cage des âmes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Cage des âmes' AND s.ruleset = '5';

-- Convocation de fiélon
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de fiélon', 6, '1 action', 27, '["V","S","M"]', 'du sang d''un humanoïde dans un flacon en rubis d''une valeur d''au moins 600 po', '{"amount":600,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit de fiélon, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit de fiélon. À l''incantation, choisissez un type : démon, diable ou yugoloth ; la créature prend l''apparence d''un fiélon de ce type, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 7 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de fiélon' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation de fiélon' AND s.ruleset = '5';

-- Costume d'Outremonde de Tasha
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Costume d''Outremonde de Tasha', 6, '1 action bonus', 0, '["V","S","M"]', 'un objet gravé d''un symbole des plans extérieurs, d''une valeur d''au moins 500 po', '{"amount":500,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous prononcez une incantation et puisez de la magie dans les plans inférieurs ou supérieurs, à votre choix, pour vous transformer. Jusqu''à la fin du sort, vous gagnez ces avantages :

- Vous êtes immunisé contre les dégâts de feu et de poison (plans inférieurs) ou contre les dégâts radiants et nécrotiques (plans supérieurs).
- Vous êtes immunisé contre l''état empoisonné (plans inférieurs) ou charmé (plans supérieurs).
- Des ailes spectrales vous poussent dans le dos et vous donnent une vitesse de vol de 12 mètres.
- Vous avez un bonus de +2 à la CA.
- Toutes vos attaques avec une arme sont magiques, et vous pouvez utiliser votre modificateur de caractéristique d''incantation à la place de la Force ou de la Dextérité pour leurs jets d''attaque et de dégâts.
- Vous pouvez attaquer deux fois au lieu d''une quand vous prenez l''action Attaquer à votre tour. Vous perdez cet avantage si vous avez déjà une capacité semblable, comme Attaque supplémentaire.', 8, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Costume d''Outremonde de Tasha' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Costume d''Outremonde de Tasha' AND s.ruleset = '5';

-- Création d'homoncule
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Création d''homoncule', 6, '1 heure', 1.5, '["V","S","M"]', 'de l''argile, des cendres et des racines de mandragore, qui sont tous consommés par le sort, et un poignard incrusté de joyaux d''une valeur d''au moins 1 000 po', '{"amount":1000,"unit":"po"}', 0, 'Instantanée', 'instant', NULL, 0, 'En prononçant l''incantation, vous vous entaillez avec une dague incrustée de pierres précieuses et subissez 2d4 dégâts perforants qui ne peuvent être réduits d''aucune manière. Vous faites couler votre sang sur les autres composantes et les touchez : elles se transforment en une petite créature, un homoncule. Il devient un compagnon fidèle et meurt si vous mourez. Quand vous terminez un repos long, vous pouvez dépenser jusqu''à la moitié de vos dés de vie si l''homoncule est sur le même plan d''existence que vous : lancez-les et ajoutez votre modificateur de Constitution à chacun. Votre maximum de points de vie est réduit du total obtenu, et les points de vie et le maximum de points de vie de l''homoncule augmentent de ce même total. Ce processus ne peut pas réduire vos points de vie à moins de 1, et votre maximum et celui de l''homoncule redeviennent normaux quand vous terminez un repos long. Cette réduction de votre maximum ne peut être annulée que par la mort de l''homoncule. Vous ne pouvez avoir qu''un homoncule à la fois ; si vous lancez ce sort alors que le vôtre vit encore, le sort échoue.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Création d''homoncule' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Création d''homoncule' AND s.ruleset = '5';

-- Dispersion
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Dispersion', 6, '1 action', 9, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'L''air frémit autour de 5 créatures de votre choix que vous voyez à portée. Une créature non consentante doit réussir un jet de sauvegarde de Sagesse pour résister au sort. Vous téléportez chaque cible dans un espace inoccupé que vous voyez, à 36 mètres de vous au plus ; cet espace doit être au sol ou sur un plancher.', 2, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Dispersion' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Dispersion' AND s.ruleset = '5';

-- Ossements de la Terre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Ossements de la Terre', 6, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous faites surgir jusqu''à 6 piliers de pierre aux endroits que vous voyez à portée. Chaque pilier est un cylindre de 1,50 mètre de diamètre et de 9 mètres de haut au plus. L''endroit doit être assez large pour son diamètre, et vous pouvez viser le sol sous une créature de taille M ou inférieure. Chaque pilier a une CA de 5 et 30 points de vie ; à 0 point de vie, il s''effondre et crée un terrain difficile dans un rayon de 3 mètres, qui reste jusqu''à ce qu''on le déblaie : chaque portion de 1,50 mètre de diamètre demande au moins 1 minute de déblaiement à la main.

Si un pilier surgit sous une créature, elle doit réussir un jet de sauvegarde de Dextérité, sans quoi elle est soulevée par le pilier ; elle peut choisir de rater le jet.

Si un pilier ne peut pas atteindre sa pleine hauteur à cause d''un plafond ou d''un autre obstacle, une créature qui se trouve dessus subit 6d6 dégâts contondants et est entravée, coincée entre le pilier et l''obstacle. Elle peut utiliser une action pour faire un jet de Force ou de Dextérité (à son choix) contre le DD de sauvegarde du sort ; en cas de réussite, elle est libérée et doit descendre du pilier ou en tomber.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 7 ou supérieur, vous pouvez créer deux piliers de plus par niveau d''emplacement au-delà du niveau 6.', 8, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"6":"6d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ossements de la Terre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Ossements de la Terre' AND s.ruleset = '5';

-- Protection primordiale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Protection primordiale', 6, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous avez la résistance aux dégâts d''acide, de froid, de feu, de foudre et de tonnerre pour la durée du sort.

Si vous subissez des dégâts de l''un de ces types, vous pouvez utiliser votre réaction pour obtenir l''immunité à ce type, y compris contre les dégâts qui ont déclenché la réaction. Vous perdez alors toutes vos résistances et gardez l''immunité choisie jusqu''à la fin de votre prochain tour, au terme duquel le sort prend fin.', 1, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Protection primordiale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Protection primordiale' AND s.ruleset = '5';

-- Sacre de la glace
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sacre de la glace', 6, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Jusqu''à la fin du sort, la glace givre votre corps et vous gagnez ces avantages :

- Vous êtes immunisé contre les dégâts de froid et avez la résistance aux dégâts de feu.
- Vous vous déplacez sans gêne sur les terrains difficiles dus au froid et à la glace.
- Le sol dans un rayon de 3 mètres autour de vous est verglacé et devient un terrain difficile pour toutes les créatures sauf vous ; cette zone vous suit.
- Vous pouvez utiliser votre action pour créer un cône de 4,50 mètres qui part de vos mains tendues dans la direction de votre choix. Chaque créature du cône doit effectuer un jet de sauvegarde de Constitution et subit 4d6 dégâts de froid en cas d''échec, la moitié en cas de réussite. Une créature qui échoue voit sa vitesse réduite de moitié jusqu''à la fin de votre prochain tour.', 8, '{"ability":"con","success":"half"}', NULL, '{"shape":"cone","size":4.5}', '[{"damage_type":"cold","damage_at_slot_level":{"6":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sacre de la glace' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Sacre de la glace' AND s.ruleset = '5';

-- Sacre de la pierre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sacre de la pierre', 6, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Jusqu''à la fin du sort, votre corps se couvre de pierre et vous gagnez ces avantages :

- Vous avez la résistance aux dégâts contondants, perforants et tranchants des attaques non magiques.
- Vous pouvez utiliser votre action pour provoquer un petit séisme dans un rayon de 4,50 mètres centré sur vous : toute créature qui se tient sur ce sol doit réussir un jet de sauvegarde de Dextérité, sans quoi elle est projetée à terre.
- Vous vous déplacez sans gêne sur les terrains difficiles de terre et de roche, que vous pouvez traverser comme de l''air sans les déstabiliser, mais vous ne pouvez pas vous y arrêter : si cela arrive, vous êtes éjecté vers l''espace inoccupé le plus proche, le sort prend fin et vous êtes étourdi jusqu''à la fin de votre prochain tour.', 8, '{"ability":"dex","success":"none"}', NULL, '{"shape":"emanation","size":4.5}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sacre de la pierre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Sacre de la pierre' AND s.ruleset = '5';

-- Sacre des flammes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sacre des flammes', 6, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Des flammes courent sur votre corps et répandent pour la durée du sort une lumière vive sur 9 mètres de rayon et une lumière faible sur 9 mètres de plus. Elles ne vous blessent pas. Jusqu''à la fin du sort, vous gagnez ces avantages :

- Vous êtes immunisé contre les dégâts de feu et avez la résistance aux dégâts de froid.
- Toute créature qui, pour la première fois d''un tour, se déplace à 1,50 mètre ou moins de vous, ou y termine son tour, subit 1d10 dégâts de feu.
- Vous pouvez utiliser votre action pour créer une ligne de feu longue de 4,50 mètres et large de 1,50 mètre dans la direction de votre choix. Chaque créature sur la ligne doit effectuer un jet de sauvegarde de Dextérité et subit 4d8 dégâts de feu en cas d''échec, la moitié en cas de réussite.', 8, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","label":"Aura de flammes","damage_at_slot_level":{"6":"1d10"}},{"damage_type":"fire","label":"Ligne de feu","damage_at_slot_level":{"6":"4d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sacre des flammes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Sacre des flammes' AND s.ruleset = '5';

-- Sacre du vent
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sacre du vent', 6, '1 action', 0, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Jusqu''à la fin du sort, le vent tourbillonne autour de vous et vous gagnez ces avantages :

- Les attaques à distance avec une arme contre vous ont un désavantage.
- Vous avez une vitesse de vol de 18 mètres ; si vous volez à la fin du sort, vous tombez, sauf si vous pouvez l''empêcher.
- Vous pouvez utiliser votre action pour créer un cube de vent tourbillonnant de 4,50 mètres d''arête centré sur un point visible à 18 mètres au plus. Chaque créature du cube doit effectuer un jet de sauvegarde de Constitution et subit 2d10 dégâts contondants en cas d''échec, la moitié en cas de réussite. Une créature de taille G ou inférieure qui échoue est aussi repoussée de 3 mètres au plus du centre du cube.', 8, '{"ability":"con","success":"half"}', NULL, '{"shape":"cube","size":4.5}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"6":"2d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sacre du vent' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Sacre du vent' AND s.ruleset = '5';

-- Transformation de Tenser
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Transformation de Tenser', 6, '1 action', 0, '["V","S","M"]', 'quelques poils de taureau', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous vous dotez d''une endurance et d''une prouesse martiale imprégnées de magie. Jusqu''à la fin du sort, vous ne pouvez pas lancer de sorts, et vous gagnez ces avantages :

- Vous gagnez 50 points de vie temporaires, perdus s''il vous en reste à la fin du sort.
- Vous avez l''avantage aux jets d''attaque avec des armes courantes ou de guerre.
- Quand vous touchez une cible avec une attaque avec une arme, elle subit 2d12 dégâts de force supplémentaires.
- Vous maîtrisez toutes les armures, tous les boucliers et toutes les armes courantes et de guerre.
- Vous maîtrisez les jets de sauvegarde de Force et de Constitution.
- Vous pouvez attaquer deux fois au lieu d''une quand vous utilisez votre action pour attaquer à votre tour. Vous perdez cet avantage si vous avez déjà une capacité semblable, comme Attaque supplémentaire.

Immédiatement après la fin du sort, vous devez réussir un jet de sauvegarde de Constitution de DD 15, sans quoi vous gagnez un niveau d''épuisement.', 8, NULL, NULL, NULL, '[{"damage_type":"force","damage_at_slot_level":{"6":"2d12"}}]', '{"heal_type":"temporary_hit_points","heal_at_slot_level":{"6":"50"}}', 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Transformation de Tenser' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Transformation de Tenser' AND s.ruleset = '5';

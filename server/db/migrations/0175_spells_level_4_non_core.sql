-- Sorts de niveau 4 hors socle (Xanathar, Tasha) (#176 D1) : les 12 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_4.ts, gardé par test/nuxt/spellsLevelHorsSocle4Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Appel de destrier supérieur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Appel de destrier supérieur', 4, '10 minutes', 9, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous invoquez un esprit qui prend la forme d''un destrier loyal et majestueux, dans un espace inoccupé à portée. Choisissez sa forme : griffon, pégase, péryton, loup sanguinaire, rhinocéros ou tigre à dents de sabre. Il utilise les statistiques du *Manuel des monstres* pour cette forme, mais son type est céleste, fée ou fiélon, à votre choix. S''il a une Intelligence de 5 ou moins, elle passe à 6 et il comprend une langue que vous parlez, au choix.

Vous contrôlez la monture au combat. Tant qu''elle est à 1,5 km ou moins de vous, vous pouvez communiquer avec elle par télépathie. Quand vous la montez et lancez un sort qui vous cible, vous pouvez le faire cibler aussi la monture.

Elle disparaît temporairement à 0 point de vie ou quand vous la renvoyez par une action. Relancer ce sort rappelle la même monture, avec tous ses points de vie et sans aucun état. Vous ne pouvez avoir qu''une seule monture liée par ce sort ou par *appel de destrier*. Par une action, vous pouvez la libérer de son lien, ce qui la fait disparaître définitivement. Quand elle disparaît, elle laisse sur place ce qu''elle portait ou transportait.', 2, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Appel de destrier supérieur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Appel de destrier supérieur' AND s.ruleset = '5';

-- Convocation d'aberration
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation d''aberration', 4, '1 action', 27, '["V","S","M"]', 'un tentacule mariné et un globe oculaire dans un flacon incrusté de platine d''une valeur d''au moins 400 po', '{"amount":400,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit d''aberration, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit d''aberration. À l''incantation, choisissez un type : tyrannoeil, slaad ou rejeton stellaire ; la créature prend l''apparence d''une aberration de ce type, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation d''aberration' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation d''aberration' AND s.ruleset = '5';

-- Convocation d'artificiel
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation d''artificiel', 4, '1 action', 27, '["V","S","M"]', 'une pierre ornée et un coffre en métal d''une valeur d''au moins 400 po', '{"amount":400,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit d''artificiel, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit d''artificiel. À l''incantation, choisissez un type : argile, métal ou pierre ; la créature prend l''apparence d''un golem ou d''un modron de ce type, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation d''artificiel' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Convocation d''artificiel' AND s.ruleset = '5';

-- Convocation d'élémentaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation d''élémentaire', 4, '1 action', 27, '["V","S","M"]', 'de l''air, un caillou, de la cendre et de l''eau dans un flacon incrusté d''or d''une valeur d''au moins 400 po', '{"amount":400,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous appelez un esprit d''élémentaire, qui apparaît dans un espace inoccupé que vous voyez à portée et prend les statistiques d''un esprit d''élémentaire. À l''incantation, choisissez un type : eau, air, feu ou terre ; la créature prend la forme d''un humanoïde couronné de l''élément choisi, ce qui détermine certains traits de son bloc de statistiques. Elle disparaît à 0 point de vie ou à la fin du sort.

Elle est votre alliée et celle de vos compagnons. Au combat, elle partage votre initiative et joue juste après vous. Elle obéit à vos ordres sans que cela vous coûte d''action ; sans ordre, elle se contente d''esquiver et d''éviter le danger.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, utilisez ce niveau partout où le bloc de statistiques de la créature mentionne le niveau du sort.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation d''élémentaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Convocation d''élémentaire' AND s.ruleset = '5';

-- Convocation de démon majeur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Convocation de démon majeur', 4, '1 action', 18, '["V","S","M"]', 'une fiole de sang d''humanoïde tué au cours des dernières 24 heures', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous prononcez des mots impies pour invoquer un démon du chaos des Abysses. Choisissez son type, de FP 5 ou moins (démon des ombres, barlgura…). Il apparaît dans un espace inoccupé que vous voyez à portée et disparaît à 0 point de vie ou à la fin du sort.

Lancez l''initiative pour le démon, qui a ses propres tours. À l''invocation puis à chacun de vos tours, vous pouvez lui donner un ordre verbal (sans action) qui dicte son prochain tour ; sans ordre, il le passe à attaquer toute créature à portée qui l''a attaqué. À la fin de chacun de ses tours, il fait un jet de sauvegarde de Charisme, avec un désavantage si vous prononcez son vrai nom. S''il échoue, il continue de vous obéir ; s''il réussit, votre contrôle prend fin pour le reste de la durée et il passe son tour à poursuivre et attaquer de son mieux les non-démons les plus proches. Si vous cessez de vous concentrer avant la fin de la durée, un démon incontrôlé disparaît après 1d6 rounds s''il lui reste des points de vie. Dans le cadre de l''incantation, vous pouvez tracer au sol, avec le sang de la composante matérielle, un cercle assez grand pour englober votre espace : tant que le sort dure, le démon ne peut ni le franchir, ni lui nuire, ni cibler quelqu''un à l''intérieur. Employer la composante de cette façon la consomme à la fin du sort.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, le FP maximal augmente de 1 par niveau d''emplacement au-delà du niveau 4.', 2, '{"ability":"cha"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Convocation de démon majeur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Convocation de démon majeur' AND s.ruleset = '5';

-- Fléau élémentaire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Fléau élémentaire', 4, '1 action', 27, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez une créature que vous voyez à portée et un type de dégâts : acide, froid, feu, foudre ou tonnerre. La cible doit réussir un jet de sauvegarde de Constitution, sans quoi elle est affectée pour toute la durée du sort. La première fois à chaque tour que la cible affectée subit des dégâts du type choisi, elle subit 2d6 dégâts supplémentaires de ce type, et elle perd toute résistance à ce type de dégâts jusqu''à la fin du sort.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, vous pouvez cibler une créature de plus par niveau d''emplacement au-delà du niveau 4, à condition que les cibles soient à 9 mètres les unes des autres.', 8, '{"ability":"con","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fléau élémentaire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Fléau élémentaire' AND s.ruleset = '5';

-- Gardien de la nature
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Gardien de la nature', 4, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un esprit de la nature répond à votre appel et vous transforme en puissant gardien jusqu''à la fin du sort. Choisissez une forme :

**Bête primitive**. Une fourrure de bête recouvre votre corps et vos traits deviennent sauvages. Vous gagnez ces avantages :

- Votre vitesse de marche augmente de 3 mètres.
- Vous gagnez la vision dans le noir sur 36 mètres.
- Vous faites vos jets d''attaque basés sur la Force avec avantage.
- Vos attaques de corps à corps avec une arme infligent 1d6 dégâts de force supplémentaires quand elles touchent.

**Grand arbre**. Votre peau devient écorce et des feuilles poussent dans vos cheveux. Vous gagnez ces avantages :

- Vous gagnez 10 points de vie temporaires.
- Vous faites vos jets de sauvegarde de Constitution avec avantage.
- Vous faites vos jets d''attaque basés sur la Dextérité ou la Sagesse avec avantage.
- Si vous êtes au sol, le sol dans un rayon de 4,50 mètres autour de vous est un terrain difficile pour vos ennemis.', 8, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Gardien de la nature' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Gardien de la nature' AND s.ruleset = '5';

-- Ombre d'égarement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Ombre d''égarement', 4, '1 action', 0, '["V","S","M"]', 'un globe oculaire de mort-vivant enfermé dans une gemme d''une valeur d''au moins 150 po', '{"amount":150,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Des ombres en forme de flammes enveloppent votre corps jusqu''à la fin du sort, et pour les autres vous êtes dans une zone de visibilité nulle. Dans un rayon de 3 mètres, les ombres changent la lumière faible en ténèbres et la lumière vive en lumière faible. Jusqu''à la fin du sort, vous avez la résistance aux dégâts radiants, et chaque fois qu''une créature à 3 mètres ou moins de vous vous touche avec une attaque, les ombres se retournent contre elle et lui infligent 2d8 dégâts nécrotiques.', 7, NULL, NULL, NULL, '[{"damage_type":"necrotic","damage_at_slot_level":{"4":"2d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ombre d''égarement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Ombre d''égarement' AND s.ruleset = '5';

-- Rayonnement écoeurant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Rayonnement écoeurant', 4, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Une lumière verdâtre et tamisée emplit une sphère de 9 mètres de rayon centrée sur un point de votre choix à portée, contourne les angles et dure jusqu''à la fin du sort. Quand une créature entre dans la zone pour la première fois d''un tour ou y commence son tour, elle doit réussir un jet de sauvegarde de Constitution, sans quoi elle subit 4d10 dégâts radiants, gagne un niveau d''épuisement et émet une faible lueur verdâtre sur 1,50 mètre, qui l''empêche d''être invisible. La lumière et tous les niveaux d''épuisement causés par ce sort disparaissent quand il se termine.', 5, '{"ability":"con","success":"none"}', NULL, '{"shape":"sphere","size":9}', '[{"damage_type":"radiant","damage_at_slot_level":{"4":"4d10"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayonnement écoeurant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Rayonnement écoeurant' AND s.ruleset = '5';

-- Sphère aqueuse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sphère aqueuse', 4, '1 action', 27, '["V","S","M"]', 'une goutte d''eau', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous invoquez une sphère d''eau d''un rayon de 1,50 mètre, centrée sur un point que vous voyez à portée. Elle peut flotter, mais pas à plus de 3 mètres du sol, et dure toute la durée du sort.

Toute créature dans l''espace de la sphère doit effectuer un jet de sauvegarde de Force. En cas de réussite, elle est éjectée vers l''espace libre le plus proche hors de la sphère, au choix de la créature ; une créature de taille TG ou plus réussit automatiquement, et une créature de taille G ou inférieure peut choisir de rater. En cas d''échec, elle est entravée et engloutie par l''eau ; à la fin de chacun de ses tours, une cible entravée peut refaire le jet de sauvegarde et se libérer en cas de réussite.

La sphère peut entraver au plus quatre créatures de taille M ou inférieure, ou une créature de taille G. Si elle en entrave une de trop, une créature entravée tirée au hasard en tombe et se retrouve à terre à 1,50 mètre de la sphère.

Par une action, vous pouvez la déplacer de 9 mètres au plus en ligne droite ; au-dessus d''une fosse ou d''une falaise, elle redescend sans danger jusqu''à flotter à 3 mètres du sol. Les créatures entravées se déplacent avec elle. Vous pouvez viser des créatures avec la sphère, ce qui les oblige à faire le jet de sauvegarde.

Quand le sort se termine, la sphère tombe au sol et éteint les flammes normales dans un rayon de 9 mètres ; les créatures encore entravées tombent à terre dans l''espace où elle atterrit, puis l''eau disparaît.', 2, '{"ability":"str"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère aqueuse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère aqueuse' AND s.ruleset = '5';

-- Sphère de tempête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sphère de tempête', 4, '1 action', 45, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une sphère de vents tourbillonnants de 6 mètres de rayon apparaît brusquement, centrée sur un point de votre choix à portée, et dure toute la durée du sort. Chaque créature présente dans la zone à l''apparition, ou qui y termine son tour, doit réussir un jet de sauvegarde de Force, sans quoi elle subit 2d6 dégâts contondants. L''espace de la sphère est un terrain difficile.

Jusqu''à la fin du sort, vous pouvez utiliser une action bonus à chacun de vos tours pour lancer un éclair du centre de la sphère vers une créature de votre choix à 18 mètres ou moins de ce centre. Faites une attaque à distance avec un sort, avec avantage si la cible est dans la sphère ; en cas de réussite, elle subit 4d6 dégâts de foudre.

Les créatures à 9 mètres ou moins de la sphère ont un désavantage à leurs jets de Sagesse (Perception) pour écouter.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, les dégâts augmentent de 1d6 par niveau d''emplacement au-delà du niveau 4.', 5, '{"ability":"str","success":"none"}', 'ranged', '{"shape":"sphere","size":6}', '[{"damage_type":"bludgeoning","label":"Tourbillon","damage_at_slot_level":{"4":"2d6"}},{"damage_type":"lightning","label":"Éclair","damage_at_slot_level":{"4":"4d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère de tempête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère de tempête' AND s.ruleset = '5';

-- Sphère de vitriol
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Sphère de vitriol', 4, '1 action', 45, '["V","S","M"]', 'une goutte de bile de limace géante', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous visez un point à portée : une balle brillante d''acide émeraude de 30 cm de diamètre y file et y explose en une sphère de 6 mètres de rayon. Chaque créature de la zone doit effectuer un jet de sauvegarde de Dextérité. En cas d''échec, elle subit 10d4 dégâts d''acide, puis 5d4 dégâts d''acide à la fin de son prochain tour ; en cas de réussite, elle subit la moitié des dégâts initiaux et rien à la fin de son prochain tour.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 5 ou supérieur, les dégâts initiaux augmentent de 2d4 par niveau d''emplacement au-delà du niveau 4.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":6}', '[{"damage_type":"acid","label":"Dégâts initiaux","damage_at_slot_level":{"4":"10d4","5":"12d4","6":"14d4","7":"16d4","8":"18d4","9":"20d4"}},{"damage_type":"acid","label":"Fin du prochain tour","damage_at_slot_level":{"4":"5d4"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère de vitriol' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère de vitriol' AND s.ruleset = '5';

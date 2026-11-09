-- Sorts de niveau 9 du socle (#176 D1) : les 16 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_9.ts, gardé par test/nuxt/spellsLevel9Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Arrêt du temps
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Arrêt du temps', 9, '1 action', 0, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous arrêtez brièvement l''écoulement du temps pour tout le monde, sauf pour vous-même. Le temps ne s''écoule pas pour les autres créatures, tandis que vous profitez de 1d4 + 1 tours au cours desquels vous pouvez utiliser à votre guise les actions et mouvements qui vous sont dus normalement.

Ce sort prend fin si l''une des actions que vous utilisez lors de cette période, ou l''un des effets que vous créez au cours de cette période, affecte une créature autre que vous ou un objet étant porté par quelqu''un d''autre que vous. De plus, le sort prend fin si vous vous déplacez à plus de 300 mètres d''où vous l''avez lancé.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Arrêt du temps' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Arrêt du temps' AND s.ruleset = '5';

-- Changement de forme
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Changement de forme', 9, '1 action', 0, '["V","S","M"]', 'une fine couronne de jade valant au moins 1 500 po, que vous devez placer sur votre tête avant de lancer le sort', '{"amount":1500,"unit":"po"}', 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous prenez la forme d''une créature différente pour toute la durée du sort. La nouvelle forme peut être d''un FP inférieur ou égal à votre niveau. La créature ne peut pas être un mort-vivant ou un artificiel, et vous devez déjà avoir vu une créature de cette espèce au moins une fois. Vous vous transformez en un individu basique de cette espèce de créature, n''ayant ni niveau de classe ni de capacité de lanceur de sorts.

Vos statistiques de jeu sont remplacées par celles de la créature choisie, vous conservez cependant votre alignement et vos valeurs d''Intelligence, de Sagesse, et de Charisme. Vous conservez également vos maîtrises de compétences et de jets de sauvegarde, et gagnez en plus celles de votre nouvelle forme. Si la créature possède les mêmes maîtrises que vous et que son bonus est supérieur au vôtre, utilisez le bonus de la créature. Vous ne pouvez utiliser ni les actions légendaires ni les actions de repaire de votre nouvelle forme.

Votre total de points de vie et de dés de vie est celui de votre nouvelle forme. Lorsque vous revenez à votre forme normale, vous retrouvez les points de vie que vous aviez avant de vous transformez en une autre créature. Si vous revenez à votre forme normale parce que vous êtes tombé à 0 point de vie, les dégâts supplémentaires que vous avez reçus sont infligés à votre forme normale. Tant que les dégâts supplémentaires ne font pas tomber votre forme normale à 0 point de vie, vous ne devenez pas inconscient.

Vous conservez le bénéfice de toutes vos capacités de classe, de race, ou de toute autre source, et pouvez les utiliser, à condition que votre nouvelle forme physique vous le permette. Vous ne pouvez pas utiliser les sens spéciaux que vous aviez (comme la vision dans le noir par exemple) à moins que votre nouvelle forme les ait également. Vous ne pouvez parler que si la créature est normalement capable de parler.

Lorsque vous vous transformez, vous choisissez si votre équipement tombe sur le sol, fusionne avec votre nouvelle forme ou est porté par votre nouvelle forme. L''équipement porté fonctionne correctement, mais le MD décide pour chaque pièce d''équipement s''il est possible pour votre nouvelle forme de la porter, en fonction de la morphologie et de la taille de la créature. Votre équipement ne change pas de taille ou de forme pour s''adapter à votre nouvelle forme, et tout l''équipement que la nouvelle forme ne peut pas porter tombe sur le sol ou fusionne avec vous. L''équipement qui fusionne avec la nouvelle forme n''a aucun effet tant que vous restez sous cette forme.

Pour toute la durée du sort, vous pouvez utiliser votre action pour changer de nouveau de forme avec les mêmes conditions et règles que pour la forme précédente, à une exception près : si votre nouvelle forme possède plus de points de vie que votre forme actuelle, votre nombre de points de vie reste le même.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Changement de forme' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Changement de forme' AND s.ruleset = '5';

-- Emprisonnement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Emprisonnement', 9, '1 minute', 9, '["V","S","M"]', 'une représentation de vélin ou une statuette sculptée à l''effigie de la cible, et une composante spéciale qui varie en fonction de la version du sort que vous choisissez, d''une valeur d''au moins 500 po par dés de vie de la cible', '{"amount":500,"unit":"po"}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous créez une contrainte magique qui maintient prisonnière une créature que vous pouvez voir dans la portée du sort. La cible doit réussir un jet de sauvegarde de Sagesse ou être retenue par le sort. Si elle réussit, elle est à l''abri de ce sort si vous le lui lancez à nouveau. Lorsqu''elle est affectée par ce sort, la créature n''a pas besoin de respirer, de manger ou de boire, et elle ne vieillit pas. Les sorts de divination ne peuvent pas localiser ou percevoir la cible. Quand vous lancez le sort, choisissez l''une des formes d''emprisonnement suivantes.

**Enterrement**. La cible est ensevelie profondément sous la terre dans une sphère de force magique juste assez grande pour la contenir. Rien ne peut passer à travers la sphère, et aucune créature ne peut se téléporter ou utiliser les voyages planaires pour entrer ou sortir de celle-ci.

La composante spéciale pour cette version du sort est un petit orbe de mithral.

**Enchaînement**. De lourdes chaînes, bien ancrées au sol, maintiennent la cible en place. La cible est entravée jusqu''à ce que le sort prenne fin, et elle ne peut pas se déplacer ou être déplacée par quelconques moyens pendant ce temps.

La composante spéciale pour cette version du sort est une fine chaîne d''un métal précieux.

**Prison enclavée**. Le sort transporte la cible dans un tout petit demi-plan qui est protégé contre la téléportation et le voyage planaire. Le demi-plan peut être un labyrinthe, une cage, une tour, ou toute structure similaire de confinement ou autre zone de votre choix.

La composante spéciale pour cette version du sort est une représentation miniature en jade de la prison.

**Confinement minimus**. La cible rétrécit jusqu''à une hauteur de 2,50 cm et est emprisonnée à l''intérieur d''une pierre précieuse ou autre objet similaire. La lumière peut passer à travers la pierre normalement (permettant ainsi à la cible de voir à l''extérieur et à d''autres créatures de voir à l''intérieur), mais rien d''autre ne peut passer à travers, même par des moyens de téléportation ou des voyages planaires. La pierre précieuse ne peut pas être taillée ou cassée tant que le sort est en vigueur.

La composante spéciale pour cette version du sort est une grande pierre précieuse transparente, telle qu''un corindon, un diamant ou un rubis.

**Sommeil éternel**. La cible s''endort et ne peut pas être réveillée.

La composante spéciale pour cette version du sort se compose d''herbes soporifiques rares.

**Terminer le sort**. Lors de l''incantation du sort, quelle que soit sa version, vous pouvez spécifier une condition qui provoque la fin du sort et libérera ainsi la cible. La condition peut être aussi spécifique ou complexe que vous le souhaitez, mais le MD doit convenir que la condition est raisonnable et qu''elle a une probabilité de survenir. Les conditions peuvent être basées sur le nom, l''identité ou le dieu d''une créature, mais également sur des actions ou des qualités observables, et non sur des éléments intangibles tels que le niveau, la classe ou les points de vie.

Un sort de *dissipation de la magie* ne peut mettre un terme au sort que s''il est lancé avec un emplacement de sort de niveau 9, ciblant soit la prison, soit la composante spéciale utilisée pour la créer.

Vous ne pouvez utiliser une composante spéciale particulière que pour créer une seule prison à la fois. Si vous lancez le sort à nouveau en utilisant la même composante, la cible de la première incantation est immédiatement libérée de ses entraves.', 1, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Emprisonnement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Emprisonnement' AND s.ruleset = '5';

-- Ennemi subconscient
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Ennemi subconscient', 9, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Puisant dans les peurs les plus profondes d''un groupe de créatures, vous créez des créatures illusoires dans leur esprit, qu''elles sont les seules à voir. Chaque créature se trouvant dans une sphère de 9 mètres de rayon centrée sur un point de votre choix et à portée, doit effectuer un jet de sauvegarde de Sagesse. En cas d''échec, la créature devient effrayée pour toute la durée du sort. L''illusion fait appel aux peurs les plus profondes de la créature, donnant vie à ses pires cauchemars, telle une menace implacable. À la fin de chacun de ses tours, la créature affectée doit réussir un jet de sauvegarde de Sagesse ou subir 4d10 dégâts psychiques. En cas de réussite, le sort prend fin pour cette créature.', 6, '{"ability":"wis","success":"none"}', NULL, '{"shape":"sphere","size":9}', '[{"damage_type":"psychic","damage_at_slot_level":{"9":"4d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ennemi subconscient' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Ennemi subconscient' AND s.ruleset = '5';

-- Guérison de groupe
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Guérison de groupe', 9, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un flot d''énergie curative émane de votre personne vers les créatures blessées qui vous entourent. Vous redonnez jusqu''à 700 points de vie, répartis à votre guise entre les créatures de votre choix qui sont visibles dans la portée du sort. Les créatures soignées par ce sort sont aussi guéries de toutes maladies et des effets qui les rendent sourds ou aveugles. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.', 5, NULL, NULL, NULL, NULL, '{"heal_type":"hit_points","heal_at_slot_level":{"9":"700"}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Guérison de groupe' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Guérison de groupe' AND s.ruleset = '5';

-- Métamorphose suprême
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Métamorphose suprême', 9, '1 action', 9, '["V","S","M"]', 'une goutte de mercure, une bonne dose de gomme arabique, et une volute de fumée', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Choisissez une créature ou un objet non magique que vous pouvez voir et à portée. Vous transformez la créature en une créature différente, la créature en un objet non magique, ou l''objet en une créature (l''objet ne doit ni être porté ni être tenu par une autre créature). La transformation reste effective pour toute la durée du sort, ou jusqu''à ce que la cible tombe à 0 point de vie ou meurt. Le sort ne peut pas affecter une cible dont les points de vie sont à 0. Si vous vous concentrez sur ce sort pendant toute sa durée, la transformation persiste jusqu''à ce que le sort soit dissipé.

Les métamorphes ne sont pas affectés par ce sort. Une créature non-consentante peut effectuer un jet de sauvegarde de Sagesse pour, si elle le réussit, ne pas être affectée par ce sort.

**Créature en créature**. Si vous transformez une créature en un autre type de créature, la nouvelle forme peut être du type de votre choix à condition que le FP de la nouvelle forme soit inférieur ou égal à celui de la cible (ou à son niveau, si la cible n''a pas de facteur de puissance). Les statistiques de jeu de la cible, y compris ses valeurs de caractéristiques psychiques, sont remplacées par celles de la nouvelle forme. Elle conserve son alignement et sa personnalité. La cible obtient les points de vie de sa nouvelle forme, et lorsqu''elle retrouve sa forme normale, la créature récupère également les points de vie qu''elle avait avant d''être transformée. Si elle retrouve sa forme originelle parce que les points de vie de sa nouvelle forme sont tombés à 0, les dégâts restants sont infligés à sa forme normale. Tant que les dégâts restant ne font pas tomber la forme de la créature à 0 point de vie, elle ne sombre pas dans l''inconscience.

La créature est limitée dans les actions qu''elle peut entreprendre par la nature de sa nouvelle forme, et elle ne peut pas parler, ni lancer des sorts, ni effectuer la moindre action qui nécessite des mains ou la parole, à moins que sa nouvelle forme ne soit capable de telles actions.

L''équipement de la cible fusionne avec sa nouvelle forme. La créature ne peut pas activer, utiliser, manipuler ou recevoir le moindre avantage de son équipement.

**Objet en créature**. Vous pouvez transformer un objet en une créature de n''importe quel type, à condition que la taille de la créature ne soit pas supérieure à celle de l''objet et que son FP soit inférieur ou égal à 9. La créature a une attitude amicale envers vous et vos compagnons. Elle agit à chacun de vos tours. Vous décidez des actions qu''elle effectue et de ses déplacements. Le MD possède les statistiques de la créature et résout ses actions et ses déplacements.

Si le sort devient permanent, vous ne pouvez plus contrôler la créature. Elle pourrait conserver son attitude amicale envers vous, en fonction de la manière dont vous l''avez traité.

**Créature en objet**. Si vous transformez une créature en objet, elle endosse sa nouvelle forme avec tout l''équipement qu''elle transporte ou tient, à condition que la taille de l''objet ne soit pas supérieure à celle de la créature. Les statistiques de la créature deviennent celles de l''objet, et la créature n''a aucun souvenir du temps passé sous cette forme une fois qu''elle retrouve sa forme normale.', 8, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Métamorphose suprême' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Métamorphose suprême' AND s.ruleset = '5';

-- Mot de pouvoir guérisseur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mot de pouvoir guérisseur', 9, '1 action', 1.5, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une vague d''énergie curative parcourt la créature que vous touchez. La cible récupère tous ses points de vie. Si la créature est charmée, effrayée, paralysée ou étourdie, cet état prend fin. Si la créature est à terre, elle peut utiliser sa réaction pour se mettre debout. Ce sort n''a pas d''effet sur les morts-vivants et les artificiels.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de pouvoir guérisseur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde') AND c.ruleset = '5'
WHERE s.name = 'Mot de pouvoir guérisseur' AND s.ruleset = '5';

-- Mot de pouvoir mortel
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mot de pouvoir mortel', 9, '1 action', 18, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous prononcez un mot de pouvoir qui peut contraindre une créature que vous pouvez voir et à portée de sort à mourir instantanément. Si la créature possède 100 points de vie ou moins, elle meurt. Dans le cas contraire, le sort n''a aucun effet.', 4, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de pouvoir mortel' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Mot de pouvoir mortel' AND s.ruleset = '5';

-- Mur prismatique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Mur prismatique', 9, '1 action', 18, '["V","S"]', NULL, NULL, 0, '10 minutes', 'minute', 10, 0, 'Un plan de lumières multicolores et chatoyantes forme un mur vertical et opaque (jusqu''à 27 mètres de long, 9 mètres de haut et 2,50 cm d''épaisseur) centré sur un point que vous pouvez voir et à portée. Vous pouvez sinon donner au mur la forme d''une sphère de 9 mètres de diamètre centrée sur un point que vous choisissez à portée. Le mur reste en place pour toute la durée du sort. Si vous placez le mur de sorte qu''il traverse l''espace occupé par une créature, le sort échoue, et votre action et l''emplacement du sort sont dépensés pour rien.

Le mur émet une lumière vive sur 30 mètres et une lumière faible sur 30 mètres supplémentaires. Vous, et les créatures que vous désignez au moment où vous lancez le sort, pouvez passer au travers ou rester à côté du mur sans en être affecté. Si une autre créature qui peut voir le mur se déplace à 6 mètres du mur (ou moins) ou débute son tour dans cette zone, elle doit réussir un jet de sauvegarde de Constitution sous peine d''être aveuglée pendant 1 minute.

Le mur est constitué de sept couches, chacune ayant une couleur différente. Lorsqu''une créature tente de pénétrer ou de traverser le mur, elle ne passe qu''une couche à la fois sur toutes les couches du mur. À chaque fois qu''elle passe une couche du mur, la créature doit réussir un jet de sauvegarde de Dextérité sous peine d''être affectée par le pouvoir de la couche en question (voir ci-dessous).

Le mur peut être détruit, une couche à la fois dans l''ordre indiqué ci-dessous (du rouge au violet), et d''une manière spécifique pour chaque couche. Une fois qu''une couche est détruite, elle le reste pour toute la durée du sort. *Champ antimagie* n''a aucun effet sur le mur et *dissipation de la magie* n''affecte que la couche violette.

**1. Rouge**. La créature subit 10d6 dégâts de feu en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite. Tant que cette couche est en place, les attaques à distance non magiques ne peuvent pas passer au travers du mur. La couche peut être détruite en lui infligeant au moins 25 points de dégâts de froid.

**2. Orange**. La créature subit 10d6 dégâts d''acide en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite. Tant que cette couche est en place, les attaques à distance magiques ne peuvent pas passer au travers du mur. La couche est détruite par un vent fort.

**3. Jaune**. La créature subit 10d6 dégâts de foudre en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite. Cette couche peut être détruite en lui infligeant au moins 60 points de dégâts de force.

**4. Vert**. La créature subit 10d6 dégâts de poison en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite. Un sort de *passe-muraille*, ou tout autre sort de niveau égal ou supérieur permettant d''ouvrir un portail sur une surface solide, détruit cette couche.

**5. Bleu**. La créature subit 10d6 dégâts de froid en cas d''échec à son jet de sauvegarde, ou la moitié de ces dégâts en cas de réussite. Cette couche peut être détruite en lui infligeant 25 points de dégâts de feu.

**6. Indigo**. En cas d''échec au jet de sauvegarde, la créature est entravée. Elle doit réussir un jet de sauvegarde de Constitution à la fin de chacun de ses tours. Si elle réussit trois fois son jet de sauvegarde, le sort prend fin. Si elle échoue trois fois son jet de sauvegarde, elle est changée en pierre de manière permanente et soumise à l''état pétrifié. Les réussites ou les échecs n''ont pas besoin d''être consécutifs ; conservez une trace des résultats de vos tours passés jusqu''à ce que vous cumuliez trois réussites ou trois échecs.

Tant que cette couche est en place, les sorts ne peuvent être lancés au travers du mur. Cette couche est détruite par une importante source de lumière vive, comme celle émise par le sort *lumière du jour*, ou n''importe quel sort similaire d''un niveau égal ou supérieur.

**7. Violet**. En cas d''échec au jet de sauvegarde, la créature est aveuglée. Elle doit alors réussir un jet de sauvegarde de Sagesse au début de votre prochain tour. Si elle réussit ce nouveau jet de sauvegarde, elle n''est plus aveuglée. Si elle échoue ce nouveau jet de sauvegarde, la créature est transportée dans un autre plan d''existence que le MD choisit, et n''est plus aveuglée (typiquement, une créature qui ne se trouve pas dans son plan d''existence originel y est renvoyée, tandis que les autres créatures sont généralement envoyées dans le plan Astral ou le plan éthéré). Cette couche peut être détruite par un sort de *dissipation de la magie* ou tout autre sort similaire d''un niveau supérieur ou égal qui peut mettre un terme aux sorts ou aux effets magiques.', 1, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","label":"Couche 1, rouge","damage_at_slot_level":{"9":"10d6"}},{"damage_type":"acid","label":"Couche 2, orange","damage_at_slot_level":{"9":"10d6"}},{"damage_type":"lightning","label":"Couche 3, jaune","damage_at_slot_level":{"9":"10d6"}},{"damage_type":"poison","label":"Couche 4, vert","damage_at_slot_level":{"9":"10d6"}},{"damage_type":"cold","label":"Couche 5, bleu","damage_at_slot_level":{"9":"10d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mur prismatique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mur prismatique' AND s.ruleset = '5';

-- Nuée de météores
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Nuée de météores', 9, '1 action', 1500, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Des orbes de feux ardents s''abattent sur le sol à quatre différents points visibles dans la portée du sort. Toute créature à l''intérieur d''une sphère de 12 mètres de rayon centrée sur chaque point doit effectuer un jet de sauvegarde de Dextérité, subissant 20d6 dégâts de feu et 20d6 dégâts contondants en cas d''échec, ou la moitié de ces dégâts en cas de réussite. L''effet de la sphère contourne les coins. Une créature prise dans plus d''une sphère n''est affectée qu''une seule fois.

Le sort endommage les objets dans la zone et enflamme les objets inflammables qui ne sont pas portés ou transportés.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"sphere","size":12}', '[{"damage_type":"fire","damage_at_slot_level":{"9":"20d6"}},{"damage_type":"bludgeoning","damage_at_slot_level":{"9":"20d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nuée de météores' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Nuée de météores' AND s.ruleset = '5';

-- Portail
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Portail', 9, '1 action', 18, '["V","S","M"]', 'un diamant valant au moins 5000 po', '{"amount":5000,"unit":"po"}', 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous invoquez un portail reliant un espace inoccupé que vous voyez dans la portée du sort à un endroit précis sur un plan d''existence différent. Le portail se présente comme une ouverture circulaire, dont vous contrôlez le diamètre, entre 1,50 et 6 mètres. Vous pouvez orienter le portail dans n''importe quelle direction. Le portail persiste selon la durée du sort.

Le portail possède un avant et un arrière sur chaque plan où il apparait. Le passage dans le portail n''est possible qu''en pénétrant par l''avant. Tout ce qui traverse est instantanément transporté sur l''autre plan pour apparaître dans l''espace inoccupé le plus près du portail.

Les divinités et autres dirigeants planaires peuvent empêcher l''ouverture d''un portail créé par ce sort lorsqu''elle se fait en leur présence ou à tout endroit sur leurs domaines.

Lorsque vous lancez ce sort, vous pouvez énoncer le nom d''une créature spécifique (un pseudonyme, un titre ou un surnom ne suffit pas). Si cette créature est sur un plan différent du vôtre, le portail s''ouvre à proximité de la créature nommée, laquelle est aussitôt aspirée par le portail pour apparaître dans un espace inoccupé de votre côté du portail. Vous ne bénéficiez d''aucun pouvoir spécial sur la créature et elle libre d''agir selon la volonté du MD. Elle peut partir, vous attaquer ou vous aider.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Portail' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Portail' AND s.ruleset = '5';

-- Prémonition
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Prémonition', 9, '1 minute', 1.5, '["V","S","M"]', 'la plume d''un colibri', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous touchez une créature consentante pour lui octroyer une faculté limitée de voir son futur immédiat. Pour la durée du sort, la cible ne peut être surprise et elle bénéficie d''un avantage aux jets d''attaque, de sauvegarde et de caractéristique. De plus, les jets d''attaque des autres créatures contre la cible ont un désavantage pour la durée du sort.

Le sort prend immédiatement fin si vous l''incantez à nouveau avant la fin de la durée.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Prémonition' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Prémonition' AND s.ruleset = '5';

-- Projection astrale
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Projection astrale', 9, '1 heure', 3, '["V","S","M"]', 'pour chaque créature que vous ciblez avec ce sort, vous devez fournir une jacinthe valant au moins 1 000 po et un lingot d''argent ornementé de gravures valant au moins 100 po, que le sort consomme', '{"amount":1000,"unit":"po","consumed":true}', 0, 'Spéciale', 'special', NULL, 0, 'Vous et jusqu''à huit créatures consentantes dans la portée du sort projetez vos corps astraux dans le plan Astral (le sort échoue et l''incantation est perdue si vous êtes déjà sur ce plan). Les corps matériels laissés derrière sont inconscients et dans un état d''animation suspendue. Ils ne requièrent ni sustentation ni air et ils ne vieillissent pas.

Votre corps astral est similaire à votre forme mortelle à presque tous les égards. Vos possessions et vos statistiques de jeu sont ainsi répliquées. La principale différence est l''ajout d''un cordon argenté qui prend son origine entre vos omoplates et qui traine derrière vous, pour disparaitre après 30 cm. Ce cordon est votre attache avec votre corps matériel. Aussi longtemps que l''attache demeure intacte, vous pouvez retourner sur votre plan. Si le cordon est tranché, un incident qui ne survient que si un effet spécifie que c''est le cas, votre âme et votre corps sont séparés, vous tuant sur le coup.

Votre forme astrale peut se déplacer librement à travers le plan Astral et elle peut emprunter des portails vous menant sur tout autre plan. Si vous entrez sur un nouveau plan ou si vous retournez sur le plan d''où le sort fut incanté, votre corps et vos possessions sont transportés le long du cordon argenté, vous permettant de reprendre votre forme matérielle lors de votre arrivée sur le nouveau plan. Votre forme astrale est une incarnation distincte. Les dégâts ou les effets qu''elle subit n''ont pas d''impact sur votre corps physique et ils ne l''affectent pas lorsque vous y retournez.

Le sort prend fin pour vous et vos compagnons lorsque vous utilisez une action pour le dissiper. Lorsque le sort se termine, les créatures ciblées retournent à leur corps physique puis elles reprennent conscience.

Le sort peut aussi se terminer prématurément pour vous ou un de vos compagnons. Une *dissipation de la magie* réussie sur un corps astral ou physique interrompt le sort pour cette créature. Si le corps d''origine ou sa forme astrale tombe à 0 point de vie, le sort s''interrompt pour cette créature. Si le sort se termine et que le cordon argenté est toujours intact, le cordon ramène la forme astrale de la créature à son corps, ce qui met un terme à l''état d''animation suspendue.

Si vous êtes retourné à votre corps prématurément, vos compagnons conservent leur forme astrale et ils doivent trouver eux-mêmes le chemin du retour, en tombant à 0 point de vie, habituellement.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Projection astrale' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Projection astrale' AND s.ruleset = '5';

-- Résurrection suprême
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Résurrection suprême', 9, '1 heure', 1.5, '["V","S","M"]', 'une aspersion d''eau bénite et des diamants d''une valeur d''au moins 25 000 po, que le sort consomme', '{"amount":25000,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Vous touchez une créature qui est morte depuis moins de 200 ans mais qui n''est pas morte de vieillesse. Si l''âme de la créature est libre et consentante, la créature est ramenée à la vie avec tous ses points de vie.

Ce sort referme toutes les blessures, neutralise tout poison, guérit toutes les maladies et lève toutes les malédictions affectant la créature lorsqu''elle est morte. Le sort remplace les organes endommagés ou les membres manquants. Si la créature était un mort-vivant, elle revient sous la forme qu''elle avait avant de devenir un mort-vivant.

Le sort peut même fournir un nouveau corps si l''original n''existe plus. Dans ce cas, vous devez prononcer le nom de la créature et la créature apparaît alors dans un espace inoccupé que vous choisissez à 3 mètres ou moins de vous.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Résurrection suprême' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Résurrection suprême' AND s.ruleset = '5';

-- Souhait
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Souhait', 9, '1 action', 0, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, '*Souhait* est le sort le plus puissant qu''une créature mortelle puisse lancer. Simplement en parlant à haute voix, vous pouvez altérer les fondements mêmes de la réalité selon vos désirs.

L''utilisation la plus basique de ce sort est de dupliquer n''importe quel autre sort de niveau 8 ou inférieur. Aucune condition n''est exigée pour ce sort, pas même la nécessité de composantes couteuses. Le sort prend simplement effet. Vous pouvez également créer un des effets suivants de votre choix :

- Vous créez un objet non magique d''une valeur maximale de 25 000 po. L''objet ne peut faire plus de 90 mètres d''arête et apparait sur le sol dans un espace inoccupé que vous pouvez voir.
- Vous permettez à un maximum de vingt créatures que vous pouvez voir de récupérer tous leurs points de vie et vous dissipez tous les effets les affectant, comme décrit dans le sort *restauration supérieure*.
- Vous accordez à un maximum de dix créatures que vous pouvez voir une résistance à un type de dégâts de votre choix.
- Vous accordez à un maximum de dix créatures que vous pouvez voir l''immunité à un sort unique ou un autre effet magique pendant 8 heures. Par exemple, vous pouvez vous immuniser ainsi que vos compagnons contre l''attaque drainante d''une liche.
- Vous annulez un événement unique récent en obligeant un nouveau jet de dés en remplacement de n''importe quel jet effectué durant le dernier round (incluant votre dernier tour). La réalité se transforme pour correspondre au nouveau lancer. Par exemple, un sort de *souhait* peut annuler la réussite d''un jet de sauvegarde ennemi, le coup critique d''un adversaire ou un jet de sauvegarde allié manqué. Vous pouvez imposer un jet avec avantage ou désavantage, et vous pouvez choisir d''utiliser le nouveau résultat du lancer ou l''ancien.

Vous pouvez également réaliser d''autres choses que les exemples ci-dessus. Décrivez votre souhait à votre MD de la manière la plus précise possible. Le MD est libre de déterminer ce qui se produit dans ce cas ; plus le souhait est important, plus la probabilité est grande que quelque chose tourne mal. Ce sort pourrait simplement échouer, l''effet que vous souhaitez pourrait être seulement partiellement exécuté, ou vous pourriez subir d''imprévisibles conséquences en fonction de votre formulation du souhait. Par exemple, souhaiter qu''un ennemi soit mort pourrait vous propulser à une époque future où votre ennemi n''est plus vivant, vous éliminant ainsi efficacement du jeu. De la même manière, désirer un objet magique légendaire ou un artéfact pourrait vous transporter instantanément en présence de l''actuel possesseur de l''objet.

Le stress de lancer ce sort pour produire un effet autre que la reproduction d''un autre sort vous affaiblit. Après avoir subi cette tension, chaque fois que vous lancez un sort avant d''avoir terminé un repos long, vous subissez 1d10 dégâts nécrotiques par niveau de sort. Ces dégâts ne peuvent être réduits ou évités, d''une quelconque manière. De plus, votre Force tombe à 3, si elle n''est pas déjà inférieure à 3, pendant 2d4 jours. Pour chaque jour passé à vous reposer ou à pratiquer une activité mineure, votre temps de récupération diminue de 2 jours. Enfin, vous avez 33 % de chance de ne plus jamais être capable de lancer le sort *souhait* si vous avez subi ce stress.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Souhait' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Souhait' AND s.ruleset = '5';

-- Tempête vengeresse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Tempête vengeresse', 9, '1 action', 100000, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Des nuages orageux tourbillonnants apparaissent, centrés sur un point que vous pouvez voir et s''étalant dans un rayon de 108 mètres. Des éclairs zèbrent le ciel dans la zone, le tonnerre éclate, et de puissants vents font rage. Chaque créature située sous le nuage (à 1 500 mètres au-dessous maximum) lorsqu''il apparaît doit effectuer un jet de sauvegarde de Constitution. En cas d''échec, une créature subit 2d6 dégâts de tonnerre et est assourdie pendant 5 minutes.

Pour chaque round durant lequel vous maintenez votre concentration sur ce sort, la tempête produit différents effets lors de votre tour.

**Round 2**. Une pluie acide tombe du nuage. Chaque créature ou objet sous le nuage subit 1d6 dégâts d''acide.

**Round 3**. Vous appelez six éclairs pour qu''ils frappent chacun une créature ou un objet de votre choix et situé sous le nuage. Une créature ou un objet ne peut être ciblé par plus d''un éclair. Une créature touchée doit effectuer un jet de sauvegarde de Dextérité, subissant 10d6 dégâts de foudre en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

**Round 4**. Une pluie de grêlon s''abat. Chaque créature située sous le nuage subit 2d6 dégâts contondants.

**Round 5-10**. Des rafales de vent et des pluies glaciales se déchaînent dans la zone sous le nuage. La zone devient un terrain difficile et est profondément obscurcie. Chaque créature qui s''y trouve subit 1d6 dégâts de froid. Les attaques à distance avec une arme sont impossibles dans la zone. Le vent et la pluie compte comme une distraction importante pour ce qui est de maintenir sa concentration sur ses sorts. Enfin, les puissantes rafales de vent (atteignant 30 à 75 km/h) dispersent automatiquement le brouillard, le brume, et tout autre phénomène similaire dans la zone, qu''ils soient naturels ou magiques.', 2, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"thunder","label":"Apparition du nuage","damage_at_slot_level":{"9":"2d6"}},{"damage_type":"acid","label":"Round 2","damage_at_slot_level":{"9":"1d6"}},{"damage_type":"lightning","label":"Round 3 (jet de Dextérité)","damage_at_slot_level":{"9":"10d6"}},{"damage_type":"bludgeoning","label":"Round 4","damage_at_slot_level":{"9":"2d6"}},{"damage_type":"cold","label":"Rounds 5 à 10","damage_at_slot_level":{"9":"1d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tempête vengeresse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Tempête vengeresse' AND s.ruleset = '5';

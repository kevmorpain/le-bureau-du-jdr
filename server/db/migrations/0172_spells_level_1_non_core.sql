-- Sorts de niveau 1 hors socle (Xanathar, Tasha) (#176 D1) : les 10 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_1.ts, gardé par test/nuxt/spellsLevelHorsSocle1Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Absorption des éléments
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Absorption des éléments', 1, '1 réaction', 0, '["S"]', NULL, NULL, 0, '1 round', 'round', 1, 0, 'Réaction déclenchée lorsque vous subissez des dégâts d''acide, de froid, de feu, de foudre ou de tonnerre.

Le sort absorbe une partie de l''énergie reçue : vous avez la résistance à ce type de dégâts jusqu''au début de votre prochain tour, et vous emmagasinez cette énergie pour votre prochaine attaque au corps à corps. La première fois que vous touchez au corps à corps à votre prochain tour, la cible subit 1d6 dégâts supplémentaires du type qui a déclenché le sort, puis le sort prend fin.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, les dégâts supplémentaires augmentent de 1d6 par niveau d''emplacement au-delà du niveau 1.', 1, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Absorption des éléments' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Absorption des éléments' AND s.ruleset = '5';

-- Catapulte
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Catapulte', 1, '1 action', 18, '["S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Choisissez un objet non porté ni transporté, pesant de 500 g à 2,5 kg, à portée. Il file en ligne droite sur 27 mètres au plus dans la direction de votre choix, puis retombe, en s''arrêtant plus tôt s''il rencontre une surface solide. S''il va frapper une créature, celle-ci doit réussir un jet de sauvegarde de Dextérité ; en cas d''échec, l''objet la frappe et s''arrête. Lorsqu''il heurte quelque chose, l''objet et ce qu''il frappe subissent chacun 3d8 dégâts contondants.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, le poids maximal de l''objet augmente de 2,5 kg et les dégâts de 1d8 par niveau d''emplacement au-delà du niveau 1.', 8, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"1":"3d8","2":"4d8","3":"5d8","4":"6d8","5":"7d8","6":"8d8","7":"9d8","8":"10d8","9":"11d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Catapulte' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Catapulte' AND s.ruleset = '5';

-- Cérémonie
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Cérémonie', 1, '1 heure', 1.5, '["V","S","M"]', '25 po de poudre d''argent, que le sort consomme', '{"amount":25,"unit":"po","consumed":true}', 1, 'Instantanée', 'instant', NULL, 0, 'Vous accomplissez un rite religieux imprégné de magie. Choisissez l''un des rites suivants ; la cible doit rester à 3 mètres ou moins de vous pendant toute l''incantation.

**Expiation**. Vous touchez une créature consentante dont l''alignement a changé et faites un jet de Sagesse (Intuition) de DD 20 ; en cas de réussite, son alignement d''origine est restauré.

**Eau bénite**. Vous touchez une fiole d''eau, qui devient de l''eau bénite.

**Passage à l''âge adulte**. Vous touchez un humanoïde assez âgé pour être un jeune adulte. Pendant les 24 heures suivantes, il peut lancer un d4 et l''ajouter à chacun de ses jets de caractéristique. Une créature ne profite de ce rite qu''une seule fois.

**Dévouement**. Vous touchez un humanoïde qui souhaite servir votre dieu. Pendant les 24 heures suivantes, il peut lancer un d4 et l''ajouter à chacun de ses jets de sauvegarde. Une créature ne profite de ce rite qu''une seule fois.

**Rite funéraire**. Vous touchez un cadavre : pendant les 7 jours suivants, il ne peut devenir un mort-vivant que par le sort *souhait*.

**Mariage**. Vous touchez des humanoïdes adultes prêts à s''unir par le mariage. Pendant les 7 jours suivants, chacun gagne un bonus de +2 à la CA tant qu''ils sont à 9 mètres ou moins l''un de l''autre. Une créature ne profite de nouveau de ce rite que si elle est veuve.', 1, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cérémonie' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Cérémonie' AND s.ruleset = '5';

-- Collet
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Collet', 1, '1 minute', 1.5, '["S","M"]', '7,50 mètres de corde, que le sort consomme', '{"consumed":true}', 0, '8 heures', 'hour', 8, 0, 'Vous utilisez la corde pour tracer au sol un cercle de 1,50 mètre de rayon ; la corde disparaît et le cercle devient un piège magique.

Le piège est presque invisible : le déceler demande un jet d''Intelligence (Investigation) réussi contre le DD de sauvegarde de votre sort.

Il se déclenche lorsqu''une créature de taille P, M ou G marche dans le cercle. Elle doit réussir un jet de sauvegarde de Dextérité, sans quoi elle est hissée par magie dans les airs, la tête en bas, à 90 cm du sol, et entravée jusqu''à la fin du sort.

Une créature entravée peut refaire le jet de sauvegarde à la fin de chacun de ses tours pour se libérer. Elle, ou toute personne qui peut l''atteindre, peut aussi utiliser son action pour réussir un jet d''Intelligence (Arcanes) contre le DD de sauvegarde de votre sort et mettre fin à l''entrave.

Une fois le piège déclenché, le sort se termine dès qu''il ne retient plus aucune créature.', 1, '{"ability":"dex","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Collet' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Collet' AND s.ruleset = '5';

-- Couteau de glace
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Couteau de glace', 1, '1 action', 18, '["S","M"]', 'une goutte d''eau ou un bout de glace', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous formez un éclat de glace et le lancez sur une créature à portée : faites une attaque à distance avec un sort. En cas de réussite, la cible subit 1d10 dégâts perforants. Que l''attaque touche ou non, l''éclat explose : la cible et toutes les créatures à 1,50 mètre ou moins d''elle doivent réussir un jet de sauvegarde de Dextérité, sans quoi elles subissent 2d6 dégâts de froid.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, les dégâts de froid augmentent de 1d6 par niveau d''emplacement au-delà du niveau 1.', 2, '{"ability":"dex","success":"none"}', 'ranged', '{"shape":"sphere","size":1.5}', '[{"damage_type":"piercing","label":"Éclat","damage_at_slot_level":{"1":"1d10"}},{"damage_type":"cold","label":"Explosion","damage_at_slot_level":{"1":"2d6","2":"3d6","3":"4d6","4":"5d6","5":"6d6","6":"7d6","7":"8d6","8":"9d6","9":"10d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Couteau de glace' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Couteau de glace' AND s.ruleset = '5';

-- Frappe du zéphyr
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Frappe du zéphyr', 1, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous vous déplacez comme le vent : jusqu''à la fin du sort, vos déplacements ne provoquent pas d''attaques d''opportunité.

Une fois avant la fin du sort, à votre tour, vous pouvez vous donner l''avantage à un jet d''attaque avec une arme ; si elle touche, elle inflige 1d8 dégâts de force supplémentaires. Que vous touchiez ou non, votre vitesse augmente de 9 mètres jusqu''à la fin de ce tour.', 8, NULL, NULL, NULL, '[{"damage_type":"force","damage_at_slot_level":{"1":"1d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Frappe du zéphyr' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Frappe du zéphyr' AND s.ruleset = '5';

-- Frayeur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Frayeur', 1, '1 action', 18, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous éveillez chez une créature que vous voyez à portée la conscience de sa mortalité. Les morts-vivants et les artificiels y sont immunisés. La cible doit réussir un jet de sauvegarde de Sagesse, sans quoi elle est effrayée jusqu''à la fin du sort ; elle peut refaire le jet à la fin de chacun de ses tours pour mettre fin à l''effet.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, vous pouvez cibler une créature de plus par niveau d''emplacement au-delà du niveau 1, à condition que les cibles soient à 9 mètres ou moins les unes des autres.', 7, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Frayeur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Frayeur' AND s.ruleset = '5';

-- Lien avec une bête
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Lien avec une bête', 1, '1 action', 1.5, '["V","S","M"]', 'un morceau de fourrure enveloppé dans un linge', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous nouez un lien télépathique avec une bête que vous touchez et qui est amicale ou charmée par vous ; le sort échoue si son Intelligence est de 4 ou plus. Jusqu''à la fin du sort, le lien dure tant que vous et la bête êtes en vue l''un de l''autre. Par ce lien, la bête comprend vos messages télépathiques et peut vous renvoyer ses émotions et des idées simples. Tant qu''il est actif, la bête a l''avantage à ses jets d''attaque contre toute créature que vous voyez à 1,50 mètre ou moins de vous.', 3, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lien avec une bête' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Lien avec une bête' AND s.ruleset = '5';

-- Mixture caustique de Tasha
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mixture caustique de Tasha', 1, '1 action', 0, '["V","S","M"]', 'un peu de nourriture pourrie', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un jet d''acide long de 9 mètres et large de 1,50 mètre jaillit de vous dans la direction de votre choix. Chaque créature sur la ligne doit réussir un jet de sauvegarde de Dextérité, sans quoi elle est couverte d''acide pour la durée du sort ou jusqu''à ce qu''une créature utilise son action pour l''essuyer (sur elle-même ou sur une autre). Une créature couverte d''acide subit 2d4 dégâts d''acide au début de chacun de ses tours.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, les dégâts augmentent de 2d4 par niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"acid","damage_at_slot_level":{"1":"2d4","2":"4d4","3":"6d4","4":"8d4","5":"10d4","6":"12d4","7":"14d4","8":"16d4","9":"18d4"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mixture caustique de Tasha' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Mixture caustique de Tasha' AND s.ruleset = '5';

-- Secousse sismique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Secousse sismique', 1, '1 action', 3, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous faites trembler le sol à portée. Chaque créature autre que vous dans la zone doit réussir un jet de sauvegarde de Dextérité, sans quoi elle subit 1d6 dégâts contondants et tombe à terre. Si le sol de la zone est de la terre meuble ou de la pierre, il devient un terrain difficile tant qu''il n''est pas déblayé ; dégager chaque portion de 1,50 mètre de diamètre demande au moins 1 minute à la main.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort avec un emplacement de niveau 2 ou supérieur, les dégâts augmentent de 1d6 par niveau d''emplacement au-delà du niveau 1.', 5, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"bludgeoning","damage_at_slot_level":{"1":"1d6","2":"2d6","3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Secousse sismique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Secousse sismique' AND s.ruleset = '5';

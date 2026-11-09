-- Sorts de niveau 2 du socle (#176 D1) : les 36 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_niveau_2.ts, gardé par test/nuxt/spellsLevel2Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Amélioration de caractéristique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Amélioration de caractéristique', 2, '1 action', 1.5, '["V","S","M"]', 'le poil ou la plume d''une bête', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une créature et lui accordez une amélioration magique. Choisissez l''un des effets suivants ; la cible gagne cet effet jusqu''à ce que le sort prenne fin.

**Force du taureau**. La cible a un avantage à ses jets de Force, et sa capacité de charge double.

**Grâce féline**. La cible a un avantage à ses jets de Dextérité. De plus, elle ne subit aucun dégât lorsqu''elle chute de 6 mètres ou moins et qu''elle n''est pas incapable d''agir.

**Endurance de l''ours**. La cible a un avantage à ses jets de Constitution. Elle gagne également 2d6 points de vie temporaires, qui sont perdus lorsque le sort prend fin.

**Ruse du renard**. La cible a un avantage à ses jets d''Intelligence.

**Sagesse du hibou**. La cible a un avantage à ses jets de Sagesse.

**Splendeur de l''aigle**. La cible a un avantage à ses jets de Charisme.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, vous pouvez cibler une créature supplémentaire pour chaque niveau d''emplacement au-delà du niveau 2.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Amélioration de caractéristique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Druide', 'Ensorceleur') AND c.ruleset = '5'
WHERE s.name = 'Amélioration de caractéristique' AND s.ruleset = '5';

-- Apaisement des émotions
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Apaisement des émotions', 2, '1 action', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous tentez de supprimer les émotions fortes dans un groupe de personnes. Chaque humanoïde dans une sphère de 6 mètres de rayon centrée sur un point choisi dans la portée du sort doit effectuer un jet de sauvegarde de Charisme. Une créature peut choisir de rater volontairement son jet de sauvegarde. En cas d''échec au jet de sauvegarde, choisissez l''un des deux effets suivants.

Vous pouvez supprimer tous les effets qui font qu''une cible est charmée ou effrayée. Lorsque ce sort prend fin, les effets supprimés reviennent, en présumant que leur durée n''a pas expiré entre temps.

Ou vous pouvez rendre une cible indifférente à des créatures envers qui elle montre des signes d''hostilité. Cette indifférence prend fin lorsque la cible est attaquée ou blessée par un sort ou lorsqu''elle est témoin d''une attaque envers un de ses alliés. Lorsque le sort prend fin, la créature redevient hostile, à moins que le MD en décide autrement.', 4, '{"ability":"cha","success":"none"}', NULL, '{"shape":"sphere","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Apaisement des émotions' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc') AND c.ruleset = '5'
WHERE s.name = 'Apaisement des émotions' AND s.ruleset = '5';

-- Appel de destrier
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Appel de destrier', 2, '10 minutes', 9, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous invoquez un esprit qui se matérialise sous la forme d''un destrier loyal, fort et remarquablement intelligent, créant un lien durable avec lui. Apparaissant dans un espace inoccupé à portée, le destrier prend la forme que vous voulez : un cheval de guerre, un poney, un chameau, un élan ou un molosse (votre MD peut autoriser l''invocation d''autres bêtes en tant que destriers). Le destrier a les statistiques de la forme choisie, mais son type est soit céleste, soit fée, soit fiélon (au choix) à la place de son type normal. De plus, si votre destrier a une Intelligence de 5 ou moins, son Intelligence passe à 6 et il gagne la capacité de comprendre l''une des langues que vous parlez (au choix).

Votre destrier vous sert de monture, en combat ou non, et le lien qui vous unit vous permet de combattre comme un seul homme. Lorsque vous montez votre destrier et que vous lancez un sort qui vous cible, vous pouvez faire en sorte qu''il cible également votre destrier.

Lorsque votre destrier tombe à 0 point de vie, il disparaît, ne laissant aucune forme physique. Vous pouvez également choisir de renvoyer votre destrier à tout moment en utilisant votre action. Il disparaît alors. Dans tous les cas, lancer de nouveau ce sort invoque le même destrier avec son maximum de points de vie.

Tant que votre destrier se trouve à 1,5 km ou moins de vous, vous pouvez communiquer entre vous par télépathie.

Vous ne pouvez avoir plus d''un destrier lié grâce à ce sort en même temps. Par une action, vous pouvez libérer votre destrier du lien qui vous unit, et ce à n''importe quel moment. Le destrier disparaît alors.', 2, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Appel de destrier' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Appel de destrier' AND s.ruleset = '5';

-- Arme magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Arme magique', 2, '1 action bonus', 1.5, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une arme non magique. Jusqu''à la fin du sort, l''arme est considérée comme étant une arme magique avec un bonus de +1 aux jets d''attaque et aux dégâts.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, le bonus augmente à +2. Lorsque vous utilisez un emplacement de sort de niveau 6 ou supérieur, le bonus augmente à +3.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Arme magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Paladin') AND c.ruleset = '5'
WHERE s.name = 'Arme magique' AND s.ruleset = '5';

-- Aura magique de Nystul
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Aura magique de Nystul', 2, '1 action', 1.5, '["V","S","M"]', 'un petit carré de soie', NULL, 0, '24 heures', 'hour', 24, 0, 'Vous placez une illusion sur une créature ou un objet que vous touchez pour que les sorts de divination révèlent de fausses informations les concernant. La cible peut être une créature consentante ou un objet qui n''est pas tenu ou équipé par une autre créature.

Lorsque vous lancez le sort, choisissez l''un ou les deux effets suivants. L''effet reste en place pour la durée du sort. Si vous lancez ce sort sur la même créature ou le même objet tous les jours pendant 30 jours, en choisissant à chaque fois le même effet, l''illusion reste active jusqu''à ce que le sort soit dissipé.

**Fausse aura**. Vous modifiez la manière dont la cible apparaît aux sorts et effets magiques, comme le sort *détection de la magie*, qui détectent les auras magiques. Vous pouvez faire en sorte qu''un objet non magique semble magique, et vice versa, ou modifier l''aura magique d''un objet pour qu''elle semble appartenir à une autre école de magie de votre choix. Lorsque vous utilisez cet effet sur un objet, vous pouvez faire en sorte que cette fausse aura soit visible pour toute créature qui tient l''objet en main.

**Masque**. Vous modifiez la manière dont la cible apparaît aux sorts et effets magiques qui détectent le type d''une créature, comme le Sens divin du paladin ou le déclencheur du sort *symbole*. Vous choisissez un type de créature, les autres sorts et effets magiques traitent la cible comme si elle était de ce type ou de cet alignement.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Aura magique de Nystul' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Aura magique de Nystul' AND s.ruleset = '5';

-- Bouche magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bouche magique', 2, '1 minute', 9, '["V","S","M"]', 'un rayon de miel et de la poussière de jade valant au moins 10 po, que le sort consomme', '{"amount":10,"unit":"po","consumed":true}', 1, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous implantez un message dans un objet dans la portée du sort. Le message est verbalisé lorsque les conditions de déclenchement sont remplies. Choisissez un objet que vous voyez et qui n''est pas porté ou transporté par une autre créature. Ensuite, prononcez le message, qui ne doit pas dépasser 25 mots mais dont l''écoute peut prendre jusqu''à 10 minutes. Finalement, établissez les circonstances qui déclencheront le sort pour livrer votre message.

Lorsque ces circonstances sont réunies, une bouche magique apparaît sur l''objet et elle articule le message en imitant votre voix, sur le même ton employé lors de l''implantation du message. Si l''objet choisi possède une bouche ou quelque chose qui s''en approche, comme la bouche d''une statue, la bouche magique s''animera à cet endroit, donnant l''illusion que les mots proviennent de la bouche de l''objet.

Lorsque vous lancez ce sort, vous pouvez décider que le sort prend fin une fois que le message est livré ou qu''il peut persister et répéter son message à chaque fois que les circonstances se produisent.

Les conditions de déclenchement peuvent être aussi génériques ou aussi précises que vous le souhaitez. Cependant, elles doivent être basées sur des critères visuels ou audibles perceptibles à 9 mètres ou moins de l''objet. Par exemple, vous pouvez commander à la bouche de parler lorsqu''une créature quelconque s''approche à 9 mètres ou moins de l''objet, ou lorsqu''on sonne une clochette d''argent à 9 mètres ou moins.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bouche magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Bouche magique' AND s.ruleset = '5';

-- Bourrasque
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Bourrasque', 2, '1 action', 0, '["V","S","M"]', 'une semence de légume', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un corridor de vent fort long de 18 mètres et large de 3 mètres souffle de votre position vers une direction de votre choix, pour la durée du sort. Chaque créature qui débute son tour dans le corridor doit réussir un jet de sauvegarde de Force, sans quoi elle est poussée de 4,50 mètres dans l''axe du corridor.

Toute créature dans le corridor doit consommer 2 mètres de mouvement pour chaque mètre parcouru lorsqu''elle se rapproche de vous.

La bourrasque disperse les gaz et la vapeur, et elle éteint les bougies, les torches et les autres flammes exposées dans la zone. Elle fait vaciller les flammes protégées, comme celle d''une lanterne, qui ont alors 50 % de chance de s''éteindre.

Lors d''une action bonus à chacun de vos tours avant que le sort prenne fin, vous pouvez changer la direction du corridor de vent.', 5, '{"ability":"str","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Bourrasque' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Bourrasque' AND s.ruleset = '5';

-- Châtiment révélateur
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Châtiment révélateur', 2, '1 action bonus', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'La prochaine fois que vous touchez une créature lors d''une attaque avec une arme avant que le sort ne prenne fin, votre arme rayonne d''une lueur astrale au moment de l''impact. L''attaque inflige 2d6 dégâts radiants supplémentaires à la cible, qui devient visible si elle était invisible, et la cible émet une lumière faible dans un rayon de 1,50 mètre et ne peut devenir invisible tant que le sort persiste.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts supplémentaires augmentent de 1d6 pour chaque niveau d''emplacement au-delà du niveau 2.', 5, NULL, NULL, NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"2":"2d6","3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Châtiment révélateur' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Paladin') AND c.ruleset = '5'
WHERE s.name = 'Châtiment révélateur' AND s.ruleset = '5';

-- Corde enchantée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Corde enchantée', 2, '1 action', 1.5, '["V","S","M"]', 'de l''extrait de poudre de maïs et un bout de parchemin torsadé', NULL, 0, '1 heure', 'hour', 1, 0, 'Vous touchez une longueur de corde de 18 mètres maximum. Une extrémité de la corde se dresse alors et monte dans les airs de sorte que toute la longueur de la corde soit verticale par rapport au sol. À l''extrémité supérieure de la corde, une entrée invisible vers un espace extradimensionnel s''ouvre et reste en place pour toute la durée du sort.

L''espace extradimensionnel peut être atteint en grimpant tout en haut de la corde. L''espace peut contenir jusqu''à huit créatures de taille M ou inférieure. La corde peut être tirée dans l''espace extradimensionnel, elle disparaît alors de la vue de ceux qui se trouvent à l''extérieur de l''espace extradimensionnel.

Les attaques et les sorts ne peuvent pas traverser l''entrée de l''espace extradimensionnel, qu''ils viennent de l''intérieur ou de l''extérieur, mais ceux qui se trouvent dans l''espace extradimensionnel peuvent voir à l''extérieur comme s''il y avait une fenêtre de 90 cm x 1,50 m centrée sur la corde.

Tout ce qui se trouve dans l''espace extradimensionnel en tombe lorsque le sort prend fin.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Corde enchantée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Corde enchantée' AND s.ruleset = '5';

-- Cordon de flèches
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Cordon de flèches', 2, '1 action', 1.5, '["V","S","M"]', 'quatre ou plus flèches ou carreaux', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous plantez quatre pièces de munition non magiques (flèches ou carreaux d''arbalète) dans le sol à portée et y apposez votre magie pour qu''elles protègent la zone. Jusqu''à la fin du sort, à chaque fois qu''une autre créature que vous arrive à 9 mètres ou moins des munitions, pour la première fois du tour, ou termine son tour dans ces 9 mètres, une pièce de munition s''envole pour la frapper. La créature doit réussir un jet de sauvegarde de Dextérité ou subir 1d6 dégâts perforants. La pièce de munition est ensuite détruite. La sort se termine lorsqu''il ne reste plus de munition.

Lorsque vous lancez ce sort, vous pouvez désigner toutes les créatures que vous souhaitez pour que le sort les ignore.

**Aux niveaux supérieurs**. Si vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, le nombre de munitions qui peuvent être affectées augmente de deux pour chaque niveau d''emplacement au-delà du niveau 2.', 8, '{"ability":"dex","success":"none"}', NULL, NULL, '[{"damage_type":"piercing","damage_at_slot_level":{"2":"1d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Cordon de flèches' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Cordon de flèches' AND s.ruleset = '5';

-- Couronne du dément
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Couronne du dément', 2, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un humanoïde de votre choix, que vous pouvez voir et à portée, doit réussir un jet de sauvegarde de Sagesse ou être charmé pour la durée du sort. Tant que vous charmez la cible par ce sort, une couronne entortillée de morceaux de fer déchiquetés apparaît sur sa tête, et la folie envahit son regard.

La cible charmée doit utiliser son action avant de se déplacer, à chacun de ses tours, pour effectuer une attaque au corps à corps contre une créature autre qu''elle-même et que vous avez mentalement choisie. La cible peut agir normalement au cours de son tour si vous ne choisissez aucune créature ou s''il n''y en a aucune à portée.

Lors de vos tours suivants, vous devez utiliser votre action pour maintenir le contrôle sur votre cible, sans quoi le sort prend fin. La cible peut également effectuer un jet de sauvegarde de Sagesse à la fin de chacun de ses tours. Si elle le réussit, le sort prend fin.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Couronne du dément' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Couronne du dément' AND s.ruleset = '5';

-- Croissance d'épines
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Croissance d''épines', 2, '1 action', 45, '["V","S","M"]', 'sept épines pointues ou sept brindilles taillées en pointe', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Le sol, sur un rayon de 6 mètres centré sur un point dans la portée du sort, se retourne et fait germer des épines rigides et des ronces. La zone devient un terrain difficile pour la durée du sort. Lorsqu''une créature entre ou se déplace dans la zone, elle subit 2d4 dégâts perforants pour chaque 1,50 mètre de déplacement.

La transformation du sol est camouflée afin de paraître naturelle. Toute créature qui ne voit pas la zone lorsque le sort est incanté doit réussir un jet de Sagesse (Perception) contre le DD de sauvegarde de votre sort, sans quoi elle ne reconnait pas la nature dangereuse du terrain avant d''y pénétrer.', 8, NULL, NULL, NULL, '[{"damage_type":"piercing","label":"Par 1,50 mètre de déplacement","damage_at_slot_level":{"2":"2d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Croissance d''épines' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Croissance d''épines' AND s.ruleset = '5';

-- Déblocage
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Déblocage', 2, '1 action', 18, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Choisissez un objet que vous pouvez voir dans la portée du sort. L''objet peut être une porte, une boîte, un coffre, des menottes, un cadenas, ou un autre objet qui contient des dispositifs conventionnels ou magiques qui empêchent l''accès.

Un objet cible qui est maintenu fermé par un verrou normal, ou qui est bloqué ou barré, devient déverrouillé ou débloqué. Si l''objet possède plusieurs verrous, seulement l''un d''entre eux est déverrouillé.

Si vous choisissez un objet cible qui est tenu fermé par un sort *verrou magique*, ce sort est supprimé pendant 10 minutes, au cours desquelles l''objet cible peut être ouvert et fermé normalement. Quand vous lancez le sort, un coup fort et audible jusqu''à 90 mètres émane de l''objet cible.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Déblocage' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Déblocage' AND s.ruleset = '5';

-- Discours captivant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Discours captivant', 2, '1 action', 18, '["V","S"]', NULL, NULL, 0, '1 minute', 'minute', 1, 0, 'Vous entrelacez des phrases distrayantes, ce qui force les créatures de votre choix, que vous pouvez voir et qui peuvent vous entendre, à effectuer un jet de sauvegarde de Sagesse. Toute créature qui ne peut pas être charmée réussit automatiquement son jet de sauvegarde, et si vous ou vos compagnons combattez une créature, celle-ci a un avantage à son jet de sauvegarde. Si une cible échoue son jet de sauvegarde, elle se voit affligée d''un désavantage à ses jets de Sagesse (Perception) effectués pour repérer une autre créature que vous, et ce jusqu''à ce que le sort prenne fin ou jusqu''à ce qu''elle ne puisse plus vous entendre. Ce sort prend fin si vous êtes incapable d''agir ou ne pouvez plus parler.', 4, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Discours captivant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Discours captivant' AND s.ruleset = '5';

-- Flamme éternelle
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Flamme éternelle', 2, '1 action', 1.5, '["V","S","M"]', 'de la poussière de rubis valant 50 po, que le sort consomme', '{"amount":50,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Une flamme, d''une luminosité équivalente à celle d''une torche, fait éruption depuis un objet que vous touchez. L''effet ressemble à une flamme régulière, mais il ne produit aucune chaleur et ne nécessite pas d''oxygène. Une flamme éternelle peut être recouverte ou dissimulée, mais elle ne peut pas être étouffée ou éteinte.', 5, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flamme éternelle' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Flamme éternelle' AND s.ruleset = '5';

-- Flèche acide de Melf
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Flèche acide de Melf', 2, '1 action', 27, '["V","S","M"]', 'une feuille de rhubarbe en poudre et un estomac de vipère', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Une flèche verte scintillante jaillit en direction d''une cible à portée et l''asperge d''acide. Effectuez une attaque à distance avec un sort contre la cible. Si l''attaque touche, la cible subit 4d4 dégâts d''acide immédiatement et 2d4 dégâts d''acide à la fin de son prochain tour. En cas d''échec, la flèche asperge la cible avec de l''acide, ne lui infligeant que la moitié des dégâts initiaux et aucun dégât à la fin de son prochain tour.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts (initiaux et à retardement) sont augmentés de 1d4 pour chaque niveau d''emplacement au-delà du niveau 2.', 5, NULL, 'ranged', NULL, '[{"damage_type":"acid","label":"Immédiat","damage_at_slot_level":{"2":"4d4","3":"5d4","4":"6d4","5":"7d4","6":"8d4","7":"9d4","8":"10d4","9":"11d4"}},{"damage_type":"acid","label":"Fin du prochain tour","damage_at_slot_level":{"2":"2d4","3":"3d4","4":"4d4","5":"5d4","6":"6d4","7":"7d4","8":"8d4","9":"9d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flèche acide de Melf' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Flèche acide de Melf' AND s.ruleset = '5';

-- Flou
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Flou', 2, '1 action', 0, '["V"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Votre corps devient flou, changeant et ondulant pour tous ceux qui peuvent vous voir. Tant que le sort dure, toutes les créatures ont un désavantage au jet d''attaque dirigé contre vous. Un attaquant est immunisé contre cet effet s''il n''utilise pas la vue, comme avec le combat aveugle, ou s''il peut voir à travers les illusions, comme avec une vision véritable.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flou' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Flou' AND s.ruleset = '5';

-- Fracassement
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Fracassement', 2, '1 action', 18, '["V","S","M"]', 'un éclat de mica', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Un fort bruit résonnant, douloureusement intense, retentit d''un point de votre choix dans la portée du sort. Chaque créature présente dans une sphère d''un rayon de 3 mètres centrée sur ce point doit effectuer un jet de sauvegarde de Constitution, subissant 3d8 dégâts de tonnerre en cas d''échec, ou la moitié de ces dégâts en cas de réussite. Une créature constituée de matériau inorganique, comme la pierre, le cristal ou le métal, fait son jet de sauvegarde avec un désavantage.

Un objet non magique qui n''est pas porté ou transporté subit aussi les dégâts s''il est dans la zone du sort.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts du sort augmentent de 1d8 pour chaque niveau d''emplacement au-delà du niveau 2.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"sphere","size":3}', '[{"damage_type":"thunder","damage_at_slot_level":{"2":"3d8","3":"4d8","4":"5d8","5":"6d8","6":"7d8","7":"8d8","8":"9d8","9":"10d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fracassement' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Fracassement' AND s.ruleset = '5';

-- Image miroir
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Image miroir', 2, '1 action', 0, '["V","S"]', NULL, NULL, 0, '1 minute', 'minute', 1, 0, 'Trois duplicatas illusoires de votre personne apparaissent dans votre espace. Jusqu''à la fin du sort, les duplicatas se déplacent avec vous et ils imitent vos actions, permutant leur position de sorte qu''il soit impossible de déterminer laquelle des images est réelle. Vous pouvez utiliser votre action pour dissiper les duplicatas illusoires.

À chaque fois qu''une créature vous prend pour cible avec une attaque pendant la durée du sort, lancez 1d20 pour déterminer si l''attaque ne cible pas plutôt un de vos duplicatas.

Si vous avez trois duplicatas, vous devez obtenir 6 ou plus sur votre lancer pour diriger la cible de l''attaque vers un duplicata. Avec deux duplicatas, vous devez obtenir 8 ou plus. Avec un seul duplicata, vous devez obtenir 11 ou plus.

La CA d''un duplicata est égale à 10 + votre modificateur de Dextérité. Si une attaque touche un duplicata, il est détruit. Un duplicata peut être détruit seulement par une attaque qui le touche. Il ignore les autres dégâts et effets. Le sort prend fin si les trois duplicatas sont détruits.

Une créature n''est pas affectée par ce sort si elle ne peut pas voir, si elle se fie sur un autre sens que la vision, comme la vision aveugle, ou si elle peut percevoir les illusions comme étant fausses, comme avec vision suprême.', 6, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Image miroir' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Image miroir' AND s.ruleset = '5';

-- Lame de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Lame de feu', 2, '1 action bonus', 0, '["V","S","M"]', 'une feuille de sumac', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous créez une lame ardente dans votre main libre. La lame est similaire en taille et en forme à un cimeterre, et reste jusqu''à ce que le sort prenne fin. Si vous lâchez la lame, elle disparaît, mais vous pouvez la réinvoquer par une action bonus.

Vous pouvez utiliser votre action pour effectuer une attaque au corps à corps avec un sort avec la lame ardente. Si le coup touche, la cible subit 3d6 dégâts de feu.

La lame enflammée émet une lumière vive dans un rayon de 3 mètres et une lumière faible sur 3 mètres supplémentaires.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 4 ou supérieur, les dégâts augmentent de 1d6 tous les 2 niveaux d''emplacement au-dessus du niveau 2.', 5, NULL, 'melee', NULL, '[{"damage_type":"fire","damage_at_slot_level":{"2":"3d6","4":"4d6","6":"5d6","8":"6d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lame de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Lame de feu' AND s.ruleset = '5';

-- Localisation d'animaux ou de plantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Localisation d''animaux ou de plantes', 2, '1 action', 0, '["V","S","M"]', 'une touffe de fourrure de limier', NULL, 1, 'Instantanée', 'instant', NULL, 0, 'Décrivez ou nommez une espèce spécifique de bête ou de plante. En vous concentrant sur les murmures de la Nature qui vous environne, vous apprenez la direction et la distance de la créature, ou plante de cette espèce, la plus proche dans les 7,5 km à la ronde, à condition qu''il y en ait.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Localisation d''animaux ou de plantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Localisation d''animaux ou de plantes' AND s.ruleset = '5';

-- Messager animal
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Messager animal', 2, '1 action', 9, '["V","S","M"]', 'un morceau de nourriture', NULL, 1, '24 heures', 'hour', 24, 0, 'Grâce à ce sort, vous employez un animal pour livrer un message. Choisissez une bête visible de taille TP, comme un écureuil, un geai bleu ou une chauve-souris. Vous précisez une destination, que vous avez préalablement visitée, et un destinataire qui correspond à une description sommaire, comme « un homme ou une femme vêtu d''un uniforme de la garde civile » ou « un nain roux portant un chapeau pointu ». Vous énoncez aussi un message de 25 mots ou moins. La bête ciblée se déplace pour la durée du sort vers la destination déterminée, au rythme de 75 km par 24 heures pour un messager ailé ou 37,5 km pour les autres animaux.

Lorsque le messager arrive, il livre son message à la créature que vous avez décrit en imitant le son de votre voix. Le messager parlera uniquement à la créature correspondant à la description que vous avez fournie. Si le messager ne parvient pas à sa destination avant la fin du sort, le message est perdu et la bête revient à l''endroit où le sort a été incanté.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, la durée du sort augmente de 48 heures pour chaque niveau d''emplacement au-delà du niveau 2.', 4, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Messager animal' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Messager animal' AND s.ruleset = '5';

-- Métal brûlant
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Métal brûlant', 2, '1 action', 18, '["V","S","M"]', 'un morceau de fer et une flamme', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Choisissez un objet métallique manufacturé, comme une arme en métal ou une armure métallique intermédiaire ou lourde, à portée et que vous pouvez voir. Vous rendez l''objet rougeoyant d''une intense chaleur. Toutes les créatures étant en contact physique avec l''objet subissent 2d8 dégâts de feu au moment où vous lancez le sort. Jusqu''à la fin du sort, vous pouvez utiliser votre action bonus à chacun des tours suivants pour infliger de nouveau ces dégâts de feu.

Si une créature tient ou porte l''objet et en subit les dégâts de feu, la créature doit réussir un jet de sauvegarde de Constitution sous peine de lâcher l''objet si elle le peut. Si elle ne peut pas se séparer de l''objet, elle obtient un désavantage à ses jets d''attaque et à ses jets de caractéristique jusqu''au début de votre prochain tour.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts sont augmentés de 1d8 pour chaque niveau d''emplacement au-delà du niveau 2.', 8, '{"ability":"con","success":"none"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"2":"2d8","3":"3d8","4":"4d8","5":"5d8","6":"6d8","7":"7d8","8":"8d8","9":"9d8"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Métal brûlant' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Druide') AND c.ruleset = '5'
WHERE s.name = 'Métal brûlant' AND s.ruleset = '5';

-- Nuée de dagues
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Nuée de dagues', 2, '1 action', 18, '["V","S","M"]', 'un tesson de verre', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous emplissez l''espace de dagues tournoyantes dans un cube de 1,50 mètre d''arête, centré sur un point dans la portée du sort. Une créature subit 4d4 dégâts tranchants lorsqu''elle pénètre dans la zone du sort pour la première fois ou si elle y débute son tour.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts augmentent de 2d4 pour chaque niveau d''emplacement au-delà du niveau 2.', 2, NULL, NULL, '{"shape":"cube","size":1.5}', '[{"damage_type":"slashing","damage_at_slot_level":{"2":"4d4","3":"6d4","4":"8d4","5":"10d4","6":"12d4","7":"14d4","8":"16d4","9":"18d4"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Nuée de dagues' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Nuée de dagues' AND s.ruleset = '5';

-- Passage sans trace
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Passage sans trace', 2, '1 action', 0, '["V","S","M"]', 'les cendres de la combustion d''une feuille de gui et d''une brindille d''épinette', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Un voile d''ombres et de silence émane de vous, vous protégeant, ainsi que vos compagnons, de la détection. Pour la durée du sort, chaque créature que vous choisissez et se trouvant à 9 mètres de vous (vous y compris) a un bonus de +10 aux jets de Dextérité (Discrétion) et ne peut pas être pistée, sauf par des moyens magiques. Une créature qui reçoit ce bonus ne laisse ni piste ni trace de son passage.', 1, NULL, NULL, '{"shape":"emanation","size":9}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Passage sans trace' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Passage sans trace' AND s.ruleset = '5';

-- Peau d'écorce
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Peau d''écorce', 2, '1 action', 1.5, '["V","S","M"]', 'une poignée d''écorce de chêne', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une créature consentante. Jusqu''à la fin du sort, la peau de la cible prend une texture rugueuse telle l''écorce d''un arbre et la CA de la cible ne peut être inférieure à 16, peu importe le type d''armure qu''elle porte.', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Peau d''écorce' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Peau d''écorce' AND s.ruleset = '5';

-- Préservation des morts
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Préservation des morts', 2, '1 action', 1.5, '["V","S","M"]', 'une pincée de sel, et une pièce de cuivre pour chaque œil du corps à préserver. Les pièces doivent rester en place pour la durée du sort', NULL, 1, '10 jours', 'day', 10, 0, 'Vous touchez un corps ou ce qu''il en reste. Pour la durée du sort, la cible est protégée du pourrissement et ne peut pas devenir un mort-vivant.

Le sort augmente également la durée limite au-delà de laquelle il n''est plus possible de ramener un corps à la vie. Les jours passés sous l''influence de ce sort ne comptent pas dans le total de jours passés à l''état de cadavre pour des sorts comme *rappel à la vie*.', 7, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Préservation des morts' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Préservation des morts' AND s.ruleset = '5';

-- Rayon ardent
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, multi_attack)
SELECT 'Rayon ardent', 2, '1 action', 36, '["V","S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous générez trois rayons de feu et vous les projetez vers des cibles dans la portée du sort. Vous pouvez les projeter sur une ou plusieurs cibles.

Effectuez une attaque à distance avec un sort pour chaque rayon. Si elle touche, la cible subit 2d6 dégâts de feu.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, vous générez un rayon supplémentaire pour chaque niveau d''emplacement au-delà du niveau 2.', 5, NULL, 'ranged', NULL, '[{"damage_type":"fire","damage_at_slot_level":{"2":"6d6","3":"8d6","4":"10d6","5":"12d6","6":"14d6","7":"16d6","8":"18d6","9":"20d6"}}]', NULL, '{"label":"Rayons","count_at_slot_level":{"2":3,"3":4,"4":5,"5":6,"6":7,"7":8,"8":9,"9":10}}'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayon ardent' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Rayon ardent' AND s.ruleset = '5';

-- Rayon de lune
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Rayon de lune', 2, '1 action', 36, '["V","S","M"]', 'plusieurs graines de pavot et un morceau de feldspath opalescent', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Un rayon argenté de lumière pâle brille dans un cylindre de 12 mètres de haut et 1,50 mètre de rayon, centré sur un point à portée. Jusqu''à ce que le sort prenne fin, une lumière faible remplit le cylindre.

Lorsqu''une créature pénètre la zone d''effet du sort pour la première fois dans un tour, ou qu''elle y débute son tour, elle est enveloppée de flammes fantomatiques qui lui provoquent d''intenses douleurs, l''obligeant à effectuer un jet de sauvegarde de Constitution. Elle subit 2d10 dégâts radiants en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Un métamorphe effectue son jet de sauvegarde avec un désavantage. S''il échoue, il est également forcé de retrouver sa forme originelle et ne peut pas prendre une forme différente tant qu''il n''a pas échappé à la lueur produite par le sort.

À chacun de vos tours après que vous ayez lancé ce sort, vous pouvez utiliser votre action pour déplacer le rayon jusqu''à 18 mètres dans n''importe quelle direction.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts augmentent de 1d10 pour chaque niveau d''emplacement au-delà du niveau 2.', 5, '{"ability":"con","success":"half"}', NULL, '{"shape":"cylinder","size":1.5,"height":12}', '[{"damage_type":"radiant","damage_at_slot_level":{"2":"2d10","3":"3d10","4":"4d10","5":"5d10","6":"6d10","7":"7d10","8":"8d10","9":"9d10"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Rayon de lune' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide') AND c.ruleset = '5'
WHERE s.name = 'Rayon de lune' AND s.ruleset = '5';

-- Sens animal
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sens animal', 2, '1 action', 1.5, '["S"]', NULL, NULL, 1, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous touchez une bête consentante. Pour la durée du sort, vous pouvez utiliser votre action pour voir à travers les yeux de la bête et entendre ce qu''elle entend. Vous pouvez continuer jusqu''à ce que vous utilisiez une action pour retrouver vos propres sens. Lorsque vous percevez par l''intermédiaire des sens de la bête, vous bénéficiez des sens spéciaux que possède la créature. Cependant, vous perdez l''usage de vos propres sens.', 3, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sens animal' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Sens animal' AND s.ruleset = '5';

-- Silence
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Silence', 2, '1 action', 36, '["V","S"]', NULL, NULL, 1, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Pour la durée du sort, aucun son ne peut être créé au sein (ou passer à travers) d''une sphère de 6 mètres de rayon centrée sur le point que vous choisissez dans la portée du sort. Toute créature ou objet se trouvant entièrement à l''intérieur de la sphère est immunisé contre les dégâts de tonnerre et les créatures sont en plus assourdies.

Lancer un sort qui comprend une composante verbale à l''intérieur de la sphère est impossible.', 6, NULL, NULL, '{"shape":"sphere","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Silence' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Clerc', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Silence' AND s.ruleset = '5';

-- Sphère de feu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Sphère de feu', 2, '1 action', 18, '["V","S","M"]', 'un peu de suif, une pincée de soufre et de la poussière de poudre de fer', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une sphère de feu d''un diamètre de 1,50 mètre apparait dans un espace inoccupé de votre choix dans la portée et pour la durée du sort. Toute créature qui termine son tour à 1,50 mètre ou moins de la sphère doit effectuer un jet de sauvegarde de Dextérité, subissant 2d6 dégâts de feu en cas d''échec, ou la moitié de ces dégâts en cas de réussite.

Avec une action bonus, vous pouvez déplacer la sphère jusqu''à 9 mètres. Si la sphère entre en collision avec une créature, celle-ci doit faire un jet de sauvegarde contre les dégâts de la sphère et elle arrête son mouvement pour ce tour.

Lorsque vous déplacez la sphère, vous pouvez la diriger par-dessus des barrières de 1,50 mètre ou moins et la propulser au-dessus d''un gouffre large de 3 mètres ou moins. La sphère enflamme les objets inflammables qui ne sont pas portés ou transportés, et émet une lumière vive dans un rayon de 6 mètres et une lumière faible sur 6 mètres supplémentaires.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 3 ou supérieur, les dégâts sont augmentés de 1d6 pour chaque niveau d''emplacement au-delà du niveau 2.', 2, '{"ability":"dex","success":"half"}', NULL, NULL, '[{"damage_type":"fire","damage_at_slot_level":{"2":"2d6","3":"3d6","4":"4d6","5":"5d6","6":"6d6","7":"7d6","8":"8d6","9":"9d6"}}]', NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Sphère de feu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Sphère de feu' AND s.ruleset = '5';

-- Ténèbres
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Ténèbres', 2, '1 action', 18, '["V","M"]', 'des poils de chauve-souris et une goutte de goudron ou un morceau de charbon', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Des ténèbres magiques s''étendent d''un point de votre choix dans la portée du sort pour remplir une sphère de 4,50 mètres de rayon pour la durée du sort. Ces ténèbres contournent les coins. Une créature avec la vision dans le noir ne peut percer ces ténèbres et une lumière non magique ne peut y éclairer.

Si le point choisi est un objet que vous portez ou qui n''est pas porté ou transporté, les ténèbres émanent de l''objet et elles se déplacent avec lui. Recouvrir complètement la source des ténèbres avec un objet opaque, comme un bol ou un casque, bloque les ténèbres.

Si n''importe quelle portion de ce sort chevauche une portion de lumière créée par un sort de niveau 2 ou moins, le sort de lumière est alors dissipé.', 5, NULL, NULL, '{"shape":"sphere","size":4.5}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ténèbres' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Ténèbres' AND s.ruleset = '5';

-- Toile d'araignée
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Toile d''araignée', 2, '1 action', 18, '["V","S","M"]', 'un peu de toile d''araignée', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous invoquez une masse de toiles d''araignées épaisse et collante à un point de votre choix dans la portée du sort. Les toiles remplissent un cube de 6 mètres d''arête à cet endroit pendant la durée du sort. Les toiles sont considérées comme un terrain difficile et la visibilité y est réduite.

Si les toiles ne sont pas ancrées entre deux masses solides (comme des murs ou des arbres) ou superposées à partir du sol, d''un mur ou du plafond, la masse de toiles invoquée s''effondre sur elle-même et le sort se termine au début de votre prochain tour. Les toiles superposées sur une surface plane ont une épaisseur de 1,50 mètre.

Chaque créature qui commence son tour dans les toiles ou qui y entre au cours de son tour doit faire un jet de sauvegarde de Dextérité. En cas d''échec, la créature est entravée aussi longtemps qu''elle demeure dans les toiles ou jusqu''à ce qu''elle se libère.

Une créature entravée par les toiles peut utiliser son action pour faire un jet de Force contre le DD de sauvegarde de votre sort. Si elle réussit, elle n''est plus entravée.

Les toiles sont inflammables. Un cube de toiles de 1,50 mètre d''arête exposé au feu se consume en un round, causant 2d4 dégâts de feu à toute créature commençant son tour dans les toiles enflammées.', 2, '{"ability":"dex","success":"none"}', NULL, '{"shape":"cube","size":6}', NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Toile d''araignée' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Toile d''araignée' AND s.ruleset = '5';

-- Verrou magique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Verrou magique', 2, '1 action', 1.5, '["V","S","M"]', 'de la poudre d''or d''une valeur d''au moins de 25 po, que le sort consomme', '{"amount":25,"unit":"po","consumed":true}', 0, 'Jusqu''à dissipation', 'until_dispelled', NULL, 0, 'Vous touchez un objet fermé comme une porte, une fenêtre, un portail ou un coffre, et celui-ci se retrouve verrouillé pour la durée du sort. Vous et les créatures que vous désignez lors du lancement du sort pouvez ouvrir l''objet normalement. Vous pouvez aussi créer un mot de passe qui, quand il est prononcé à 1,50 mètre ou moins de l''objet, supprime l''effet du sort pendant 1 minute. Autrement, il est impossible d''ouvrir l''objet, sauf s''il est brisé ou si le sort est dissipé ou prend fin. Lancer le sort *déblocage* supprime *verrou magique* pendant 10 minutes.

L''objet affecté par le sort est plus difficile à briser ou forcer ; le DD pour le briser ou tenter de le crocheter augmente de 10.', 1, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Verrou magique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Verrou magique' AND s.ruleset = '5';

-- Vision dans le noir
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal)
SELECT 'Vision dans le noir', 2, '1 action', 1.5, '["V","S","M"]', 'soit une pincée de carotte séchée, soit une agate', NULL, 0, '8 heures', 'hour', 8, 0, 'Vous touchez une créature consentante pour lui conférer la capacité de voir dans le noir. Pour la durée du sort, cette créature obtient la vision dans le noir (portée 18 mètres).', 8, NULL, NULL, NULL, NULL, NULL
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Vision dans le noir' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien', 'Rôdeur') AND c.ruleset = '5'
WHERE s.name = 'Vision dans le noir' AND s.ruleset = '5';

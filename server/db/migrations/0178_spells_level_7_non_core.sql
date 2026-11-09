-- Sorts de niveau 7 hors socle (Xanathar, Tasha) (#176 D1) : les 5 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_7.ts, gardé par test/nuxt/spellsLevelHorsSocle7Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Couronne d'étoiles
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Couronne d''étoiles', 7, '1 action', 0, '["V","S"]', NULL, NULL, 0, '1 heure', 'hour', 1, 0, 'Sept particules étoilées apparaissent et orbitent autour de votre tête jusqu''à la fin du sort. Par une action bonus, vous pouvez envoyer l''une d''elles vers une créature ou un objet situé à 36 mètres ou moins : faites un jet d''attaque à distance ; si vous touchez, la cible subit 4d12 dégâts radiants. Dans tous les cas, la particule se consume, et le sort prend fin quand toutes ont été utilisées. Avec 4 particules ou plus autour de la tête, elles émettent une lumière vive sur 9 mètres et une lumière faible sur 9 mètres de plus ; avec 1 à 3 particules, une lumière faible sur 9 mètres.

**Aux niveaux supérieurs**. Avec un emplacement de niveau 8 ou supérieur, le nombre de particules augmente de 2 par niveau d''emplacement au-delà du niveau 7.', 5, NULL, 'ranged', NULL, '[{"damage_type":"radiant","damage_at_slot_level":{"7":"4d12"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Couronne d''étoiles' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Couronne d''étoiles' AND s.ruleset = '5';

-- Mot de pouvoir douloureux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Mot de pouvoir douloureux', 7, '1 action', 18, '["V"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous prononcez un mot de pouvoir qui déchaîne une vague de douleur sur une créature que vous voyez à portée. Si elle a 100 points de vie ou moins, elle est en proie à une douleur paralysante ; sinon, le sort n''a aucun effet sur elle. Une cible immunisée à l''état charmé n''est pas affectée.

Tant qu''elle est en proie à la douleur, la vitesse de la cible est réduite à 3 mètres au plus et elle a un désavantage à tous ses jets d''attaque, de caractéristique et de sauvegarde, sauf les jets de sauvegarde de Constitution. De plus, si elle tente de lancer un sort, elle doit d''abord réussir un jet de sauvegarde de Constitution, sans quoi l''incantation échoue et le sort est perdu.

Une cible affectée peut faire un jet de sauvegarde de Constitution à la fin de chacun de ses tours ; en cas de réussite, la douleur cesse.', 4, '{"ability":"con"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Mot de pouvoir douloureux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Mot de pouvoir douloureux' AND s.ruleset = '5';

-- Songe du voile bleu
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Songe du voile bleu', 7, '10 minutes', 6, '["V","S","M"]', 'un objet magique ou une créature volontaire du monde de destination', NULL, 0, '6 heures', 'hour', 6, 0, 'Vous et jusqu''à huit autres créatures à portée tombez inconscients pour la durée du sort et recevez des visions d''un autre monde du plan matériel (Oerth, Toril, Krynn, Eberron…). Si le sort atteint sa durée totale, les visions se terminent chacune par un mystérieux rideau bleu que vous traversez : le sort prend fin et vous vous retrouvez, corps et esprit, dans le monde entrevu.

Pour lancer ce sort, vous devez posséder un objet magique venant du monde visé et savoir qu''il existe, même sans connaître son nom. Vous arrivez en un lieu sûr dans un rayon de 1,5 km de l''endroit où l''objet a été créé. Vous pouvez aussi lancer le sort si l''une des créatures ciblées est née dans cet autre monde : vous arrivez alors en lieu sûr dans un rayon de 1,5 km de son lieu de naissance.

Si une créature subit des dégâts pendant la durée du sort, il prend fin pour elle et elle n''est pas transportée. Si c''est vous qui subissez des dégâts, le sort prend fin pour toutes les créatures ciblées et personne n''est transporté.', 2, NULL, NULL, NULL, NULL, NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Songe du voile bleu' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Songe du voile bleu' AND s.ruleset = '5';

-- Temple des dieux
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Temple des dieux', 7, '1 heure', 36, '["V","S","M"]', 'un symbole sacré d''une valeur d''au moins 5 po', '{"amount":5,"unit":"po"}', 0, '24 heures', 'hour', 24, 0, 'Vous faites apparaître sur le sol, à portée, un temple scintillant, dans une zone inoccupée pouvant contenir un cube allant jusqu''à 36 mètres de côté. Il dure jusqu''à la fin du sort et est dédié au dieu, au panthéon ou à la philosophie que représente le symbole sacré employé pour l''incantation.

Vous choisissez son apparence. L''intérieur est délimité par un sol, des murs et un toit, avec une porte et autant de fenêtres que vous voulez. Seuls vous et les créatures que vous désignez à l''incantation peuvent ouvrir ou fermer la porte.

L''intérieur est vaste, avec une idole ou un autel à une extrémité. Vous décidez s''il est éclairé et si la lumière est vive ou faible. L''odeur d''encens emplit l''air et la température est moyenne.

Le temple repousse les types de créatures que vous choisissez à l''incantation, parmi : célestes, élémentaires, fées, fiélons et morts-vivants. Une créature du type choisi qui tente d''y entrer doit faire un jet de sauvegarde de Charisme. En cas d''échec, elle ne peut y entrer pendant les 24 heures suivantes. En cas de réussite, elle peut entrer, mais la magie du temple l''entrave : à chaque jet d''attaque, de caractéristique ou de sauvegarde, elle lance un d4 et soustrait le résultat à son jet.

De plus, les capteurs créés par des sorts de divination ne peuvent apparaître dans le temple, et les créatures à l''intérieur ne peuvent être ciblées par des sorts de divination.

Enfin, chaque fois qu''une créature dans le temple regagne des points de vie grâce à un sort de niveau 1 ou supérieur, elle gagne un nombre de points de vie temporaires égal à votre modificateur de Sagesse (minimum 1).

Le temple est fait d''une force magique opaque qui s''étend jusqu''au plan éthéré et bloque les voyages éthérés à l''intérieur. Rien ne peut le traverser physiquement depuis l''extérieur. Il ne peut pas être dissipé par *dissipation de la magie*, *champ antimagie* n''a aucun effet sur lui, et un sort de *désintégration* le détruit instantanément.

Lancer ce sort chaque jour au même endroit pendant un an rend ses effets permanents.', 2, '{"ability":"cha"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Temple des dieux' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Clerc') AND c.ruleset = '5'
WHERE s.name = 'Temple des dieux' AND s.ruleset = '5';

-- Tourbillon
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Tourbillon', 7, '1 action', 90, '["V","M"]', 'un morceau de paille', NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Une tornade surgit au sol en un point que vous voyez à portée : un cylindre de 3 mètres de rayon et de 9 mètres de haut centré sur ce point. Jusqu''à la fin du sort, vous pouvez utiliser votre action pour la déplacer de 9 mètres au plus dans n''importe quelle direction au ras du sol. Le tourbillon aspire les objets non fixés de taille M ou inférieure que personne ne porte ni ne tient.

Une créature doit faire un jet de sauvegarde de Dextérité la première fois d''un tour où elle entre dans la tornade ou où la tornade entre dans son espace, y compris à son apparition : elle subit 10d6 dégâts contondants en cas d''échec, la moitié en cas de réussite. De plus, une créature de taille G ou inférieure qui échoue doit réussir un jet de sauvegarde de Force, sans quoi elle est entravée par la tornade jusqu''à la fin du sort. Quand une créature entravée commence son tour, elle est aspirée de 1,50 mètre vers le haut, sauf si elle est déjà au sommet. Une créature entravée suit la tornade et tombe à la fin du sort, sauf si elle peut rester en l''air.

Une créature entravée peut utiliser une action pour faire un jet de Force ou de Dextérité contre le DD de sauvegarde de votre sort ; en cas de réussite, elle n''est plus entravée et est projetée à 3d6 × 3 mètres dans une direction aléatoire.', 5, '{"ability":"dex","success":"half"}', NULL, '{"shape":"cylinder","size":3,"height":9}', '[{"damage_type":"bludgeoning","damage_at_slot_level":{"7":"10d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Tourbillon' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Druide', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Tourbillon' AND s.ruleset = '5';

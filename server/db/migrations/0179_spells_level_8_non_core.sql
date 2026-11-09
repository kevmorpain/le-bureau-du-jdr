-- Sorts de niveau 8 hors socle (Xanathar, Tasha) (#176 D1) : les 4 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_8.ts, gardé par test/nuxt/spellsLevelHorsSocle8Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Dragon illusoire
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Dragon illusoire', 8, '1 action', 36, '["S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'En rassemblant des filaments d''ombre de la Grisombre, vous créez un dragon d''ombre de taille TG dans un espace inoccupé que vous voyez à portée. L''illusion dure toute la durée du sort et occupe l''espace comme une créature.

À son apparition, chaque ennemi qui la voit doit réussir un jet de sauvegarde de Sagesse, sans quoi il est effrayé par le dragon pendant 1 minute. Une créature effrayée qui termine son tour hors de vue du dragon peut refaire le jet pour mettre fin à l''état.

Par une action bonus à votre tour, vous pouvez déplacer l''illusion de 18 mètres au plus, et à tout moment pendant ce déplacement lui faire souffler une énergie dans un cône de 18 mètres. À la création, choisissez un type de dégâts : acide, froid, feu, foudre, nécrotique ou poison. Chaque créature du cône doit effectuer un jet de sauvegarde d''Intelligence et subit 7d6 dégâts du type choisi en cas d''échec, la moitié en cas de réussite.

L''illusion est tangible grâce aux filaments d''ombre, mais les attaques qui la visent ratent automatiquement. Elle réussit tous ses jets de sauvegarde et est immunisée à tous les types de dégâts et à tous les états. Une créature qui utilise son action pour l''examiner comprend qu''il s''agit d''une illusion en réussissant un jet d''Intelligence (Investigation) opposé au DD de sauvegarde de votre sort ; elle voit alors à travers le dragon et a l''avantage à tous ses jets de sauvegarde contre son souffle.', 6, '{"ability":"int","success":"half"}', NULL, '{"shape":"cone","size":18}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Dragon illusoire' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Dragon illusoire' AND s.ruleset = '5';

-- Flétrissure épouvantable d'Abi-Dalzim
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Flétrissure épouvantable d''Abi-Dalzim', 8, '1 action', 45, '["V","S","M"]', 'un morceau d''éponge', NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous absorbez l''humidité des créatures d''un cube de 9 mètres d''arête centré sur un point de votre choix à portée. Chacune doit effectuer un jet de sauvegarde de Constitution ; les morts-vivants et les artificiels ne sont pas affectés, et plantes et élémentaires d''eau ont un désavantage au jet. Une créature subit 12d8 dégâts nécrotiques en cas d''échec, la moitié en cas de réussite.

Les plantes non magiques de la zone qui ne sont pas des créatures (arbres, arbustes) se flétrissent et meurent instantanément.', 7, '{"ability":"con","success":"half"}', NULL, '{"shape":"cube","size":9}', '[{"damage_type":"necrotic","damage_at_slot_level":{"8":"12d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Flétrissure épouvantable d''Abi-Dalzim' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Flétrissure épouvantable d''Abi-Dalzim' AND s.ruleset = '5';

-- Forteresse majestueuse
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Forteresse majestueuse', 8, '1 minute', 1500, '["V","S","M"]', 'un diamant d''une valeur d''au moins 500 po, que le sort consomme', '{"amount":500,"unit":"po","consumed":true}', 0, 'Instantanée', 'instant', NULL, 0, 'Une forteresse de pierre surgit d''une zone carrée de 36 mètres de côté centrée sur un point que vous voyez à portée, sans construction ni autre structure. Les créatures de la zone sont soulevées sans dégâts quand elle se dresse.

La forteresse a quatre tourelles à base carrée de 6 mètres de côté et de 9 mètres de haut, une à chaque angle, reliées par des murs de pierre de 24 mètres de long qui forment un espace clos. Chaque mur est épais de 30 cm et fait de panneaux de 3 mètres de large et 6 mètres de haut, chacun entre deux panneaux ou entre un panneau et une tourelle. Vous pouvez placer jusqu''à quatre portes dans les murs extérieurs.

Un petit donjon se dresse à l''intérieur des murs, à base carrée de 15 mètres de côté, avec trois étages de 3 mètres de haut. Chaque étage peut être divisé en autant de pièces que vous voulez, chacune d''au moins 1,50 mètre de côté. Des escaliers de pierre relient les étages, les murs du donjon font 15 cm d''épaisseur et les pièces ont des portes de pierre ou des arches. Vous l''aménagez et le décorez à votre guise, et il contient assez de nourriture pour servir chaque jour un banquet de neuf plats à 100 personnes. Meubles, nourriture et objets créés par le sort tombent en poussière s''ils sont emportés hors de la forteresse.

Un personnel de cent serviteurs invisibles obéit aux ordres des créatures que vous désignez à l''incantation ; chacun fonctionne comme s''il avait été créé par le sort *serviteur invisible*.

Murs, tourelles et donjon sont de pierre et peuvent être détruits. Chaque section carrée de 3 mètres de côté a une CA de 15 et 30 points de vie par tranche de 2,50 cm d''épaisseur, et est immunisée contre le poison et les dégâts psychiques. La réduire à 0 point de vie la détruit et peut faire s''effondrer les sections qui y sont reliées, à la discrétion du MD.

Après 7 jours, ou si vous lancez le sort ailleurs, la forteresse s''enfonce dans le sol sans dégâts et laisse au sol les créatures qui s''y trouvaient.

Lancer ce sort au même endroit chaque semaine pendant un an rend la forteresse permanente.', 2, NULL, NULL, '{"shape":"square","size":36}', NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Forteresse majestueuse' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Forteresse majestueuse' AND s.ruleset = '5';

-- Ténèbres oppressantes
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Ténèbres oppressantes', 8, '1 action', 45, '["V","M"]', 'une goutte de poix mélangée à une goutte de mercure', NULL, 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Des ténèbres magiques jaillissent d''un point de votre choix à portée et emplissent jusqu''à la fin du sort une sphère de 18 mètres de rayon. Elles contournent les coins. La vision dans le noir ne les perce pas, et une lumière non magique ou créée par un sort de niveau 8 ou moins ne peut les éclairer. On y entend des cris, des murmures et des rires inquiétants. Chaque fois qu''une créature commence son tour dans la sphère, elle doit effectuer un jet de sauvegarde de Sagesse et subit 8d8 dégâts psychiques en cas d''échec, la moitié en cas de réussite.', 5, '{"ability":"wis","success":"half"}', NULL, '{"shape":"sphere","size":18}', '[{"damage_type":"psychic","damage_at_slot_level":{"8":"8d8"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Ténèbres oppressantes' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Ténèbres oppressantes' AND s.ruleset = '5';

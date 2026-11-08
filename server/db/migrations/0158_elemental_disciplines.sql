-- Voie des quatre éléments — disciplines élémentaires (C11 #232).
-- Pose sur une base déployée les seize disciplines (options taguées `elemental_discipline`, jamais attribuées d'office, payées en ki
-- par `meta.cost`), leur point de choix (une discipline au niveau 3, puis une aux niveaux 6, 11 et 17, remplaçable) et le texte de
-- « Disciple des éléments », qui porte désormais Lien élémentaire et le lancer de sort élémentaire. Pendant du seed :
-- server/db/seeds/data/elemental_disciplines.ts + moine.ts, gardé par test/nuxt/elementalDisciplinesMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente, limitée à l'édition 2014 et tolérante base vierge : rien n'est créé sans la
-- sous-classe. Jamais BEGIN (D1).

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Crochets du serpent de feu', 'Quand vous faites l''action Attaquer, vous pouvez dépenser 1 point de ki pour envelopper vos poings et vos pieds de flammes. Votre allonge à mains nues augmente de 3 mètres pour cette action et le reste du tour. Chaque coup qui touche inflige des dégâts de feu au lieu de contondants, et si vous dépensez 1 point de ki de plus quand l''attaque touche, elle inflige 1d10 dégâts de feu supplémentaires.', 'subclass_feature', s.id, 3, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Crochets du serpent de feu' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Défense de la montagne éternelle', 'Vous pouvez dépenser 5 points de ki pour vous lancer le sort peau de pierre.', 'subclass_feature', s.id, 17, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":5}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Défense de la montagne éternelle' AND f.level_required = 17);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Destrier des vents', 'Vous pouvez dépenser 4 points de ki pour vous lancer le sort vol.', 'subclass_feature', s.id, 11, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":4}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Destrier des vents' AND f.level_required = 11);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Étreinte du vent du nord', 'Vous pouvez dépenser 3 points de ki pour lancer le sort immobilisation de personne.', 'subclass_feature', s.id, 6, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":3}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Étreinte du vent du nord' AND f.level_required = 6);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Façonnage de la rivière', 'En action, vous dépensez 1 point de ki pour agir sur une zone d''eau ou de glace d''au plus 9 mètres de côté, à 36 mètres ou moins de vous. Vous pouvez changer l''eau en glace et inversement, remodeler la glace, élever ou abaisser son niveau, creuser ou combler une tranchée, ériger ou abattre un mur, ou créer un pilier. L''ampleur ne peut dépasser la moitié de la plus grande dimension de la zone (dans un carré de 9 mètres : un pilier jusqu''à 4,50 mètres, une tranchée de 4,50 mètres de profondeur). Vous ne pouvez pas piéger ni emprisonner une créature, et aucun jet de sauvegarde n''est prévu.', 'subclass_feature', s.id, 3, 'action', 'elemental_discipline', '{"cost":{"resource":"ki","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Façonnage de la rivière' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Flammes du phénix', 'Vous pouvez dépenser 4 points de ki pour lancer le sort boule de feu.', 'subclass_feature', s.id, 11, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":4}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Flammes du phénix' AND f.level_required = 11);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Fouet de l''onde', 'En action, vous dépensez 2 points de ki : une créature visible à 9 mètres ou moins doit réussir un jet de sauvegarde de Dextérité (DD de ki). En cas d''échec, elle subit 3d10 dégâts contondants, plus 1d10 par point de ki supplémentaire dépensé, et vous pouvez la jeter à terre ou la tirer de 7,50 mètres vers vous. En cas de réussite, elle subit la moitié des dégâts et n''est ni tirée ni jetée à terre.', 'subclass_feature', s.id, 3, 'action', 'elemental_discipline', '{"cost":{"resource":"ki","amount":2}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Fouet de l''onde' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Frappe de cendres', 'Vous pouvez dépenser 2 points de ki pour lancer le sort mains brûlantes.', 'subclass_feature', s.id, 3, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":2}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Frappe de cendres' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Gong du sommet', 'Vous pouvez dépenser 3 points de ki pour lancer le sort fracassement.', 'subclass_feature', s.id, 6, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":3}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Gong du sommet' AND f.level_required = 6);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Poing de l''air', 'En action, vous dépensez 2 points de ki : une créature à 9 mètres ou moins doit réussir un jet de sauvegarde de Force (DD de ki). En cas d''échec, elle subit 3d10 dégâts contondants, plus 1d10 par point de ki supplémentaire dépensé, est repoussée de 6 mètres et jetée à terre. En cas de réussite, elle subit la moitié des dégâts et n''est ni repoussée ni jetée à terre.', 'subclass_feature', s.id, 3, 'action', 'elemental_discipline', '{"cost":{"resource":"ki","amount":2}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Poing de l''air' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Poing des quatre tonnerres', 'Vous pouvez dépenser 2 points de ki pour lancer le sort vague tonnante.', 'subclass_feature', s.id, 3, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":2}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Poing des quatre tonnerres' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Posture de brume', 'Vous pouvez dépenser 4 points de ki pour vous lancer le sort forme gazeuse.', 'subclass_feature', s.id, 11, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":4}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Posture de brume' AND f.level_required = 11);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Ruée des esprits du vent', 'Vous pouvez dépenser 2 points de ki pour lancer le sort bourrasque.', 'subclass_feature', s.id, 3, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":2}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Ruée des esprits du vent' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Souffle de l''hiver', 'Vous pouvez dépenser 6 points de ki pour lancer le sort cône de froid.', 'subclass_feature', s.id, 17, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":6}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Souffle de l''hiver' AND f.level_required = 17);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Torrent de flammes voraces', 'Vous pouvez dépenser 5 points de ki pour lancer le sort mur de feu.', 'subclass_feature', s.id, 17, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":5}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Torrent de flammes voraces' AND f.level_required = 17);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Vague de terre grondante', 'Vous pouvez dépenser 6 points de ki pour lancer le sort mur de pierre.', 'subclass_feature', s.id, 17, NULL, 'elemental_discipline', '{"cost":{"resource":"ki","amount":6}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Vague de terre grondante' AND f.level_required = 17);

UPDATE features SET description = 'Au niveau 3, vous apprenez des disciplines élémentaires qui puisent dans votre ki. Chaque utilisation d''une discipline dépense des points de ki.

**Disciplines :** vous connaissez Lien élémentaire et une autre discipline de votre choix, et en apprenez une de plus aux niveaux 6, 11 et 17. Chaque fois que vous en apprenez une nouvelle, vous pouvez aussi en remplacer une que vous connaissez par une autre. Certaines disciplines exigent un niveau de moine minimum.

**Lien élémentaire :** en action, vous maîtrisez brièvement les forces élémentaires dans un rayon de 9 mètres. Choisissez un effet : un effet sensoriel inoffensif et instantané lié à l''air, à la terre, au feu ou à l''eau ; allumer ou éteindre instantanément une bougie, une torche ou un petit feu de camp ; refroidir ou réchauffer jusqu''à 500 g de matière non vivante pendant 1 heure ; modeler du feu, de la terre, de l''eau ou de la brume (un cube de 30 cm d''arête au plus) en une forme grossière pendant 1 minute.

**Lancer un sort élémentaire :** une discipline qui lance un sort utilise son temps d''incantation et ses règles, sans composantes matérielles. À partir du niveau 5, vous pouvez dépenser des points de ki supplémentaires : chacun augmente le niveau du sort d''un cran, si le sort gagne à être lancé plus haut. Le total de points de ki d''un sort (coût de la discipline compris) ne peut dépasser 3 aux niveaux 5 à 8, 4 aux niveaux 9 à 12, 5 aux niveaux 13 à 16 et 6 aux niveaux 17 à 20.', action_type = NULL
WHERE name = 'Disciple des éléments' AND level_required = 3
  AND subclass_id IN (SELECT s.id FROM subclasses s JOIN classes c ON c.id = s.class_id WHERE s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5');

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'elemental_disciplines', '{"op":"lookup","table":[0,0,1,1,1,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4]}', '{"type":"feature_group","group":"elemental_discipline"}', 1
FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
WHERE f.name = 'Disciple des éléments' AND f.level_required = 3 AND s.name = 'Voie des quatre éléments' AND c.name = 'Moine' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'elemental_disciplines');

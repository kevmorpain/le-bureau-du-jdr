-- Rôdeur — Ennemi juré et Explorateur-né deviennent des points de choix : un ennemi et un terrain dès le niveau 1,
-- un de plus aux niveaux 6 et 14 (ennemis), 6 et 10 (terrains). Les propriétaires sont les capacités elles-mêmes, qui restent
-- visibles. Pendant du seed : server/db/seeds/data/rodeur.ts, gardé par test/nuxt/rangerFavoritesMigration.test.ts.
-- Idempotente, limitée à l'édition 2014 et tolérante base vierge : rien n'est créé sans la capacité.

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'favored_enemy', '{"op":"lookup","table":[1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3]}', '{"type":"enum","values":["Aberrations","Artificiels","Bêtes","Célestes","Dragons","Élémentaires","Fées","Fiélons","Géants","Monstruosités","Morts-vivants","Plantes","Vases","Humanoïdes (deux races)"]}', 0
FROM features f JOIN classes c ON c.id = f.class_id
WHERE f.name = 'Ennemi juré' AND f.feature_type = 'class_feature' AND c.name = 'Rôdeur' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'favored_enemy');

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'terrain', '{"op":"lookup","table":[1,1,1,1,1,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3]}', '{"type":"enum","values":["Arctique","Désert","Forêt","Littoral","Marais","Montagne","Outreterre","Plaine"]}', 0
FROM features f JOIN classes c ON c.id = f.class_id
WHERE f.name = 'Explorateur-né' AND f.feature_type = 'class_feature' AND c.name = 'Rôdeur' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'terrain');

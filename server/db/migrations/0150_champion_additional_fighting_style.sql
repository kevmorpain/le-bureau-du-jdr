-- Champion — « Style de combat supplémentaire » (niveau 10) devient un point de choix : une deuxième option parmi les styles de
-- combat du Guerrier, différente de la première. Le propriétaire est la capacité de sous-classe elle-même, qui reste visible.
-- Pendant du seed : server/db/seeds/data/guerrier.ts, gardé par test/nuxt/championFightingStyleMigration.test.ts.
-- Idempotente, limitée à l'édition 2014 et tolérante base vierge : rien n'est créé sans la capacité.

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'additional_fighting_style', '{"op":"fixed","value":1}', '{"type":"feature_group","group":"fighting_style"}', 0
FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
WHERE f.name = 'Style de combat supplémentaire' AND s.name = 'Champion' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'additional_fighting_style');

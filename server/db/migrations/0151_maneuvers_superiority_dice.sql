-- Maître de guerre — manœuvres, dés de supériorité et Disciple martial.
-- Pose sur une base déployée les seize manœuvres (options taguées `maneuver`, jamais attribuées d'office), leur point de choix
-- (3 manœuvres au niveau 3, puis 5, 7 et 9 aux niveaux 7, 10 et 15, remplaçables), le compteur de dés de supériorité (dés regagnés
-- au repos court ; d8, d10 au niveau 10, d12 au niveau 18), le DD de manœuvre (Force ou Dextérité) et le choix d'outil d'artisan
-- de « Disciple martial ». Pendant du seed : server/db/seeds/data/maneuvers.ts + guerrier.ts, gardé par
-- test/nuxt/maneuversMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente, limitée à l'édition 2014 et tolérante base vierge : rien n'est créé sans
-- la sous-classe.

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Attaque menaçante', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. La cible fait un jet de sauvegarde de Sagesse ; en cas d''échec, elle est effrayée jusqu''à la fin de votre prochain tour.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Attaque menaçante' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Attaque précise', 'Quand vous faites une attaque avec une arme, vous pouvez dépenser un dé de supériorité et l''ajouter au jet d''attaque, avant ou après le jet, mais avant que les effets de l''attaque ne s''appliquent.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Attaque précise' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Balayage', 'Quand vous touchez une créature au corps à corps, vous pouvez dépenser un dé de supériorité pour tenter de toucher une autre créature située à 1,50 m ou moins de la première et à votre portée. Faites un jet d''attaque contre elle ; si elle est touchée, elle subit des dégâts égaux au dé de supériorité, du même type que ceux de l''attaque initiale.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Balayage' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Croc-en-jambe', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. Si la cible est de taille G ou inférieure, elle fait un jet de sauvegarde de Force ; en cas d''échec, vous la jetez à terre.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Croc-en-jambe' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Désarmement', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. La cible fait un jet de sauvegarde de Force ; en cas d''échec, elle lâche l''objet de votre choix, qui tombe à ses pieds.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Désarmement' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Diversion', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. Jusqu''au début de votre prochain tour, la prochaine attaque d''un allié contre cette cible a l''avantage.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Diversion' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Feinte', 'Par une action bonus à votre tour, vous pouvez dépenser un dé de supériorité pour feinter une créature située à 1,50 m ou moins. Vous avez l''avantage à votre prochaine attaque contre elle ce tour-ci ; si cette attaque touche, ajoutez le dé aux dégâts.', 'subclass_feature', s.id, 3, 'bonus_action', 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Feinte' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Fente', 'Quand vous faites une attaque de corps à corps pendant votre tour, vous pouvez dépenser un dé de supériorité pour augmenter votre allonge de 1,50 m pour cette attaque. Si elle touche, ajoutez le dé aux dégâts.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Fente' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Instruction', 'Quand vous utilisez l''action Attaquer, vous pouvez renoncer à une de vos attaques et, par une action bonus, désigner un allié qui peut vous voir ou vous entendre, en dépensant un dé de supériorité. Cet allié peut utiliser immédiatement sa réaction pour faire une attaque avec une arme, en ajoutant le dé aux dégâts.', 'subclass_feature', s.id, 3, 'bonus_action', 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Instruction' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Jeu de jambes défensif', 'Quand vous vous déplacez, vous pouvez dépenser un dé de supériorité, le lancer et ajouter le résultat à votre CA jusqu''à la fin de ce déplacement.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Jeu de jambes défensif' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Manœuvre tactique', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. Un allié qui peut vous voir ou vous entendre peut alors utiliser sa réaction pour se déplacer de la moitié de sa vitesse sans provoquer d''attaque d''opportunité de la part de la cible.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Manœuvre tactique' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Parade', 'Quand une créature vous touche avec une attaque de corps à corps, vous pouvez utiliser votre réaction et dépenser un dé de supériorité pour réduire les dégâts du résultat du dé, plus votre modificateur de Dextérité.', 'subclass_feature', s.id, 3, 'reaction', 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Parade' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Provocation', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. La cible fait un jet de sauvegarde de Sagesse ; en cas d''échec, elle a le désavantage à ses jets d''attaque contre toute cible autre que vous jusqu''à la fin de votre prochain tour.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Provocation' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Regain', 'Par une action bonus à votre tour, vous pouvez dépenser un dé de supériorité pour un allié qui peut vous voir ou vous entendre. Il gagne des points de vie temporaires égaux au résultat du dé, plus votre modificateur de Charisme.', 'subclass_feature', s.id, 3, 'bonus_action', 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Regain' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Repousser', 'Quand vous touchez une créature avec une attaque d''arme, vous pouvez dépenser un dé de supériorité et l''ajouter aux dégâts. Si la cible est de taille G ou inférieure, elle fait un jet de sauvegarde de Force ; en cas d''échec, vous la repoussez jusqu''à 4,50 m de vous.', 'subclass_feature', s.id, 3, NULL, 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Repousser' AND f.level_required = 3);

INSERT INTO features (name, description, feature_type, subclass_id, level_required, action_type, tag, meta)
SELECT 'Riposte', 'Quand une créature vous rate avec une attaque de corps à corps, vous pouvez utiliser votre réaction et dépenser un dé de supériorité pour l''attaquer en retour avec une arme de corps à corps. Si vous touchez, ajoutez le dé aux dégâts.', 'subclass_feature', s.id, 3, 'reaction', 'maneuver', '{"cost":{"resource":"superiority_dice","amount":1}}'
FROM subclasses s JOIN classes c ON c.id = s.class_id
WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM features f WHERE f.subclass_id = s.id AND f.name = 'Riposte' AND f.level_required = 3);

UPDATE features SET
  description = 'Au niveau 3, vous apprenez des manœuvres alimentées par des dés de supériorité.

**Manœuvres :** vous connaissez trois manœuvres de votre choix, et en apprenez deux de plus aux niveaux 7, 10 et 15. Chaque fois que vous en apprenez de nouvelles, vous pouvez aussi en remplacer une que vous connaissez par une autre.

**Dés de supériorité :** vous disposez de quatre dés de supériorité (d8), d''un cinquième au niveau 7 et d''un sixième au niveau 15. Vous regagnez les dés dépensés à la fin d''un repos court ou long. Ils deviennent des d10 au niveau 10 et des d12 au niveau 18.

**Jets de sauvegarde :** DD de manœuvre = 8 + votre bonus de maîtrise + votre modificateur de Force ou de Dextérité (au choix).',
  max_uses_formula = '{"op":"lookup","table":[0,0,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6]}',
  meta = '{"resource":"superiority_dice","saveDcAbility":["str","dex"]}'
WHERE name = 'Supériorité martiale' AND level_required = 3
  AND subclass_id IN (SELECT s.id FROM subclasses s JOIN classes c ON c.id = s.class_id WHERE s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5');

INSERT INTO effects (type, value) SELECT 'resource_die', '{"sides":{"op":"lookup","table":[8,8,8,8,8,8,8,8,8,10,10,10,10,10,10,10,10,12,12,12]}}'
WHERE EXISTS (SELECT 1 FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
    WHERE f.name = 'Supériorité martiale' AND f.level_required = 3 AND s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'resource_die' AND value = '{"sides":{"op":"lookup","table":[8,8,8,8,8,8,8,8,8,10,10,10,10,10,10,10,10,12,12,12]}}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
JOIN effects e ON e.type = 'resource_die' AND e.value = '{"sides":{"op":"lookup","table":[8,8,8,8,8,8,8,8,8,10,10,10,10,10,10,10,10,12,12,12]}}'
WHERE f.name = 'Supériorité martiale' AND f.level_required = 3 AND s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5';

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'maneuvers', '{"op":"lookup","table":[0,0,3,3,3,3,5,5,5,7,7,7,7,7,9,9,9,9,9,9]}', '{"type":"feature_group","group":"maneuver"}', 1
FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
WHERE f.name = 'Supériorité martiale' AND f.level_required = 3 AND s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'maneuvers');

INSERT INTO progression (feature_id, kind, count, option_source, replaceable)
SELECT f.id, 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de forgeron","Outils de charpentier","Outils de cordonnier","Ustensiles de cuisinier","Outils de bijoutier","Outils de maçon","Matériel de peintre","Outils de potier","Outils de tanneur","Outils de tisserand","Outils de souffleur de verre","Matériel d''alchimiste","Matériel de brasseur","Matériel de calligraphe","Outils de cartographe","Outils de bricoleur","Outils de menuisier"]}', 0
FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id
WHERE f.name = 'Disciple martial' AND f.level_required = 3 AND s.name = 'Maître de guerre' AND c.name = 'Guerrier' AND c.ruleset = '5'
  AND NOT EXISTS (SELECT 1 FROM progression p WHERE p.feature_id = f.id AND p.kind = 'tool');

-- Tables de sort (suite du lot 8) : un sort peut renvoyer à une table à lancer (`spells.roll_table_id`, comme
-- `features.roll_table_id`). Confusion (d10) et Espièglerie de nathair (d4) y déplacent leurs cas ; leur prose renvoie à la
-- table. Pendant du seed : server/db/seeds/data/{rollTables,spells}.ts, gardé par test/nuxt/spellRollTablesMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) : crée la table si le sort existe déjà, puis pose le lien et la description.
-- Limitée à l'édition 2014 ; tolérante base vierge : rien n'est posé si le sort n'existe pas encore, le seed s'en charge.
-- Jamais BEGIN (D1).

ALTER TABLE `spells` ADD COLUMN `roll_table_id` integer REFERENCES roll_tables(id) ON DELETE set null;

INSERT INTO roll_tables (key, ruleset, name, die, entries, created_at) SELECT 'confusion', '5', 'Confusion', 10, '[{"min":1,"max":1,"text":"La créature emploie tout son mouvement à se déplacer dans une direction aléatoire (1d8) et n''agit pas."},{"min":2,"max":6,"text":"La créature ne bouge pas et n''agit pas."},{"min":7,"max":8,"text":"La créature attaque au corps à corps une créature à sa portée choisie au hasard, ou ne fait rien si aucune n''est à portée."},{"min":9,"max":10,"text":"La créature agit et se déplace normalement."}]', CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM spells WHERE name = 'Confusion' AND ruleset = '5') AND NOT EXISTS (SELECT 1 FROM roll_tables WHERE key = 'confusion' AND ruleset = '5');

INSERT INTO roll_tables (key, ruleset, name, die, entries, created_at) SELECT 'nathair_mischief', '5', 'Espièglerie de nathair', 4, '[{"min":1,"max":1,"text":"Désavantage aux jets d''attaque (fous rires)."},{"min":2,"max":2,"text":"Jet de sauvegarde de Sagesse ou effrayée."},{"min":3,"max":3,"text":"Jet de sauvegarde de Constitution ou incapable de parler autrement qu''en gloussant."},{"min":4,"max":4,"text":"Jet de sauvegarde de Sagesse ou charmée par une illusion inoffensive."}]', CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM spells WHERE name = 'Espièglerie de nathair' AND ruleset = '5') AND NOT EXISTS (SELECT 1 FROM roll_tables WHERE key = 'nathair_mischief' AND ruleset = '5');

UPDATE spells SET description = 'Vous assaillez les esprits dans une sphère de 3 mètres de rayon centrée sur un point à portée. Chaque créature de la zone doit réussir un jet de sauvegarde de Sagesse ou être affectée.

Une cible affectée ne peut plus réagir et lance 1d10 au début de chacun de ses tours pour déterminer son comportement (table ci-dessous).

À la fin de chacun de ses tours, une cible peut refaire le jet de sauvegarde ; en cas de réussite, l''effet cesse pour elle.

**Aux niveaux supérieurs**. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, le rayon de la sphère augmente de 1,50 mètre pour chaque niveau d''emplacement au-delà du niveau 4.', roll_table_id = (SELECT id FROM roll_tables WHERE key = 'confusion' AND ruleset = '5') WHERE name = 'Confusion' AND ruleset = '5';

UPDATE spells SET description = 'Vous invoquez la magie facétieuse des fées dans un cube de 6 mètres d''arête à portée. Au début de chacun de vos tours, lancez un d4 pour déterminer l''effet aléatoire qui s''applique aux créatures de votre choix dans le cube (table ci-dessous).

Les effets à jet de sauvegarde utilisent votre DD de sauvegarde des sorts et durent jusqu''au début de votre prochain tour.', roll_table_id = (SELECT id FROM roll_tables WHERE key = 'nathair_mischief' AND ruleset = '5') WHERE name = 'Espièglerie de nathair' AND ruleset = '5';

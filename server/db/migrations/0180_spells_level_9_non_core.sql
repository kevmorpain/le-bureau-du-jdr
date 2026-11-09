-- Sorts de niveau 9 hors socle (Xanathar, Tasha) (#176 D1) : les 4 sorts que la liste AideDD 2014 donne à ce niveau et que le seed n'avait pas, avec leurs liens de classes.
-- Pendant du seed : server/db/seeds/data/spells_hors_socle_niveau_9.ts, gardé par test/nuxt/spellsLevelHorsSocle9Migration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de sorts n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

-- Hurlement psychique
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Hurlement psychique', 9, '1 action', 27, '["S"]', NULL, NULL, 0, 'Instantanée', 'instant', NULL, 0, 'Vous déchaînez la puissance de votre esprit pour faire exploser le cerveau de dix créatures au plus de votre choix que vous voyez à portée. Une créature d''Intelligence 2 ou moins n''est pas affectée. Chaque cible doit effectuer un jet de sauvegarde d''Intelligence : en cas d''échec, elle subit 14d6 dégâts psychiques et est étourdie ; en cas de réussite, elle ne subit que la moitié des dégâts et n''est pas étourdie. Une cible tuée par ces dégâts voit sa tête exploser, si elle en a une.

Une créature étourdie refait le jet de sauvegarde d''Intelligence à la fin de chacun de ses tours ; en cas de réussite, l''effet cesse.', 4, '{"ability":"int","success":"half"}', NULL, NULL, '[{"damage_type":"psychic","damage_at_slot_level":{"9":"14d6"}}]', NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Hurlement psychique' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Hurlement psychique' AND s.ruleset = '5';

-- Invulnérabilité
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Invulnérabilité', 9, '1 action', 0, '["V","S","M"]', 'une petite pièce en adamantium d''une valeur d''au moins 500 po, que le sort consomme', '{"amount":500,"unit":"po","consumed":true}', 0, 'Concentration, jusqu''à 10 minutes', 'minute', 10, 1, 'Vous êtes immunisé contre tous les types de dégâts pour la durée du sort.', 1, NULL, NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invulnérabilité' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Magicien') AND c.ruleset = '5'
WHERE s.name = 'Invulnérabilité' AND s.ruleset = '5';

-- Lame du désastre
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Lame du désastre', 9, '1 action bonus', 18, '["V","S"]', NULL, NULL, 0, 'Concentration, jusqu''à 1 minute', 'minute', 1, 1, 'Vous créez une faille planaire en forme de lame, longue d''environ 1 mètre, dans un espace inoccupé que vous voyez à portée, pour la durée du sort. À l''incantation, vous pouvez faire deux attaques au corps à corps avec un sort avec la lame, chacune contre une créature, un objet isolé ou une structure à moins de 1,5 mètre de la lame. Si une attaque touche, la cible subit 4d12 dégâts de force. Le jet est un coup critique sur un 18 ou plus au d20 ; la lame inflige alors 8d12 dégâts de force supplémentaires (12d12 au total).

Par une action bonus, vous pouvez déplacer la lame de 9 mètres au plus vers un espace inoccupé que vous voyez, puis lui faire faire jusqu''à 2 nouvelles attaques au corps à corps avec un sort.

La lame traverse sans danger tout mur ou obstacle, y compris un *mur de force*.', 2, NULL, 'melee', NULL, '[{"damage_type":"force","damage_at_slot_level":{"9":"4d12"}}]', NULL, 'tasha'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lame du désastre' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Ensorceleur', 'Magicien', 'Occultiste') AND c.ruleset = '5'
WHERE s.name = 'Lame du désastre' AND s.ruleset = '5';

-- Métamorphose de groupe
INSERT INTO spells (name, level, casting_time, range, components, material, material_cost, ritual, duration, duration_unit, duration_value, concentration, description, school_id, dc, attack_type, area_of_effect, damages, heal, source)
SELECT 'Métamorphose de groupe', 9, '1 action', 36, '["V","S","M"]', 'un cocon de chenille', NULL, 0, 'Concentration, jusqu''à 1 heure', 'hour', 1, 1, 'Vous transformez jusqu''à dix créatures de votre choix que vous voyez à portée. Une cible non consentante doit réussir un jet de sauvegarde de Sagesse pour résister ; un métamorphe non consentant réussit automatiquement.

Chaque cible prend la forme d''une bête de votre choix, identique ou différente pour chacune. La forme peut être celle de toute bête que vous avez déjà vue et dont le facteur de puissance est au plus celui de la cible (ou la moitié de son niveau si elle n''en a pas). Les statistiques de la cible, mentales comprises, sont remplacées par celles de la bête, mais elle garde ses points de vie, son alignement et sa personnalité.

Chaque cible gagne des points de vie temporaires égaux aux points de vie de sa nouvelle forme, qu''aucun autre point de vie temporaire ne peut remplacer. Elle retrouve sa forme normale quand elle n''a plus de points de vie temporaires ou meurt ; si le sort prend fin avant, elle perd ses points de vie temporaires et reprend sa forme normale.

La nature de sa nouvelle forme limite les actions de la créature : elle ne peut ni parler, ni lancer de sorts, ni rien faire qui demande des mains ou la parole. Son équipement fusionne avec sa nouvelle forme, et elle ne peut ni l''activer, ni l''utiliser, ni le manipuler, ni en tirer le moindre avantage.', 8, '{"ability":"wis","success":"none"}', NULL, NULL, NULL, NULL, 'xanathar'
WHERE EXISTS (SELECT 1 FROM spells)
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Métamorphose de groupe' AND ruleset = '5');

INSERT OR IGNORE INTO spell_classes (spell_id, class_id, ruleset)
SELECT s.id, c.id, '5' FROM spells s JOIN classes c ON c.name IN ('Barde', 'Ensorceleur', 'Magicien') AND c.ruleset = '5'
WHERE s.name = 'Métamorphose de groupe' AND s.ruleset = '5';

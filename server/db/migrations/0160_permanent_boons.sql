-- Faveurs permanentes (O7a #164) : les six manuels et tomes (+2 à une caractéristique et à son maximum), de type `boon`. Elles se
-- portent comme un don (ajout par « Ajouter une faveur », effets lus par featureEffectsOf) et restent hors des choix de dons.
-- Pendant du seed : server/db/seeds/data/boons.ts + seeds/feats.ts, gardé par test/nuxt/boonsMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), idempotente (NOT EXISTS / INSERT OR IGNORE), limitée à l'édition 2014 et tolérante base
-- vierge : rien n'est posé tant que le catalogue de dons n'est pas semé, le seed s'en charge alors. Jamais BEGIN (D1).

INSERT INTO features (name, description, feature_type)
SELECT 'Manuel de vitalité', 'Votre Constitution augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vitalité' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO features (name, description, feature_type)
SELECT 'Manuel d''exercices physiques', 'Votre Force augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Manuel d''exercices physiques' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO features (name, description, feature_type)
SELECT 'Manuel de vivacité', 'Votre Dextérité augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vivacité' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO features (name, description, feature_type)
SELECT 'Traité de perspicacité', 'Votre Intelligence augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Traité de perspicacité' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO features (name, description, feature_type)
SELECT 'Traité d''autorité et d''influence', 'Votre Charisme augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Traité d''autorité et d''influence' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO features (name, description, feature_type)
SELECT 'Traité de compréhension', 'Votre Sagesse augmente de 2, ainsi que son maximum. Il a fallu 48 heures d''étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.', 'boon'
WHERE EXISTS (SELECT 1 FROM features WHERE feature_type = 'feat')
  AND NOT EXISTS (SELECT 1 FROM features WHERE name = 'Traité de compréhension' AND feature_type = 'boon' AND ruleset = '5');

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"con","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vitalité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"con","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"con","amount":2}'
WHERE f.name = 'Manuel de vitalité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"con","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vitalité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"con","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"con","amount":2}'
WHERE f.name = 'Manuel de vitalité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"str","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel d''exercices physiques' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"str","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"str","amount":2}'
WHERE f.name = 'Manuel d''exercices physiques' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"str","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel d''exercices physiques' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"str","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"str","amount":2}'
WHERE f.name = 'Manuel d''exercices physiques' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"dex","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vivacité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"dex","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"dex","amount":2}'
WHERE f.name = 'Manuel de vivacité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"dex","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Manuel de vivacité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"dex","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"dex","amount":2}'
WHERE f.name = 'Manuel de vivacité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"int","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité de perspicacité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"int","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"int","amount":2}'
WHERE f.name = 'Traité de perspicacité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"int","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité de perspicacité' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"int","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"int","amount":2}'
WHERE f.name = 'Traité de perspicacité' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"cha","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité d''autorité et d''influence' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"cha","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"cha","amount":2}'
WHERE f.name = 'Traité d''autorité et d''influence' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"cha","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité d''autorité et d''influence' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"cha","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"cha","amount":2}'
WHERE f.name = 'Traité d''autorité et d''influence' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_increase', '{"ability":"wis","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité de compréhension' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_increase' AND value = '{"ability":"wis","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_increase' AND e.value = '{"ability":"wis","amount":2}'
WHERE f.name = 'Traité de compréhension' AND f.feature_type = 'boon' AND f.ruleset = '5';

INSERT INTO effects (type, value) SELECT 'ability_max_increase', '{"ability":"wis","amount":2}'
WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Traité de compréhension' AND feature_type = 'boon' AND ruleset = '5')
  AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"wis","amount":2}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'ability_max_increase' AND e.value = '{"ability":"wis","amount":2}'
WHERE f.name = 'Traité de compréhension' AND f.feature_type = 'boon' AND f.ruleset = '5';

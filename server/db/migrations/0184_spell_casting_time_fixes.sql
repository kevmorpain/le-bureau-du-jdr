-- Pendant du seed (server/db/seeds/data/spells.ts) : auto-suffisante, idempotente et limitée à l'édition 2014.
-- Ne réécrit que la valeur fausse, pour ne toucher ni une correction faite à la main ni l'homonyme 2024.

UPDATE spells SET casting_time = '1 action bonus'
WHERE name = 'Mot de guérison' AND ruleset = '5' AND casting_time = '1 action';

UPDATE spells SET casting_time = '1 minute'
WHERE name = 'Invocation de fée' AND ruleset = '5' AND casting_time = '1 action';

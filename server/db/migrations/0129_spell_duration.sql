-- Durée structurée des sorts (#171 S6, #184 U6). `duration_unit` / `duration_value` portent ce que le suivi des sorts actifs
-- décompte ; `duration` reste le texte affiché (formulation AideDD, ou saisie libre pour l'unité `special`). Pendant du seed :
-- server/db/seeds/data/spells.ts, gardé par test/nuxt/spellDurationMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) ; les UPDATE posent des valeurs fixes, donc rejouables. Un sort dont le texte n'est
-- pas l'une des formes connues garde `special` (suivi avec son libellé, sans décompte) : « Instantanée ou 1 heure », ou un
-- sort saisi à la main. Jamais BEGIN (D1).

ALTER TABLE `spells` ADD `duration_unit` text DEFAULT 'special' NOT NULL;
ALTER TABLE `spells` ADD `duration_value` integer;

UPDATE `spells` SET duration_unit = 'instant', duration_value = NULL WHERE lower(duration) IN ('instantanée', 'instantané');
UPDATE `spells` SET duration_unit = 'until_dispelled', duration_value = NULL WHERE duration = 'Jusqu''à dissipation ou déclenchement';
UPDATE `spells` SET duration_unit = 'round', duration_value = 1 WHERE duration = '1 round';
UPDATE `spells` SET duration_unit = 'minute', duration_value = 1 WHERE duration IN ('1 minute', 'Concentration, jusqu''à 1 minute');
UPDATE `spells` SET duration_unit = 'minute', duration_value = 10 WHERE duration IN ('10 minutes', 'Concentration, jusqu''à 10 minutes');
UPDATE `spells` SET duration_unit = 'hour', duration_value = 1 WHERE duration IN ('1 heure', 'Concentration, jusqu''à 1 heure');
UPDATE `spells` SET duration_unit = 'hour', duration_value = 8 WHERE duration IN ('8 heures', 'Concentration, jusqu''à 8 heures', 'Jusqu''à 8 heures');

-- Dix sorts à concentration (Assistance, Bouclier de la foi, Bénédiction, Suggestion…) avaient un texte de durée sans « Concentration, jusqu'à »
-- (AideDD : « concentration, jusqu'à 1 minute »). Après la structure, dont les formes nues restent reconnues.
UPDATE `spells` SET duration = 'Concentration, jusqu''à ' || duration WHERE concentration = 1 AND duration IN ('1 minute', '10 minutes', '8 heures');

-- Réécrit à la forme actuelle de `Effect` les effets de traits d'espèce seedés sous une forme
-- antérieure : le seed d'espèces saute les features existantes et ne les corrige donc jamais, alors
-- que la fiche ne lit que la forme actuelle (ex. Menaçant sans maîtrise d'Intimidation).
--
-- Chaque valeur produite est le texte exact que le seed écrit (JSON.stringify, ordre des clés
-- compris) : sa déduplication find-or-insert compare ce texte.
--
-- Ciblé par forme, pas par id (les ids varient d'une base à l'autre) → idempotent, no-op sur base
-- vierge ou déjà à jour.

UPDATE `effects` SET `value` = json_object('skill', json_extract(`value`, '$.ability'))
WHERE `type` = 'skill_proficiency' AND json_type(`value`) = 'object'
  AND json_extract(`value`, '$.skill') IS NULL AND json_extract(`value`, '$.ability') IS NOT NULL;

UPDATE `effects` SET `value` = json_object('skill', json_extract(`value`, '$'))
WHERE `type` = 'skill_proficiency' AND json_type(`value`) = 'text';

UPDATE `effects` SET `value` = json_object('damageType', json_extract(`value`, '$'))
WHERE `type` = 'damage_resistance' AND json_type(`value`) = 'text';

UPDATE `effects` SET `value` = json_object('rollType', 'saving_throw', 'ability', 'all', 'condition', json_extract(`value`, '$.condition'))
WHERE `type` = 'advantage' AND json_extract(`value`, '$.rollType') IS NULL
  AND json_extract(`value`, '$.ability') = 'saving_throws';

UPDATE `effects` SET `value` = json_object('rollType', json_extract(`value`, '$.type'), 'ability', json_extract(`value`, '$.ability'), 'condition', json_extract(`value`, '$.condition'))
WHERE `type` = 'advantage' AND json_extract(`value`, '$.rollType') IS NULL
  AND json_extract(`value`, '$.type') IS NOT NULL;

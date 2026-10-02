-- PV max dérivés (D19) : `max_hp` stockait une somme qui incluait le modificateur de CON du moment ; la colonne ne garde
-- plus que la part « dés » (`hp_base`), le modificateur de CON × niveau s'ajoute à la lecture (AideDD, « Au-delà du niveau 1 » :
-- +1 PV par niveau quand le modificateur de CON augmente de 1). Les bonus par niveau (Robuste) n'ont jamais été stockés.
--
-- Rattrapage des fiches existantes : « PV max stockés − modificateur de CON actuel × niveau total », sans reconstituer l'historique
-- (les fiches qui ont gagné de la CON en route avaient déjà été corrigées à la main). Le score de CON actuel reprend les sources de
-- shared/rules/abilityScores.ts (espèce, lignée choisie, capacités et dons débloqués, ASI, plafond relevé), objets et effets
-- temporaires exclus comme dans le level-up ; gardé par test/nuxt/hpBaseMigration.test.ts. Jamais BEGIN (D1).

ALTER TABLE character_sheets RENAME COLUMN max_hp TO hp_base;
WITH
  total_level (sheet_id, level) AS (
    SELECT character_sheet_id, SUM(level) FROM character_classes GROUP BY character_sheet_id
  ),
  con_effect (sheet_id, type, amount) AS (
    SELECT cs.id, e.type, json_extract(e.value, '$.amount')
    FROM character_sheets cs
    JOIN species_features sf ON sf.species_id = cs.species_id
    JOIN feature_effects fe ON fe.feature_id = sf.feature_id
    JOIN effects e ON e.id = fe.effect_id
    WHERE e.type IN ('ability_increase', 'ability_max_increase') AND json_extract(e.value, '$.ability') = 'con'

    UNION ALL

    SELECT ch.character_sheet_id, e.type, json_extract(e.value, '$.amount')
    FROM character_choices ch
    JOIN features f ON f.lineage_id = ch.selected_lineage_id
    JOIN total_level tl ON tl.sheet_id = ch.character_sheet_id
    JOIN feature_effects fe ON fe.feature_id = f.id
    JOIN effects e ON e.id = fe.effect_id
    WHERE ch.selected_lineage_id IS NOT NULL
      AND (f.level_required IS NULL OR f.level_required <= tl.level)
      AND e.type IN ('ability_increase', 'ability_max_increase') AND json_extract(e.value, '$.ability') = 'con'

    UNION ALL

    SELECT cf.character_sheet_id, e.type, json_extract(e.value, '$.amount')
    FROM character_features cf
    JOIN features f ON f.id = cf.feature_id
    JOIN feature_effects fe ON fe.feature_id = f.id
    JOIN effects e ON e.id = fe.effect_id
    WHERE e.type IN ('ability_increase', 'ability_max_increase') AND json_extract(e.value, '$.ability') = 'con'
      AND (
        f.feature_type IN ('species_trait', 'eldritch_invocation', 'feat')
        OR (f.feature_type = 'class_feature' AND EXISTS (
          SELECT 1 FROM character_classes cc
          WHERE cc.character_sheet_id = cf.character_sheet_id AND cc.class_id = f.class_id AND cc.level >= COALESCE(f.level_required, 1)))
        OR (f.feature_type NOT IN ('species_trait', 'eldritch_invocation', 'feat', 'class_feature') AND EXISTS (
          SELECT 1 FROM character_classes cc
          WHERE cc.character_sheet_id = cf.character_sheet_id AND cc.subclass_id = f.subclass_id AND cc.level >= COALESCE(f.level_required, 1)))
      )

    UNION ALL

    SELECT cf.character_sheet_id, 'ability_increase', json_extract(e.value, '$.amount')
    FROM character_features cf
    JOIN features f ON f.id = cf.feature_id AND f.feature_type = 'feat'
    JOIN feature_effects fe ON fe.feature_id = f.id
    JOIN effects e ON e.id = fe.effect_id
    WHERE e.type = 'ability_increase_choice' AND json_extract(cf.choices, '$.ability') = 'con'

    UNION ALL

    SELECT asi.character_sheet_id, 'ability_increase', asi.amount
    FROM character_ability_score_improvements asi
    JOIN character_classes cc ON cc.character_sheet_id = asi.character_sheet_id AND cc.class_id = asi.class_id
    WHERE asi.ability = 'con' AND cc.level >= asi.class_level
  ),
  con_score (sheet_id, base, bonus, maximum) AS (
    SELECT cs.id,
      COALESCE((SELECT value FROM character_ability_scores a WHERE a.character_sheet_id = cs.id AND a.ability_id = 'con'), 10),
      COALESCE((SELECT SUM(amount) FROM con_effect x WHERE x.sheet_id = cs.id AND x.type = 'ability_increase'), 0),
      20 + COALESCE((SELECT SUM(amount) FROM con_effect x WHERE x.sheet_id = cs.id AND x.type = 'ability_max_increase'), 0)
    FROM character_sheets cs
  ),
  -- Un plafond borne ce qu'une source ajoute, jamais le score déjà acquis (addCapped).
  con_natural (sheet_id, score) AS (
    SELECT sheet_id, MIN(base + bonus, MAX(maximum, base)) FROM con_score
  ),
  -- ⌊(score − 10) / 2⌋ : x − (x & 1) est pair, y compris pour x négatif (complément à deux).
  con_modifier (sheet_id, modifier) AS (
    SELECT sheet_id, ((score - 10) - ((score - 10) & 1)) / 2 FROM con_natural
  )
UPDATE character_sheets
SET hp_base = MAX(1, hp_base - COALESCE((SELECT modifier FROM con_modifier m WHERE m.sheet_id = character_sheets.id), 0)
  * COALESCE((SELECT level FROM total_level t WHERE t.sheet_id = character_sheets.id), 0));

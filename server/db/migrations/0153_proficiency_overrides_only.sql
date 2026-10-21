-- Une maîtrise de compétence ou de jet de sauvegarde ne se stocke plus que comme ajout manuel
-- (`character_proficiency_overrides`) : ce que les règles accordent se dérive des effets et des choix. Chaque ligne de
-- `character_skills` est rangée là où la fiche la retrouve au même niveau, puis la table disparaît, avec `skills` que
-- rien ne lit ni ne référence (la constante `SKILLS` fait foi). Tolérante base vierge.

-- Clés à l'ancienne casse.
DELETE FROM character_skills
WHERE skill_key IN ('sleightOfHand', 'animalHandling')
  AND EXISTS (
    SELECT 1 FROM character_skills twin
    WHERE twin.character_sheet_id = character_skills.character_sheet_id
      AND twin.source = character_skills.source
      AND twin.skill_key = CASE character_skills.skill_key WHEN 'sleightOfHand' THEN 'sleight_of_hand' ELSE 'animal_handling' END
  );
UPDATE character_skills SET skill_key = 'sleight_of_hand' WHERE skill_key = 'sleightOfHand';
UPDATE character_skills SET skill_key = 'animal_handling' WHERE skill_key = 'animalHandling';

-- « Aucune » n'ajoutait rien à ce que la fiche dérivait.
DELETE FROM character_skills WHERE proficiency_level = 'none';

-- Compétences de classe copiées avant leur passage en choix : choix sur le point « Compétences de classe » d'une classe
-- de la fiche qui les propose, la classe principale d'abord.
INSERT INTO character_choices (character_sheet_id, progression_id, selected_value)
SELECT sheet, pid, skill FROM (
  SELECT cs.character_sheet_id AS sheet, cs.skill_key AS skill, (
    SELECT p.id FROM character_classes cc
    JOIN features f ON f.class_id = cc.class_id AND f.feature_type = 'choice_carrier'
    JOIN progression p ON p.feature_id = f.id AND p.kind = 'skill'
    WHERE cc.character_sheet_id = cs.character_sheet_id
      AND (json_extract(p.option_source, '$.from') = 'all'
        OR EXISTS (SELECT 1 FROM json_each(p.option_source, '$.from') j WHERE j.value = cs.skill_key))
    ORDER BY cc.is_main DESC
    LIMIT 1
  ) AS pid
  FROM character_skills cs
  WHERE cs.source = 'class' AND cs.proficiency_level = 'proficient' AND cs.is_override = 0
    AND cs.skill_key NOT LIKE '%\_save' ESCAPE '\'
)
WHERE pid IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM character_choices ch
    WHERE ch.character_sheet_id = sheet AND ch.progression_id = pid AND ch.selected_value = skill
  );

-- Expertise de classe : choix sur le point d'expertise d'une classe de la fiche.
INSERT INTO character_choices (character_sheet_id, progression_id, selected_value)
SELECT sheet, pid, skill FROM (
  SELECT cs.character_sheet_id AS sheet, cs.skill_key AS skill, (
    SELECT p.id FROM character_classes cc
    JOIN features f ON f.class_id = cc.class_id
    JOIN progression p ON p.feature_id = f.id AND p.kind = 'expertise'
    WHERE cc.character_sheet_id = cs.character_sheet_id
    ORDER BY cc.is_main DESC
    LIMIT 1
  ) AS pid
  FROM character_skills cs
  WHERE cs.source = 'class' AND cs.proficiency_level = 'expert' AND cs.is_override = 0
    AND cs.skill_key NOT LIKE '%\_save' ESCAPE '\'
)
WHERE pid IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM character_choices ch
    WHERE ch.character_sheet_id = sheet AND ch.progression_id = pid AND ch.selected_value = skill
  );

-- Ce qu'un choix accorde désormais.
DELETE FROM character_skills
WHERE is_override = 0 AND source <> 'manual'
  AND EXISTS (
    SELECT 1 FROM character_choices ch
    JOIN progression p ON p.id = ch.progression_id
    WHERE ch.character_sheet_id = character_skills.character_sheet_id
      AND ch.selected_value = character_skills.skill_key
      AND (p.kind = 'expertise' OR (p.kind = 'skill' AND character_skills.proficiency_level = 'proficient'))
  );

-- Jets de sauvegarde que la classe principale accorde.
DELETE FROM character_skills
WHERE skill_key LIKE '%\_save' ESCAPE '\' AND proficiency_level = 'proficient' AND is_override = 0 AND source <> 'manual'
  AND EXISTS (
    SELECT 1 FROM character_classes cc
    JOIN features f ON f.class_id = cc.class_id AND f.feature_type = 'proficiency_grant'
    JOIN feature_effects fe ON fe.feature_id = f.id
    JOIN effects e ON e.id = fe.effect_id
    WHERE cc.character_sheet_id = character_skills.character_sheet_id AND cc.is_main = 1
      AND e.type = 'saving_throw_proficiency'
      AND json_extract(e.value, '$.ability') = substr(character_skills.skill_key, 1, 3)
  );

-- Compétences qu'accorde le porteur d'un historique seedé.
DELETE FROM character_skills
WHERE source = 'background' AND proficiency_level = 'proficient' AND is_override = 0
  AND EXISTS (
    SELECT 1 FROM character_sheets s
    JOIN background_features bf ON bf.background_id = s.background_id
    JOIN features f ON f.id = bf.feature_id AND f.feature_type = 'proficiency_grant'
    JOIN feature_effects fe ON fe.feature_id = f.id
    JOIN effects e ON e.id = fe.effect_id
    WHERE s.id = character_skills.character_sheet_id
      AND e.type = 'skill_proficiency'
      AND json_extract(e.value, '$.skill') = character_skills.skill_key
  );

-- Compétences d'un historique personnalisé : rangées dans ses colonnes, d'où la fiche les dérive.
UPDATE backgrounds
SET skill_proficiencies = (
  SELECT json_group_array(value) FROM (
    SELECT j.value AS value FROM json_each(backgrounds.skill_proficiencies) j
    UNION
    SELECT cs.skill_key FROM character_skills cs
    JOIN character_sheets s ON s.id = cs.character_sheet_id
    WHERE s.background_id = backgrounds.id
      AND cs.source = 'background' AND cs.proficiency_level = 'proficient' AND cs.is_override = 0
  )
)
WHERE character_sheet_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM character_skills cs
    JOIN character_sheets s ON s.id = cs.character_sheet_id
    WHERE s.background_id = backgrounds.id
      AND cs.source = 'background' AND cs.proficiency_level = 'proficient' AND cs.is_override = 0
  );
DELETE FROM character_skills
WHERE source = 'background' AND proficiency_level = 'proficient' AND is_override = 0
  AND EXISTS (
    SELECT 1 FROM character_sheets s
    JOIN backgrounds b ON b.id = s.background_id AND b.character_sheet_id IS NOT NULL
    WHERE s.id = character_skills.character_sheet_id
      AND EXISTS (SELECT 1 FROM json_each(b.skill_proficiencies) j WHERE j.value = character_skills.skill_key)
  );

-- Le reste (ajouts manuels, ce qu'aucune règle n'accorde) devient un ajout manuel, au plus haut niveau posé.
INSERT OR IGNORE INTO character_proficiency_overrides (character_sheet_id, proficiency_type, value, action)
SELECT
  character_sheet_id,
  CASE WHEN skill_key LIKE '%\_save' ESCAPE '\' THEN 'saving_throw' ELSE 'skill' END,
  CASE WHEN skill_key LIKE '%\_save' ESCAPE '\' THEN substr(skill_key, 1, 3) ELSE skill_key END,
  CASE WHEN MAX(proficiency_level = 'expert') = 1 THEN 'expertise' ELSE 'grant' END
FROM character_skills
WHERE skill_key IN (
  'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation',
  'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand',
  'stealth', 'survival',
  'str_save', 'dex_save', 'con_save', 'int_save', 'wis_save', 'cha_save'
)
GROUP BY character_sheet_id, skill_key;

DROP TABLE character_skills;
DROP TABLE skills;

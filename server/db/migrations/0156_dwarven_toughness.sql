-- Ténacité naine (#235, E13) : le Nain des collines gagne +1 PV maximum par niveau. Le trait existait sans effet, dans
-- l'ancienne espèce « Nain des collines » comme dans la lignée du Nain. Pendant du seed : dwarf.ts et character_species.ts.
--
-- Les fiches existantes gardent leur maximum affiché : leur `hp_base` (part « dés », D19) perd le niveau total que l'effet
-- ajoute désormais à la lecture, comme 0117 l'a fait pour la CON. Chaque compensation ne joue que tant que le trait n'a pas
-- encore son effet : rejouée, elle ne retranche rien de plus.
--
-- AUTO-SUFFISANTE (pas de re-seed prod), limitée à l'édition 2014 et tolérante base vierge : rien n'est posé si le trait
-- n'existe pas encore, le seed s'en charge alors. Jamais BEGIN (D1).

UPDATE character_sheets
SET hp_base = MAX(0, hp_base - COALESCE((SELECT SUM(cc.level) FROM character_classes cc WHERE cc.character_sheet_id = character_sheets.id), 0))
WHERE species_id IN (SELECT id FROM character_species WHERE name = 'Nain des collines' AND ruleset = '5')
  AND EXISTS (
    SELECT 1 FROM features f
    JOIN species_features sf ON sf.feature_id = f.id
    WHERE f.name = 'Ténacité naine' AND sf.species_id = character_sheets.species_id
      AND NOT EXISTS (SELECT 1 FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = f.id AND e.type = 'hp_per_level')
  );

UPDATE character_sheets
SET hp_base = MAX(0, hp_base - COALESCE((SELECT SUM(cc.level) FROM character_classes cc WHERE cc.character_sheet_id = character_sheets.id), 0))
WHERE id IN (
  SELECT ch.character_sheet_id FROM character_choices ch
  JOIN species_lineages sl ON sl.id = ch.selected_lineage_id
  JOIN character_species cs ON cs.id = sl.species_id
  WHERE sl.name = 'Nain des collines' AND cs.name = 'Nain' AND cs.ruleset = '5'
    AND EXISTS (
      SELECT 1 FROM features f
      WHERE f.name = 'Ténacité naine' AND f.lineage_id = sl.id
        AND NOT EXISTS (SELECT 1 FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = f.id AND e.type = 'hp_per_level')
    )
);

INSERT INTO effects (type, value) SELECT 'hp_per_level', '{"amount":1}' WHERE EXISTS (SELECT 1 FROM features WHERE name = 'Ténacité naine') AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'hp_per_level' AND value = '{"amount":1}');

INSERT OR IGNORE INTO feature_effects (feature_id, effect_id)
SELECT f.id, e.id
FROM features f
JOIN effects e ON e.type = 'hp_per_level' AND e.value = '{"amount":1}'
WHERE f.name = 'Ténacité naine'
  AND (
    f.id IN (
      SELECT sf.feature_id FROM species_features sf
      JOIN character_species cs ON cs.id = sf.species_id
      WHERE cs.name = 'Nain des collines' AND cs.ruleset = '5')
    OR f.lineage_id IN (
      SELECT sl.id FROM species_lineages sl
      JOIN character_species cs ON cs.id = sl.species_id
      WHERE sl.name = 'Nain des collines' AND cs.name = 'Nain' AND cs.ruleset = '5')
  );

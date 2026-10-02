-- Emplacements de sorts des Chevaliers occultes et Escrocs arcaniques déjà sur une fiche : leur classe n'incantait pas
-- avant l'ajout du lanceur du tiers, donc la fiche n'en a aucun (AideDD, table d'incantation de la sous-classe).
-- Rattrapage prudent : seulement pour une fiche sans AUCUN emplacement de sorts et dont c'est la seule classe
-- lanceuse (en multiclasse lanceur, le niveau de lanceur combiné se recalcule au prochain level-up) ; jamais de
-- remplacement d'emplacements existants. Pendant du serveur : `slotsForLevel('third', …)` (shared/rules/spellSlots.ts),
-- gardé par test/nuxt/thirdCasterSlotsMigration.test.ts. Limitée à l'édition 2014. Jamais BEGIN (D1).

INSERT INTO character_spell_slots (character_sheet_id, slot_level, slot_type, total, used)
WITH third_slots (class_level, slot_level, total) AS (
  VALUES
    (3, 1, 2),
    (4, 1, 3),
    (5, 1, 3),
    (6, 1, 3),
    (7, 1, 4),
    (7, 2, 2),
    (8, 1, 4),
    (8, 2, 2),
    (9, 1, 4),
    (9, 2, 2),
    (10, 1, 4),
    (10, 2, 3),
    (11, 1, 4),
    (11, 2, 3),
    (12, 1, 4),
    (12, 2, 3),
    (13, 1, 4),
    (13, 2, 3),
    (13, 3, 2),
    (14, 1, 4),
    (14, 2, 3),
    (14, 3, 2),
    (15, 1, 4),
    (15, 2, 3),
    (15, 3, 2),
    (16, 1, 4),
    (16, 2, 3),
    (16, 3, 3),
    (17, 1, 4),
    (17, 2, 3),
    (17, 3, 3),
    (18, 1, 4),
    (18, 2, 3),
    (18, 3, 3),
    (19, 1, 4),
    (19, 2, 3),
    (19, 3, 3),
    (19, 4, 1),
    (20, 1, 4),
    (20, 2, 3),
    (20, 3, 3),
    (20, 4, 1)
)
SELECT cc.character_sheet_id, t.slot_level, 'spellcasting', t.total, 0
FROM character_classes cc
JOIN classes c ON c.id = cc.class_id AND c.ruleset = '5'
JOIN subclasses s ON s.id = cc.subclass_id
JOIN third_slots t ON t.class_level = cc.level
WHERE ((c.name = 'Guerrier' AND s.name = 'Chevalier occulte') OR (c.name = 'Roublard' AND s.name = 'Escroc arcanique'))
  AND NOT EXISTS (
    SELECT 1 FROM character_spell_slots x
    WHERE x.character_sheet_id = cc.character_sheet_id AND x.slot_type = 'spellcasting'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM character_classes other
    JOIN classes oc ON oc.id = other.class_id
    LEFT JOIN subclasses os ON os.id = other.subclass_id
    WHERE other.character_sheet_id = cc.character_sheet_id
      AND other.class_id <> cc.class_id
      AND COALESCE(os.spellcasting_ability, oc.spellcasting_ability) IS NOT NULL
  );

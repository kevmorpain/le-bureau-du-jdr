-- Occultiste — « Faveur de pacte » devient un porteur de choix invisible (`choice_carrier`), comme le style de combat (0098) :
-- son texte énumérait les trois pactes sans dire lequel était pris. Le pacte choisi est désormais sa propre ligne sur la fiche.
-- Le seed pose le porteur ; cette migration le requalifie sur les bases déployées, retire la ligne du porteur des fiches existantes
-- (sans état : jamais d'usages ni de compteur) et leur ajoute leur pacte, lu dans `character_classes.pact_boon`.
UPDATE features SET feature_type = 'choice_carrier' WHERE name = 'Faveur de pacte' AND feature_type = 'class_feature';
DELETE FROM character_features WHERE feature_id IN (SELECT id FROM features WHERE name = 'Faveur de pacte' AND feature_type = 'choice_carrier');
INSERT OR IGNORE INTO character_features (character_sheet_id, feature_id, current_uses)
SELECT cc.character_sheet_id, f.id, 0
FROM character_classes cc
JOIN features f ON f.class_id = cc.class_id AND f.tag = 'pact_boon'
WHERE cc.pact_boon IS NOT NULL
  AND f.name = CASE cc.pact_boon WHEN 'chain' THEN 'Pacte de la Chaîne' WHEN 'blade' THEN 'Pacte de la Lame' WHEN 'tome' THEN 'Pacte du Tome' END;

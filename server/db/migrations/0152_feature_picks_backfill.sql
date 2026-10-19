-- Style de combat de la classe, pacte, manifestations et Métamagie passent par le chemin générique des options de feature
-- (`featurePicks`) : chaque option prise s'enregistre aussi comme décision (`character_choices.selected_feature_id`), sans quoi
-- une manifestation déjà prise ne pourrait plus être remplacée (`replacedPickError`). Cette migration inscrit, sur le point de
-- choix de sa classe, chaque option que les fiches existantes portent déjà.
-- `NOT EXISTS` plutôt que `OR IGNORE` : l'index unique de `character_choices` ne dédoublonne pas une ligne dont des colonnes
-- `selected_*` sont NULL. Une option déjà inscrite sur un point de choix (le 2ᵉ style du Champion, les manœuvres) n'est pas
-- reprise sur celui de la classe. Idempotente et tolérante base vierge.

INSERT INTO character_choices (character_sheet_id, progression_id, selected_feature_id)
SELECT cf.character_sheet_id, p.id, cf.feature_id
FROM character_features cf
JOIN features f ON f.id = cf.feature_id
JOIN progression p ON p.kind = CASE f.tag
    WHEN 'fighting_style' THEN 'fighting_style'
    WHEN 'pact_boon' THEN 'pact_boon'
    WHEN 'invocation' THEN 'invocations'
    WHEN 'metamagic' THEN 'metamagic'
  END
JOIN features owner ON owner.id = p.feature_id AND owner.class_id = f.class_id AND owner.ruleset = f.ruleset
WHERE f.tag IN ('fighting_style', 'pact_boon', 'invocation', 'metamagic')
  AND NOT EXISTS (
    SELECT 1 FROM character_choices cc
    WHERE cc.character_sheet_id = cf.character_sheet_id AND cc.selected_feature_id = cf.feature_id
  );

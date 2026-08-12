-- Volet B étape 3 — STRIP des maîtrises de BASE matérialisées en grants sur les fiches vivantes.
-- Depuis les étapes 4 (classe) et 2 (historique), la fiche DÉRIVE ses maîtrises de base des
-- porteurs `proficiency_grant` (armes/armures de classe, outils fixes d'historique). Les grants
-- que `createCharacter` copiait jusqu'ici font double emploi → on les retire pour ne garder que
-- les VRAIS deltas du joueur (outils/langues choisis, maîtrises réellement ajoutées à la main).
--
-- Critère (auto-cohérent : on strippe exactement ce que la fiche redérive) :
--   (1) armes/armures dont la valeur == un effet du porteur de CLASSE du perso (catégories +
--       armures + armes précises FR). `json_extract(value,'$')` déballe la string JSON de l'effet.
--   (2) tokens EN LEGACY d'armes précises (`longsword`, `rapier`… + `Masse`) : artefacts du mapping
--       builder d'AVANT la normalisation FR (étape 1). Ils ne matchent AUCUN item (maîtrise MORTE,
--       jamais fonctionnelle) ni le porteur FR, et le sélecteur manuel n'émet QUE du FR → jamais un
--       vrai delta manuel. C'est le pendant qui résout le DOUBLON (grant EN + dérivé FR) sur les 6
--       classes à armes précises (Barde/Roublard/Moine/Druide/Ensorceleur/Magicien).
--   (3) outils/langues fixes dont la valeur == un effet du porteur d'HISTORIQUE (langues fixes
--       inexistantes en 2014 → clause de langue = no-op, laissée par symétrie).
-- PRÉSERVÉ : outils/langues CHOISIS + maîtrises FR ajoutées à la main (sur aucun porteur, hors set
-- legacy). Les compétences (`character_skills`) sont HORS périmètre (aucune dérivation d'origine).
--
-- Auto-protecteur : porteur absent (pré-seed) → EXISTS vide → clauses (1)/(3) no-op, aucune perte.
-- ⚠️ Séquence : les porteurs (classes + historiques) doivent être seedés en prod AVANT ce déploiement
-- (fait le 2026-08-12/11). Jamais db.transaction()/BEGIN (D14) — un seul DELETE.

DELETE FROM `character_proficiency_overrides`
WHERE `action` = 'grant'
  AND (
    (
      `proficiency_type` IN ('weapon', 'armor')
      AND EXISTS (
        SELECT 1
        FROM `character_classes` cc
        JOIN `features` f ON f.`class_id` = cc.`class_id` AND f.`feature_type` = 'proficiency_grant'
        JOIN `feature_effects` fe ON fe.`feature_id` = f.`id`
        JOIN `effects` e ON e.`id` = fe.`effect_id`
        WHERE cc.`character_sheet_id` = `character_proficiency_overrides`.`character_sheet_id`
          AND (
            (`character_proficiency_overrides`.`proficiency_type` = 'weapon' AND e.`type` = 'weapon_proficiency')
            OR (`character_proficiency_overrides`.`proficiency_type` = 'armor' AND e.`type` = 'proficiency')
          )
          AND json_extract(e.`value`, '$') = `character_proficiency_overrides`.`value`
      )
    )
    OR (
      `proficiency_type` = 'weapon'
      AND `value` IN ('hand_crossbow', 'light_crossbow', 'longsword', 'rapier', 'shortsword', 'longbow', 'shortbow', 'Masse')
    )
    OR (
      `proficiency_type` IN ('tool', 'language')
      AND EXISTS (
        SELECT 1
        FROM `character_sheets` cs
        JOIN `background_features` bf ON bf.`background_id` = cs.`background_id`
        JOIN `features` f2 ON f2.`id` = bf.`feature_id` AND f2.`feature_type` = 'proficiency_grant'
        JOIN `feature_effects` fe2 ON fe2.`feature_id` = f2.`id`
        JOIN `effects` e2 ON e2.`id` = fe2.`effect_id`
        WHERE cs.`id` = `character_proficiency_overrides`.`character_sheet_id`
          AND (
            (`character_proficiency_overrides`.`proficiency_type` = 'tool' AND e2.`type` = 'tool_proficiency')
            OR (`character_proficiency_overrides`.`proficiency_type` = 'language' AND e2.`type` = 'language_proficiency')
          )
          AND json_extract(e2.`value`, '$') = `character_proficiency_overrides`.`value`
      )
    )
  );

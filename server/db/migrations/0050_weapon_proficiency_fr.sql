-- Convertit les valeurs de `weapon_proficiency` des clés anglaises vers les noms
-- français officiels utilisés par le picker UI (ProficienciesSection.vue).
--
-- Constat : le seed `character_species.ts` stockait 'light_hammer', 'longsword',
-- etc. dans `effects.value` (JSON text). Sur la fiche, ces clés s'affichaient
-- en brut (« light_hammer ») parce que la map de traduction du composant ne
-- couvrait que les catégories (simple_weapons, etc.).
--
-- Étape 1 — Fusionner le doublon 'light hammer' (avec espace, typo) vers 'light_hammer'.
-- Étape 2 — Renommer les clés EN vers les noms FR canoniques.

-- Étape 1 : merge des feature_effects pointant vers le doublon
INSERT OR IGNORE INTO `feature_effects` (feature_id, effect_id)
SELECT fe.feature_id, e_canon.id
FROM `feature_effects` fe
JOIN `effects` e_dup
  ON e_dup.id = fe.effect_id
 AND e_dup.type = 'weapon_proficiency'
 AND e_dup.value = '"light hammer"'
JOIN `effects` e_canon
  ON e_canon.type = 'weapon_proficiency'
 AND e_canon.value = '"light_hammer"';

DELETE FROM `feature_effects`
WHERE effect_id IN (
  SELECT id FROM `effects` WHERE type='weapon_proficiency' AND value='"light hammer"'
);

DELETE FROM `effects`
WHERE type='weapon_proficiency' AND value='"light hammer"';

-- Étape 2 : renames EN → FR (noms officiels PHB FR 2014, identiques au picker UI)
UPDATE `effects` SET value='"Marteau léger"'      WHERE type='weapon_proficiency' AND value='"light_hammer"';
UPDATE `effects` SET value='"Épée longue"'        WHERE type='weapon_proficiency' AND value='"longsword"';
UPDATE `effects` SET value='"Épée courte"'        WHERE type='weapon_proficiency' AND value='"shortsword"';
UPDATE `effects` SET value='"Arc court"'          WHERE type='weapon_proficiency' AND value='"shortbow"';
UPDATE `effects` SET value='"Arc long"'           WHERE type='weapon_proficiency' AND value='"longbow"';
UPDATE `effects` SET value='"Hache d''armes"'     WHERE type='weapon_proficiency' AND value='"battleaxe"';
UPDATE `effects` SET value='"Hachette"'           WHERE type='weapon_proficiency' AND value='"handaxe"';
UPDATE `effects` SET value='"Marteau de guerre"'  WHERE type='weapon_proficiency' AND value='"warhammer"';

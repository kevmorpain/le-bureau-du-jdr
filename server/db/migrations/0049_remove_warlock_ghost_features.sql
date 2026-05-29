-- Supprime les features fantômes Grand Ancien restantes d'anciennes versions du seed.
-- Constat : id=71 "Contact du Grand Ancien" et id=72 "Bouclier psychique" cohabitaient
-- avec les nouvelles "Esprit éveillé" et "Protection entropique" (mêmes niveaux),
-- donc le level-up niv 1/6 attachait DEUX features au lieu d'une.

DELETE FROM `character_features`
WHERE `feature_id` IN (
  SELECT `id` FROM `features`
  WHERE `name` IN ('Contact du Grand Ancien', 'Bouclier psychique')
);

DELETE FROM `feature_effects`
WHERE `feature_id` IN (
  SELECT `id` FROM `features`
  WHERE `name` IN ('Contact du Grand Ancien', 'Bouclier psychique')
);

DELETE FROM `features`
WHERE `name` IN ('Contact du Grand Ancien', 'Bouclier psychique');

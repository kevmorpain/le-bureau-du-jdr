-- Supprime la feature fantôme « Mysticisme sombre » (id=69 en local, mais on cible par nom)
-- Cette feature n'existe pas dans D&D 5e PHB 2014 et était un résidu d'un ancien seed
-- (cf. description : « lancer un sort d'occultiste en secret »).
-- Elle continuait d'être liée aux personnages au level-up niv 2 d'Occultiste.

-- 1. Nettoyer les liens character_features pour cette feature (sur tous les persos)
DELETE FROM `character_features`
WHERE `feature_id` IN (
  SELECT `id` FROM `features` WHERE `name` = 'Mysticisme sombre'
);

-- 2. Nettoyer les éventuels feature_effects (par sécurité, même si elle n'en a pas)
DELETE FROM `feature_effects`
WHERE `feature_id` IN (
  SELECT `id` FROM `features` WHERE `name` = 'Mysticisme sombre'
);

-- 3. Supprimer la feature elle-même
DELETE FROM `features` WHERE `name` = 'Mysticisme sombre';

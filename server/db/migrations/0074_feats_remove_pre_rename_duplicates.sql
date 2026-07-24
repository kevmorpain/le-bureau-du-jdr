-- Répare les doublons de dons créés en prod par un reseed lancé AVANT que le
-- nouveau code worker (seed 42 dons) ne soit live. Le déploiement Cloudflare
-- applique les migrations D1 avant de promouvoir le nouveau worker : la
-- migration 0073 avait déjà renommé les originaux en « Vigilant » / « Maître
-- des armes à deux mains », mais l'ancien seed (13 dons, anciens noms) tournait
-- encore et a réinséré « Alerte » et « Maître d'armes de guerre » en double.
--
-- Ces 2 lignes en double portent des id neufs et ne sont référencées par aucune
-- fiche. On supprime d'abord leurs enfants (FK-safe même sans PRAGMA
-- foreign_keys), puis les lignes. Idempotent : no-op là où ces noms n'existent
-- plus (ex. base locale, déjà propre).

DELETE FROM feature_effects
WHERE feature_id IN (
  SELECT id FROM features
  WHERE feature_type = 'feat' AND name IN ('Alerte', 'Maître d''armes de guerre')
);

DELETE FROM character_features
WHERE feature_id IN (
  SELECT id FROM features
  WHERE feature_type = 'feat' AND name IN ('Alerte', 'Maître d''armes de guerre')
);

DELETE FROM features
WHERE feature_type = 'feat' AND name IN ('Alerte', 'Maître d''armes de guerre');

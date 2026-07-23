-- Aligne les noms de dons (feature_type='feat') sur AideDD / PHB 2014.
-- Renommages seulement — les ajouts (29 dons PHB manquants) et la mise à jour
-- des descriptions/prérequis sont gérés par le reseed (`?only=feats`), qui matche
-- par nom. Les renommages passent par migration pour éviter les doublons au reseed.

-- « Alerte » → « Vigilant » (Alert)
UPDATE features SET name = 'Vigilant'
WHERE name = 'Alerte' AND feature_type = 'feat';

-- « Maître d'armes de guerre » → « Maître des armes à deux mains » (Great Weapon Master).
-- NB : « Maître d'armes » (Weapon Master) est un don PHB distinct — le nom initial
-- était donc erroné.
UPDATE features SET name = 'Maître des armes à deux mains'
WHERE name = 'Maître d''armes de guerre' AND feature_type = 'feat';

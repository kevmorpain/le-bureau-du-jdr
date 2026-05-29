-- Renames de sorts vers les noms officiels PHB FR 2014 (aidedd.org)
-- (Tentacules de Hadar et Voracité de Hadar laissés tels quels — validés correct par l'utilisateur)

UPDATE `spells` SET `name` = 'Contact avec un autre plan' WHERE `name` = 'Contact avec le plan astral';
UPDATE `spells` SET `name` = 'Forme éthérée'              WHERE `name` = 'Phase éthérée';

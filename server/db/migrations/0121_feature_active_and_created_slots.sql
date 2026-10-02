-- État « actif » d'une capacité (Rage : résistances et bonus de dégâts tant qu'elle dure) et emplacements créés
-- par les points de sorcellerie (AideDD, Ensorceleur : « tout emplacement créé de cette manière disparaît
-- lorsque vous terminez un repos long »). Les deux valent 0 sur les fiches existantes : aucune rage en cours,
-- aucun emplacement créé.
-- Jamais BEGIN (D1).

ALTER TABLE `character_features` ADD COLUMN `active` integer DEFAULT 0 NOT NULL;

ALTER TABLE `character_spell_slots` ADD COLUMN `created` integer DEFAULT 0 NOT NULL;

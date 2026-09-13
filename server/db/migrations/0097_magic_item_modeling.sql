-- Modélisation des OBJETS MAGIQUES (option B « propre ») : rareté + harmonisation. Permet de
-- représenter un objet comme le Fragment de Féérie (objet magique, harmonisation par un
-- ensorceleur) plutôt qu'en prose libre. Pas de nouveau `item_type` « wondrous » : le signal
-- « objet magique » = `rarity` non NULL (cf. shared/rules/itemRarity.ts) ; ça évite de rippler
-- l'union item_type (weapon/armor/equipment/tool) dans tout le front.
--
-- Migration AUTO-SUFFISANTE : `rarity`/`attunement_note` nullables (NULL = objet ordinaire,
-- backfill des lignes existantes) ; les booléens ont un DEFAULT false → aucun re-seed prod.
-- `attuned` est l'état PAR INSTANCE (character_inventory), comme equipped/current_uses.
--
-- Les ALTER ne passent qu'une fois (rôle de `_hub_migrations`) ; jamais de BEGIN (D1 le rejette).

ALTER TABLE `items` ADD COLUMN `rarity` text;

ALTER TABLE `items` ADD COLUMN `requires_attunement` integer DEFAULT false NOT NULL;

ALTER TABLE `items` ADD COLUMN `attunement_note` text;

ALTER TABLE `character_inventory` ADD COLUMN `attuned` integer DEFAULT false NOT NULL;

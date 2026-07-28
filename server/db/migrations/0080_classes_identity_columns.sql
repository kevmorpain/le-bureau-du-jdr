-- Faits d'identité de classe : niveau de sous-classe + type d'incantation.
-- Cf. docs/rules-engine.md §3 (« grant -> effect ; identité -> colonne ; décision ->
-- choix ») et docs/decisions.md D3. `classes` ne portait que hit_dice +
-- spellcasting_ability ; ces deux faits vivaient dans le front
-- (app/data/character-builder.ts) et, pour le type d'incantation, dans DEUX tables
-- `CASTER_TYPE` recopiées côté serveur (cf. architecture-audit.md §7).
--
-- Migration AUTO-SUFFISANTE (cf. decisions.md D9/D13) : elle pose les colonnes ET
-- les remplit, donc aucun re-seed n'est nécessaire en production. Les valeurs sont
-- celles du front, qui font foi aujourd'hui (PHB 2014).
--
-- Défauts choisis pour que la migration soit sûre sur une base dont on ne connaît
-- pas le contenu : subclass_level = 3 (cas majoritaire en 2014, et règle unique en
-- 5.5) et spellcasting_type = 'none' (une classe inconnue ne se voit pas accorder
-- d'emplacements de sorts par erreur). Les UPDATE ci-dessous ne font qu'écarter de
-- ces défauts les classes concernées.
--
-- Idempotent au niveau des données (les UPDATE sont des affectations constantes) ;
-- les ALTER, eux, ne passent qu'une fois — c'est le rôle de `_hub_migrations`.

ALTER TABLE `classes` ADD `subclass_level` integer DEFAULT 3 NOT NULL;

ALTER TABLE `classes` ADD `spellcasting_type` text DEFAULT 'none' NOT NULL;

-- Niveau d'accès à la sous-classe (PHB 2014). Restent à 3 : Barbare (Voie primitive),
-- Barde (Collège bardique), Guerrier (Archétype martial), Moine (Tradition
-- monacale), Paladin (Serment sacré), Rôdeur (Archétype de rôdeur), Roublard
-- (Archétype de roublard).
UPDATE `classes` SET `subclass_level` = 1 WHERE `name` IN ('Clerc', 'Ensorceleur', 'Occultiste');

UPDATE `classes` SET `subclass_level` = 2 WHERE `name` IN ('Druide', 'Magicien');

-- Progression d'incantation. Restent à 'none' : Barbare, Guerrier, Moine, Roublard
-- (leurs sous-classes lanceuses — Chevalier occulte, Filou ésotérique — relèvent de
-- la sous-classe, pas de la classe).
UPDATE `classes` SET `spellcasting_type` = 'full' WHERE `name` IN ('Barde', 'Clerc', 'Druide', 'Ensorceleur', 'Magicien');

UPDATE `classes` SET `spellcasting_type` = 'half' WHERE `name` IN ('Paladin', 'Rôdeur');

UPDATE `classes` SET `spellcasting_type` = 'pact' WHERE `name` = 'Occultiste';

-- Cœur du modèle de choix (lot 4c) : `progression` (référence : quoi/quand/parmi quoi)
-- + `character_choices` (config : un pick atomique par ligne). Cf. docs/rules-engine.md
-- §4 et docs/decisions.md D4/D5/D8/D13/D14.
--
-- Migration AUTO-SUFFISANTE (D9/D13) : elle crée les tables ET seede le catalogue de
-- progressions de l'Occultiste, donc AUCUN re-seed prod nécessaire. `character_choices`
-- reste vide (config par personnage). Le seed des bases neuves produit exactement les
-- mêmes lignes via seedClass (_syncProgression) ; le contrat est vérifié dans
-- test/unit/warlockProgression.test.ts.
--
-- Tolérance base vierge (cf. project_migrations_base_vierge) : les INSERT ... SELECT
-- lisent `classes`/`features`, VIDES au moment des migrations sur base neuve → 0 ligne
-- insérée, et c'est le seed qui crée tout. Sur une base déployée peuplée, ils créent
-- 3 options de pacte + 6 progressions.

CREATE TABLE `progression` (
	`id` integer PRIMARY KEY NOT NULL,
	`feature_id` integer NOT NULL,
	`kind` text NOT NULL,
	`count` text NOT NULL,
	`option_source` text NOT NULL,
	`replaceable` integer DEFAULT false NOT NULL,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `progression_feature_id_idx` ON `progression` (`feature_id`);

CREATE TABLE `character_choices` (
	`id` integer PRIMARY KEY NOT NULL,
	`character_sheet_id` integer NOT NULL,
	`progression_id` integer NOT NULL,
	`class_level` integer,
	`selected_subclass_id` integer,
	`selected_feature_id` integer,
	`selected_spell_id` integer,
	`selected_ability_id` text,
	`selected_value` text,
	`payload` text,
	`created_at` text,
	`updated_at` text,
	FOREIGN KEY (`character_sheet_id`) REFERENCES `character_sheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`progression_id`) REFERENCES `progression`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_subclass_id`) REFERENCES `subclasses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_spell_id`) REFERENCES `spells`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`selected_ability_id`) REFERENCES `ability_scores`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `character_choices_sheet_id_idx` ON `character_choices` (`character_sheet_id`);

CREATE INDEX `character_choices_progression_id_idx` ON `character_choices` (`progression_id`);

CREATE UNIQUE INDEX `character_choices_unique` ON `character_choices` (`character_sheet_id`,`progression_id`,`selected_subclass_id`,`selected_feature_id`,`selected_spell_id`,`selected_ability_id`,`selected_value`);

-- ── Catalogue Occultiste — 3 features-OPTIONS de pacte (taguées pact_boon) ─────────
-- feature_type='class_feature' + tag='pact_boon' : le tag les marque comme OPTIONS,
-- donc exclues de la matérialisation passive (cf. server/utils/features.ts). Textes
-- identiques au seed (data/warlock_progression.ts) pour une convergence au mot près.
INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`, `tag`)
SELECT 'Pacte de la Chaîne', 'Vous apprenez le sort Appel de familier et pouvez le lancer en tant que rituel ; votre familier peut prendre une forme spéciale (diablotin, pseudodragon, quasit ou lutin) et attaquer avec sa réaction.', 'class_feature', `id`, 3, 'pact_boon'
FROM `classes` WHERE `name` = 'Occultiste';

INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`, `tag`)
SELECT 'Pacte de la Lame', 'Vous pouvez créer une arme de pacte magique dans votre main ; vous en avez la maîtrise, elle compte comme magique, et vous pouvez la faire apparaître ou disparaître à volonté.', 'class_feature', `id`, 3, 'pact_boon'
FROM `classes` WHERE `name` = 'Occultiste';

INSERT INTO `features` (`name`, `description`, `feature_type`, `class_id`, `level_required`, `tag`)
SELECT 'Pacte du Tome', 'Votre patron vous offre le Livre des Ombres : choisissez trois sorts mineurs dans la liste de n''importe quelle classe, que vous pouvez lancer à volonté tant que vous détenez le livre.', 'class_feature', `id`, 3, 'pact_boon'
FROM `classes` WHERE `name` = 'Occultiste';

-- ── Catalogue Occultiste — 6 points de choix (progression) ─────────────────────────
-- Chaque progression est rattachée à sa feature PROPRIÉTAIRE par (nom + niveau requis).
-- pact_boon → parmi le groupe pact_boon (fixed 1) ; invocations → parmi le groupe
-- invocation (table par niveau, échangeables) ; les 4 arcanums → 1 sort d'occultiste
-- du niveau indiqué.
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'pact_boon', '{"op":"fixed","value":1}', '{"type":"feature_group","group":"pact_boon"}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Faveur de pacte' AND f.`level_required` = 3;

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'invocations', '{"op":"lookup","table":[0,2,2,2,3,3,4,4,5,5,5,6,6,6,7,7,7,8,8,8]}', '{"type":"feature_group","group":"invocation"}', 1
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Manifestations occultes' AND f.`level_required` = 2;

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'spell', '{"op":"fixed","value":1}', '{"type":"spells","spellClass":"warlock","maxLevel":6}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Arcanum mystique (niveau 6)' AND f.`level_required` = 11;

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'spell', '{"op":"fixed","value":1}', '{"type":"spells","spellClass":"warlock","maxLevel":7}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Arcanum mystique (niveau 7)' AND f.`level_required` = 13;

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'spell', '{"op":"fixed","value":1}', '{"type":"spells","spellClass":"warlock","maxLevel":8}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Arcanum mystique (niveau 8)' AND f.`level_required` = 15;

INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'spell', '{"op":"fixed","value":1}', '{"type":"spells","spellClass":"warlock","maxLevel":9}', 0
FROM `features` f JOIN `classes` c ON f.`class_id` = c.`id`
WHERE c.`name` = 'Occultiste' AND f.`name` = 'Arcanum mystique (niveau 9)' AND f.`level_required` = 17;

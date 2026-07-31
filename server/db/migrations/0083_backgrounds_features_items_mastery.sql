-- Lot 4d (dernier lot schéma du point 4) : maîtrise d'armes 2024 sur `items` +
-- alignement des historiques sur le pattern espèce/classe. Cf. docs/rules-engine.md §6,
-- docs/dnd-5.5.md §2, docs/decisions.md D3/D9/D13.
--
-- Migration AUTO-SUFFISANTE et DDL PURE (D9/D13) : elle ne pose que du schéma, AUCUNE
-- donnée. Deux raisons de ne rien seeder ici (contrairement à l'Occultiste du lot 4c) :
--   1. la maîtrise d'armes et la triade de caractéristiques d'historique sont des
--      mécaniques PUREMENT 5.5, dont le contenu est sourcé en Phase 2 ;
--   2. sans le discriminant `ruleset` (posé en Phase 2, cf. D2), on ne peut pas
--      distinguer un historique 2024 de son homonyme 2014 (Soldat, Sage, Acolyte…).
-- Donc aucun re-seed prod nécessaire, et rien à faire converger côté seed pour l'instant.

-- ── Volet 1 : maîtrise d'armes (items.mastery_property) ─────────────────────────────
-- Nullable, pas de backfill : les armes 2014 n'ont pas de maîtrise. Ensemble fermé
-- canonique des 8 valeurs : shared/rules/masteryProperties.ts.
ALTER TABLE `items` ADD COLUMN `mastery_property` text;

-- ── Volet 2 : background_features (jointure historique ⇄ feature) ───────────────────
-- Calquée au mot près sur `species_features` : permet à un historique de POSSÉDER des
-- features (grants via effects + points de choix via `progression`, dont la triade 5.5
-- `kind:'ability_scores'`). Les tables progression/character_choices (lot 4c) supportent
-- déjà la triade ; il ne manquait que la propriété historique → feature. Vide pour
-- l'instant (contenu en Phase 2).
CREATE TABLE `background_features` (
	`background_id` integer NOT NULL,
	`feature_id` integer NOT NULL,
	PRIMARY KEY(`background_id`, `feature_id`),
	FOREIGN KEY (`background_id`) REFERENCES `backgrounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`feature_id`) REFERENCES `features`(`id`) ON UPDATE no action ON DELETE cascade
);

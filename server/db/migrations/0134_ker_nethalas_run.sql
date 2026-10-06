-- SQLite exige un DEFAULT pour ajouter une colonne NOT NULL : il vaut `emptyKnRun()` (shared/ker-nethalas/run.ts).
-- Le Domaine courant quitte `status` pour devenir le premier Domaine de la liste `run.domains`.
-- `json(...)` rétablit le sous-type JSON que `json_extract` perd à travers `json_set`.
ALTER TABLE `kn_characters` ADD `run` text DEFAULT '{"domains":[{"name":"Domaine 1","rooms":0,"lairDie":10,"lairFound":false,"exitDie":8,"exitFound":false,"overseerInfluences":[],"growingDarkness":[],"visits":[]}],"current":0,"tensionDie":8,"lightRemaining":20}' NOT NULL;--> statement-breakpoint
UPDATE `kn_characters`
SET `run` = json_set(
  `run`,
  '$.domains[0].growingDarkness', json(json_extract(`status`, '$.domain.growingDarkness')),
  '$.domains[0].overseerInfluences', json(json_extract(`status`, '$.domain.overseerInfluences'))
);--> statement-breakpoint
UPDATE `kn_characters` SET `status` = json_remove(`status`, '$.domain');

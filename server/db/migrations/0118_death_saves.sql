-- Jets de sauvegarde contre la mort portés par la fiche : ils vivaient en localStorage (perdus d'un appareil à l'autre, non
-- synchronisés, absents du serveur qui ne pouvait donc pas les remettre à zéro au repos). Les valeurs locales existantes ne sont pas
-- reprises : un personnage mourant se règle en deux clics, et le navigateur de l'utilisateur est le seul à les avoir.
-- Jamais BEGIN (D1).

ALTER TABLE `character_sheets` ADD COLUMN `death_save_successes` integer DEFAULT 0 NOT NULL;

ALTER TABLE `character_sheets` ADD COLUMN `death_save_failures` integer DEFAULT 0 NOT NULL;

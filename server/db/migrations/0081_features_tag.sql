-- Companion du modèle de choix : tag (feature_group) sur `features`.
-- Cf. docs/rules-engine.md §4 (« Companion : colonne nullable features.tag
-- $type<FeatureTag>() indexable pour énumérer les features-options d'un
-- feature_group ») et §6 (ligne `features` : tag). Une `progression` de lot 4c
-- résoudra `optionSource:{type:'feature_group', group:<tag>}` par
-- `SELECT … FROM features WHERE tag = <tag>` — d'où l'index.
--
-- Migration AUTO-SUFFISANTE (cf. decisions.md D9/D13) : elle pose la colonne ET la
-- backfille, donc aucun re-seed n'est nécessaire en production.
--
-- ⚠️ Seules les INVOCATIONS existent aujourd'hui comme features-options
-- individuelles (feature_type = 'eldritch_invocation', cf. seed warlock + endpoint
-- /api/invocations). Les 4 autres groupes (metamagic, maneuver, fighting_style,
-- pact_boon) ne sont encore que des features conteneurs en prose ; leurs options —
-- et donc leur tag — n'arriveront qu'au lot 4c. Le backfill ne tague donc que les
-- invocations, par le discriminant feature_type (robuste, pas par nom).
--
-- Colonne NULLABLE (additif, zéro régression) : une feature qui n'est l'option
-- d'aucun groupe reste à NULL. Sur base vierge, l'UPDATE ne touche aucune ligne
-- (features vide au moment des migrations) — le seed tague alors les invocations.

ALTER TABLE `features` ADD `tag` text;

CREATE INDEX `features_tag_idx` ON `features` (`tag`);

UPDATE `features` SET `tag` = 'invocation' WHERE `feature_type` = 'eldritch_invocation';

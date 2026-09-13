-- F2 · style de combat — tranche 2 : l'owner « Style de combat » (Guerrier/Paladin/Rôdeur) devient
-- `choice_carrier` (invisible), comme l'archétype de sous-classe. Le style CHOISI est désormais
-- matérialisé (character_features) → l'owner générique ne doit plus l'être sur les fiches créées
-- après le déploiement.
--
-- Idempotent (garde sur le type actuel) et sûr sur base vierge (au moment de la migration la feature
-- n'existe pas encore → no-op ; le seed la crée directement en `choice_carrier`). Aucune autre
-- feature de classe n'est nommée « Style de combat » → la garde par nom + type suffit.
--
-- Les OPTIONS (features taguées `fighting_style`) et la PROGRESSION sont créées par le seed des
-- classes (seedClass injecte `fightingStyleOptionFeatures` + la progression) : geste prod =
-- POST /api/admin/seed?only=guerrier,paladin,rodeur (idempotent), à lancer après déploiement.
UPDATE features SET feature_type = 'choice_carrier'
WHERE name = 'Style de combat' AND feature_type = 'class_feature';

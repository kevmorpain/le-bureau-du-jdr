-- Outils au choix de classe (AideDD) : Barde, trois instruments de musique ; Moine, un outil d'artisan ou un
-- instrument de musique ; Barde rejoint par multiclassage, un instrument de musique (tableau des maîtrises du
-- multiclassage). Point de choix `tool` sur le porteur de maîtrises concerné : « Maîtrises de la classe »
-- (1re classe) ou « Maîtrises de multiclassage » (classe rejointe). Pendant du seed : `toolChoice` de
-- shared/rules/classProficiencies.ts. Par migration et non par reseed : sans la progression au déploiement,
-- un pick serait refusé (leçon F3).
--
-- Idempotent (NOT EXISTS). Tolérant base vierge : tout part de `classes` (vide pendant les migrations) →
-- 0 ligne. Limité à l'édition 2014. Les `option_source` reprennent la sérialisation du seed. Jamais BEGIN (D1).

WITH `choices` (`class_name`, `carrier_type`, `count`, `option_source`) AS (VALUES
  ('Barde', 'proficiency_grant', '{"op":"fixed","value":3}', '{"type":"tools","from":["Cornemuse","Cor","Flûte","Luth","Lyre","Tambour","Viole","Chalemie","Flûte de pan","Tympanon"]}'),
  ('Barde', 'multiclass_proficiency_grant', '{"op":"fixed","value":1}', '{"type":"tools","from":["Cornemuse","Cor","Flûte","Luth","Lyre","Tambour","Viole","Chalemie","Flûte de pan","Tympanon"]}'),
  ('Moine', 'proficiency_grant', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de forgeron","Outils de charpentier","Outils de cordonnier","Ustensiles de cuisinier","Outils de bijoutier","Outils de maçon","Matériel de peintre","Outils de potier","Outils de tanneur","Outils de tisserand","Outils de souffleur de verre","Matériel d''alchimiste","Matériel de brasseur","Matériel de calligraphe","Outils de cartographe","Outils de bricoleur","Outils de menuisier","Cornemuse","Cor","Flûte","Luth","Lyre","Tambour","Viole","Chalemie","Flûte de pan","Tympanon"]}')
)
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, 'tool', c.`count`, c.`option_source`, 0
FROM `choices` c
JOIN `classes` cl ON cl.`name` = c.`class_name` AND cl.`ruleset` = '5'
JOIN `features` f ON f.`class_id` = cl.`id` AND f.`feature_type` = c.`carrier_type`
WHERE NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = 'tool');

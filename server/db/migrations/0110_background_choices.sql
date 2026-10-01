-- Choix des historiques 2014 : langues et outils « au choix » (Acolyte, Sage, Criminel, Noble…). Jusqu'ici
-- proposés par le seul blob du builder et enregistrés comme ajouts manuels, ils deviennent des points de
-- choix (`progression`) sur le porteur « Maîtrises d'historique » : le pick va en `character_choices`, la
-- maîtrise est dérivée à la lecture. Pendant du seed : `backgroundChoices` (shared/rules/
-- backgroundProficiencies.ts). Par migration et non par reseed : sans la progression au déploiement, un
-- pick serait refusé (leçon F3). Marchand de guilde : outils de navigateur OU une langue (`orLanguages`).
--
-- Idempotent (NOT EXISTS). Tolérant base vierge : tout part de `backgrounds` (vide pendant les migrations)
-- → 0 ligne. Limité à l'édition 2014 et aux historiques prédéfinis. Les `option_source` reprennent la
-- sérialisation du seed. Jamais BEGIN (D1).

WITH `choices` (`background_name`, `kind`, `count`, `option_source`) AS (VALUES
  ('Acolyte', 'language', '{"op":"fixed","value":2}', '{"type":"languages"}'),
  ('Criminel', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Jeu de dés","Jeu de cartes","Jeu d''échecs draconiques","Jeu des Dragons"]}'),
  ('Artiste', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Cornemuse","Cor","Flûte","Luth","Lyre","Tambour","Viole","Chalemie","Flûte de pan","Tympanon"]}'),
  ('Héros du peuple', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de forgeron","Outils de charpentier","Outils de cordonnier","Ustensiles de cuisinier","Outils de bijoutier","Outils de maçon","Matériel de peintre","Outils de potier","Outils de tanneur","Outils de tisserand","Outils de souffleur de verre","Matériel d''alchimiste","Matériel de brasseur","Matériel de calligraphe","Outils de cartographe","Outils de bricoleur","Outils de menuisier"]}'),
  ('Artisan de guilde', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de forgeron","Outils de charpentier","Outils de cordonnier","Ustensiles de cuisinier","Outils de bijoutier","Outils de maçon","Matériel de peintre","Outils de potier","Outils de tanneur","Outils de tisserand","Outils de souffleur de verre","Matériel d''alchimiste","Matériel de brasseur","Matériel de calligraphe","Outils de cartographe","Outils de bricoleur","Outils de menuisier"]}'),
  ('Artisan de guilde', 'language', '{"op":"fixed","value":1}', '{"type":"languages"}'),
  ('Marchand de guilde', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Outils de navigateur"],"orLanguages":true}'),
  ('Marchand de guilde', 'language', '{"op":"fixed","value":1}', '{"type":"languages"}'),
  ('Ermite', 'language', '{"op":"fixed","value":1}', '{"type":"languages"}'),
  ('Noble', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Jeu de dés","Jeu de cartes","Jeu d''échecs draconiques","Jeu des Dragons"]}'),
  ('Noble', 'language', '{"op":"fixed","value":1}', '{"type":"languages"}'),
  ('Sauvageon', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Cornemuse","Cor","Flûte","Luth","Lyre","Tambour","Viole","Chalemie","Flûte de pan","Tympanon"]}'),
  ('Sauvageon', 'language', '{"op":"fixed","value":1}', '{"type":"languages"}'),
  ('Sage', 'language', '{"op":"fixed","value":2}', '{"type":"languages"}'),
  ('Soldat', 'tool', '{"op":"fixed","value":1}', '{"type":"tools","from":["Jeu de dés","Jeu de cartes","Jeu d''échecs draconiques","Jeu des Dragons"]}')
)
INSERT INTO `progression` (`feature_id`, `kind`, `count`, `option_source`, `replaceable`)
SELECT f.`id`, c.`kind`, c.`count`, c.`option_source`, 0
FROM `choices` c
JOIN `backgrounds` b ON b.`name` = c.`background_name` AND b.`ruleset` = '5' AND b.`character_sheet_id` IS NULL
JOIN `background_features` bf ON bf.`background_id` = b.`id`
JOIN `features` f ON f.`id` = bf.`feature_id` AND f.`name` = 'Maîtrises d''historique'
WHERE NOT EXISTS (SELECT 1 FROM `progression` p WHERE p.`feature_id` = f.`id` AND p.`kind` = c.`kind`);

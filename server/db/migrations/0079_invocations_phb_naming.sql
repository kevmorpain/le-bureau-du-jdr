-- 0079 — Manifestations occultes : alignement AideDD / PHB 2014.
--
-- Migration AUTO-SUFFISANTE : elle porte toutes les corrections, donc la prod
-- n'a PAS besoin d'être reseedée côté warlock (cf. volets historiques/objets).
-- Scopée par NOM (feature_type='eldritch_invocation') et non par id : les ids
-- des features divergent entre la base locale et la prod.
-- Chaque instruction est idempotente (garde sur l'ancienne valeur).
--
-- Les fiches référencent les manifestations par character_features.feature_id
-- → les renommages de `name` sont FK-safe (ids préservés, aucun DELETE de
-- feature). Seuls des liens feature_effects obsolètes sont supprimés.

PRAGMA foreign_keys=ON;

-- ─── 1. Renommages (noms officiels AideDD) ──────────────────────────────────
UPDATE features SET name = 'Aspect de la lune' WHERE feature_type = 'eldritch_invocation' AND name = 'Aspect de la Lune';
UPDATE features SET name = 'Voile de mouches' WHERE feature_type = 'eldritch_invocation' AND name = 'Manteau de mouches';
UPDATE features SET name = 'Tombe de Levistus' WHERE feature_type = 'eldritch_invocation' AND name = 'Tombeau de Levistus';
UPDATE features SET name = 'Engagement du maître des Chaînes' WHERE feature_type = 'eldritch_invocation' AND name = 'Investiture du maître des chaînes';

-- ─── 2. Prérequis de niveau ─────────────────────────────────────────────────
UPDATE features SET level_required = 1 WHERE feature_type = 'eldritch_invocation' AND name = 'Aspect de la lune' AND level_required = 5;
UPDATE features SET level_required = 1 WHERE feature_type = 'eldritch_invocation' AND name = 'Étreinte de Hadar' AND level_required = 5;
UPDATE features SET level_required = 1 WHERE feature_type = 'eldritch_invocation' AND name = 'Lance de léthargie' AND level_required = 5;
UPDATE features SET level_required = 1 WHERE feature_type = 'eldritch_invocation' AND name = 'Engagement du maître des Chaînes' AND level_required = 7;
UPDATE features SET level_required = 9 WHERE feature_type = 'eldritch_invocation' AND name = 'Don des protecteurs' AND level_required = 1;

-- ─── 3. Descriptions (faits corrigés / noms de sorts octroyés) ──────────────
UPDATE features SET description = 'Vous pouvez lancer Simulacre de vie sur vous-même à volonté en tant que sort de niveau 1, sans dépenser d''emplacement de sort ni de composantes matérielles.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Vigueur fiélonne' AND description <> 'Vous pouvez lancer Simulacre de vie sur vous-même à volonté en tant que sort de niveau 1, sans dépenser d''emplacement de sort ni de composantes matérielles.';
UPDATE features SET description = 'Vous pouvez lancer Fléau une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Voleur des cinq destinées' AND description <> 'Vous pouvez lancer Fléau une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.';
UPDATE features SET description = 'Vous voyez normalement dans les ténèbres, magiques ou non, jusqu''à une distance de 36 mètres.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Vision du diable' AND description <> 'Vous voyez normalement dans les ténèbres, magiques ou non, jusqu''à une distance de 36 mètres.';
UPDATE features SET description = 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez la déplacer de 3 mètres en ligne droite dans votre direction.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Étreinte de Hadar' AND description <> 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez la déplacer de 3 mètres en ligne droite dans votre direction.';
UPDATE features SET description = 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez réduire sa vitesse de 3 mètres jusqu''à la fin de votre prochain tour.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Lance de léthargie' AND description <> 'Une fois à chacun de vos tours, quand vous touchez une créature avec Décharge occulte, vous pouvez réduire sa vitesse de 3 mètres jusqu''à la fin de votre prochain tour.';
UPDATE features SET description = 'Quand vous lancez Appel de familier, votre familier gagne une vitesse de vol et de nage, ses attaques comptent comme magiques pour vaincre les résistances, et il peut effectuer l''action Attaquer lorsque vous renoncez à l''une des vôtres. Quand il subit des dégâts, vous pouvez utiliser votre réaction pour lui accorder la résistance à ces dégâts.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Engagement du maître des Chaînes' AND description <> 'Quand vous lancez Appel de familier, votre familier gagne une vitesse de vol et de nage, ses attaques comptent comme magiques pour vaincre les résistances, et il peut effectuer l''action Attaquer lorsque vous renoncez à l''une des vôtres. Quand il subit des dégâts, vous pouvez utiliser votre réaction pour lui accorder la résistance à ces dégâts.';
UPDATE features SET description = 'Quand vous vous trouvez dans une zone de pénombre ou d''obscurité, vous pouvez utiliser une action pour devenir invisible. L''invisibilité prend fin dès que vous vous déplacez ou que vous effectuez une action ou une réaction.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Maître des ombres' AND description <> 'Quand vous vous trouvez dans une zone de pénombre ou d''obscurité, vous pouvez utiliser une action pour devenir invisible. L''invisibilité prend fin dès que vous vous déplacez ou que vous effectuez une action ou une réaction.';
UPDATE features SET description = 'Vous pouvez lancer Malédiction une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Sombre présage' AND description <> 'Vous pouvez lancer Malédiction une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.';
UPDATE features SET description = 'Par une action bonus, vous vous entourez d''une aura magique évoquant un essaim de mouches bourdonnantes, qui s''étend sur 1,50 mètre autour de vous et que tout abri total bloque. Elle dure jusqu''à ce que vous soyez incapable d''agir ou que vous y mettiez fin par une action bonus. Elle vous donne l''avantage aux tests de Charisme (Intimidation) et le désavantage à vos autres tests de Charisme. Toute créature qui commence son tour dans l''aura subit des dégâts de poison égaux à votre modificateur de Charisme (minimum 0). Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Voile de mouches' AND description <> 'Par une action bonus, vous vous entourez d''une aura magique évoquant un essaim de mouches bourdonnantes, qui s''étend sur 1,50 mètre autour de vous et que tout abri total bloque. Elle dure jusqu''à ce que vous soyez incapable d''agir ou que vous y mettiez fin par une action bonus. Elle vous donne l''avantage aux tests de Charisme (Intimidation) et le désavantage à vos autres tests de Charisme. Toute créature qui commence son tour dans l''aura subit des dégâts de poison égaux à votre modificateur de Charisme (minimum 0). Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.';
UPDATE features SET description = 'Par une réaction, quand vous subissez des dégâts, vous pouvez vous enfermer dans un bloc de glace qui fond à la fin de votre prochain tour. Vous gagnez 10 points de vie temporaires par niveau d''occultiste, puis vous encaissez les dégâts qui ont déclenché la réaction. Immédiatement après, vous gagnez la vulnérabilité aux dégâts de feu, votre vitesse tombe à 0 et vous êtes incapable d''agir. Ces effets, ainsi que les points de vie temporaires restants, prennent fin quand la glace fond. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Tombe de Levistus' AND description <> 'Par une réaction, quand vous subissez des dégâts, vous pouvez vous enfermer dans un bloc de glace qui fond à la fin de votre prochain tour. Vous gagnez 10 points de vie temporaires par niveau d''occultiste, puis vous encaissez les dégâts qui ont déclenché la réaction. Immédiatement après, vous gagnez la vulnérabilité aux dégâts de feu, votre vitesse tombe à 0 et vous êtes incapable d''agir. Ces effets, ainsi que les points de vie temporaires restants, prennent fin quand la glace fond. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.';
UPDATE features SET description = 'Par une action, vous pouvez voir à travers les objets solides jusqu''à 9 mètres ; sur cette distance, vous disposez également de la vision dans le noir si vous ne l''aviez pas déjà. Cette vue dure 1 minute ou jusqu''à ce que votre concentration prenne fin, comme pour un sort. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Regard fantomatique' AND description <> 'Par une action, vous pouvez voir à travers les objets solides jusqu''à 9 mètres ; sur cette distance, vous disposez également de la vision dans le noir si vous ne l''aviez pas déjà. Cette vue dure 1 minute ou jusqu''à ce que votre concentration prenne fin, comme pour un sort. Une fois utilisée, vous devez terminer un repos court ou long avant de la réutiliser.';
UPDATE features SET description = 'Vous pouvez lancer Invocation d''élémentaire une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Sbires du chaos' AND description <> 'Vous pouvez lancer Invocation d''élémentaire une fois en utilisant un emplacement de sort d''occultiste. Vous ne pouvez plus le lancer ainsi avant la fin d''un repos long.';
UPDATE features SET description = 'Quand vous touchez une créature avec votre arme de pacte, elle subit des dégâts nécrotiques supplémentaires égaux à votre modificateur de Charisme (minimum 1).', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Buveuse de vie' AND description <> 'Quand vous touchez une créature avec votre arme de pacte, elle subit des dégâts nécrotiques supplémentaires égaux à votre modificateur de Charisme (minimum 1).';
UPDATE features SET description = 'Vous pouvez lancer Oeil magique à volonté, sans dépenser d''emplacement de sort.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Royaumes lointains' AND description <> 'Vous pouvez lancer Oeil magique à volonté, sans dépenser d''emplacement de sort.';
UPDATE features SET description = 'Vous discernez la forme véritable de tout métamorphe et de toute créature dissimulée par une magie d''illusion ou de transmutation, si elle se trouve dans un rayon de 9 mètres et dans votre ligne de mire.', updated_at = '2026-07-26T12:00:00.000Z' WHERE feature_type = 'eldritch_invocation' AND name = 'Vision de sorcier' AND description <> 'Vous discernez la forme véritable de tout métamorphe et de toute créature dissimulée par une magie d''illusion ou de transmutation, si elle se trouve dans un rayon de 9 mètres et dans votre ligne de mire.';

-- ─── 4. Effets : relink des spell_grant corrigés + purge des orphelins ──────
-- Vigueur fiélonne (+spell_grant)
INSERT INTO effects (type, value) SELECT 'spell_grant', '{"level":1,"spellcastingAbility":"cha","spellName":"Simulacre de vie","countPerLongRest":0}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Vigueur fiélonne' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Simulacre de vie","countPerLongRest":0}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'spell_grant' AND e.value = '{"level":1,"spellcastingAbility":"cha","spellName":"Simulacre de vie","countPerLongRest":0}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Vigueur fiélonne';
-- Vigueur fiélonne (-spell_grant, obsolète)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Vigueur fiélonne') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Fausse vie","countPerLongRest":0}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Fausse vie","countPerLongRest":0}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);
-- Voleur des cinq destinées (+spell_grant)
INSERT INTO effects (type, value) SELECT 'spell_grant', '{"level":1,"spellcastingAbility":"cha","spellName":"Fléau","countPerLongRest":1}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Voleur des cinq destinées' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Fléau","countPerLongRest":1}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'spell_grant' AND e.value = '{"level":1,"spellcastingAbility":"cha","spellName":"Fléau","countPerLongRest":1}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Voleur des cinq destinées';
-- Voleur des cinq destinées (-spell_grant, obsolète)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Voleur des cinq destinées') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Châtiment","countPerLongRest":1}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Châtiment","countPerLongRest":1}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);
-- Sombre présage (+spell_grant)
INSERT INTO effects (type, value) SELECT 'spell_grant', '{"level":3,"spellcastingAbility":"cha","spellName":"Malédiction","countPerLongRest":1}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Sombre présage' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'spell_grant' AND value = '{"level":3,"spellcastingAbility":"cha","spellName":"Malédiction","countPerLongRest":1}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'spell_grant' AND e.value = '{"level":3,"spellcastingAbility":"cha","spellName":"Malédiction","countPerLongRest":1}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Sombre présage';
-- Sombre présage (-spell_grant, obsolète)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Sombre présage') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":3,"spellcastingAbility":"cha","spellName":"Mauvais sort","countPerLongRest":1}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":3,"spellcastingAbility":"cha","spellName":"Mauvais sort","countPerLongRest":1}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);
-- Sbires du chaos (+spell_grant)
INSERT INTO effects (type, value) SELECT 'spell_grant', '{"level":5,"spellcastingAbility":"cha","spellName":"Invocation d''élémentaire","countPerLongRest":1}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Sbires du chaos' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'spell_grant' AND value = '{"level":5,"spellcastingAbility":"cha","spellName":"Invocation d''élémentaire","countPerLongRest":1}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'spell_grant' AND e.value = '{"level":5,"spellcastingAbility":"cha","spellName":"Invocation d''élémentaire","countPerLongRest":1}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Sbires du chaos';
-- Sbires du chaos (-spell_grant, obsolète)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Sbires du chaos') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":5,"spellcastingAbility":"cha","spellName":"Conjuration d''élémentaire","countPerLongRest":1}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":5,"spellcastingAbility":"cha","spellName":"Conjuration d''élémentaire","countPerLongRest":1}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);
-- Royaumes lointains (+spell_grant)
INSERT INTO effects (type, value) SELECT 'spell_grant', '{"level":4,"spellcastingAbility":"cha","spellName":"Oeil magique","countPerLongRest":0}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Royaumes lointains' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'spell_grant' AND value = '{"level":4,"spellcastingAbility":"cha","spellName":"Oeil magique","countPerLongRest":0}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'spell_grant' AND e.value = '{"level":4,"spellcastingAbility":"cha","spellName":"Oeil magique","countPerLongRest":0}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Royaumes lointains';
-- Royaumes lointains (-spell_grant, obsolète)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Royaumes lointains') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":4,"spellcastingAbility":"cha","spellName":"Œil d''arcane","countPerLongRest":0}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":4,"spellcastingAbility":"cha","spellName":"Œil d''arcane","countPerLongRest":0}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);
-- Murmures ensorcelants (-spell_grant, résidu d'un ancien seed ; no-op si absent)
DELETE FROM feature_effects WHERE feature_id IN (SELECT id FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Murmures ensorcelants') AND effect_id IN (SELECT id FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Rire hideux de Tasha","countPerLongRest":1}');
DELETE FROM effects WHERE type = 'spell_grant' AND value = '{"level":1,"spellcastingAbility":"cha","spellName":"Rire hideux de Tasha","countPerLongRest":1}' AND id NOT IN (SELECT effect_id FROM feature_effects) AND id NOT IN (SELECT effect_id FROM item_effects);

-- ─── 5. Manifestation PHB manquante ─────────────────────────────────────────
-- Perception transférée
INSERT INTO features (name, description, feature_type, class_id, level_required, prerequisites, created_at)
SELECT 'Perception transférée', 'Par une action, vous touchez un humanoïde consentant et percevez ce qu''il perçoit jusqu''à la fin de votre prochain tour. Tant qu''il reste sur votre plan d''existence, vous pouvez dépenser une action à chacun de vos tours pour prolonger la connexion d''autant. Pendant ce temps, vous bénéficiez de ses sens particuliers, mais vous êtes aveugle et sourd à ce qui vous entoure.', 'eldritch_invocation', c.id, 1, NULL, '2026-07-26T12:00:00.000Z'
FROM classes c WHERE c.name = 'Occultiste'
  AND NOT EXISTS (SELECT 1 FROM features WHERE feature_type = 'eldritch_invocation' AND name = 'Perception transférée');
INSERT INTO effects (type, value) SELECT 'other', '{"kind":"gaze_of_two_minds"}' FROM features f WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Perception transférée' AND NOT EXISTS (SELECT 1 FROM effects WHERE type = 'other' AND value = '{"kind":"gaze_of_two_minds"}');
INSERT OR IGNORE INTO feature_effects (feature_id, effect_id) SELECT f.id, e.id FROM features f JOIN effects e ON e.type = 'other' AND e.value = '{"kind":"gaze_of_two_minds"}' WHERE f.feature_type = 'eldritch_invocation' AND f.name = 'Perception transférée';

-- ─── 6. Sorts octroyés par les manifestations, absents du catalogue ─────────
-- Sans ces lignes, les `spell_grant` ne matérialisent rien sur la fiche :
-- applyInvocationChanges() résout les sorts octroyés PAR NOM.
-- Communication avec les animaux (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Communication avec les animaux', 1, '1 action', 0, '["V","S"]', NULL, 1, '10 minutes', 0, 'Pour la durée du sort, vous comprenez les bêtes et pouvez leur parler. Leur intelligence limite ce qu''elles savent et ce qu''elles peuvent exprimer, mais elles peuvent au minimum vous renseigner sur les lieux et les créatures des environs, ainsi que sur ce qu''elles ont perçu ces derniers jours. Le MD peut vous laisser convaincre une bête de vous rendre un petit service.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 3
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Communication avec les animaux');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Communication avec les animaux';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Druide' WHERE s.name = 'Communication avec les animaux';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Rôdeur' WHERE s.name = 'Communication avec les animaux';
-- Simulacre de vie (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Simulacre de vie', 1, '1 action', 0, '["V","S","M"]', 'une petite quantité d''alcool ou de spiritueux', 0, '1 heure', 0, 'Une pâle imitation nécromantique de la vie vous enveloppe : vous gagnez 1d4 + 4 points de vie temporaires pour la durée du sort.
Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous gagnez 5 points de vie temporaires de plus pour chaque niveau d''emplacement au-delà du niveau 1.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 7
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Simulacre de vie');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Simulacre de vie';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Simulacre de vie';
-- Déguisement (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Déguisement', 1, '1 action', 0, '["V","S"]', NULL, 0, '1 heure', 0, 'Vous modifiez votre apparence — vêtements, armure, armes et équipement compris — jusqu''à la fin du sort ou jusqu''à ce que vous y mettiez fin par une action. Vous pouvez paraître 30 centimètres plus grand ou plus petit, et plus mince ou plus corpulent, mais vous ne pouvez pas changer de morphologie : vos membres doivent rester disposés de la même façon.
L''illusion ne résiste pas à l''examen tactile : une main passe à travers un chapeau illusoire, par exemple. Une créature qui consacre son action à vous inspecter perce le déguisement si elle réussit un test d''Intelligence (Investigation) contre le DD de sauvegarde de vos sorts.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 6
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Déguisement');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Déguisement';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Déguisement';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Déguisement';
-- Image silencieuse (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Image silencieuse', 1, '1 action', 18, '["V","S","M"]', 'un peu de laine de mouton', 0, 'Concentration, jusqu''à 10 minutes', 1, 'Vous créez l''image d''un objet, d''une créature ou d''un phénomène visible, tenant dans un cube de 4,50 mètres d''arête, à un endroit de votre choix à portée. L''image est purement visuelle : ni son, ni odeur, ni autre effet sensoriel. Par une action, vous pouvez la déplacer n''importe où à portée et ajuster son apparence pour que le mouvement paraisse naturel.
Toute interaction physique révèle la supercherie, puisque les objets la traversent. Une créature qui consacre son action à l''examiner perce l''illusion si elle réussit un test d''Intelligence (Investigation) contre le DD de sauvegarde de vos sorts ; elle voit alors au travers.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 6
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Image silencieuse');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Image silencieuse';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Image silencieuse';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Image silencieuse';
-- Fléau (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Fléau', 1, '1 action', 9, '["V","S","M"]', 'une goutte de sang', 0, 'Concentration, jusqu''à 1 minute', 1, 'Jusqu''à trois créatures visibles à portée doivent réussir un jet de sauvegarde de Charisme. Chaque cible qui échoue doit, jusqu''à la fin du sort, lancer 1d4 et soustraire le résultat de chacun de ses jets d''attaque et de ses jets de sauvegarde.
Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 2 ou supérieur, vous ciblez une créature de plus pour chaque niveau d''emplacement au-delà du niveau 1.', ms.id, '{"ability":"cha","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 4
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Fléau');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Fléau';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Clerc' WHERE s.name = 'Fléau';
-- Saut (niveau 1)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Saut', 1, '1 action', 1.5, '["V","S","M"]', 'la patte postérieure d''une sauterelle', 0, '1 minute', 0, 'Vous touchez une créature : sa distance de saut est triplée pour la durée du sort.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 8
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Saut');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Druide' WHERE s.name = 'Saut';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Saut';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Saut';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Rôdeur' WHERE s.name = 'Saut';
-- Lévitation (niveau 2)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Lévitation', 2, '1 action', 18, '["V","S","M"]', 'une boucle de cuir ou un fil d''or plié en forme de coupe dont une extrémité s''étire', 0, 'Concentration, jusqu''à 10 minutes', 1, 'Une créature ou un objet non tenu, visible à portée, s''élève jusqu''à 6 mètres et reste en suspension pour la durée du sort ; le sort ne peut pas soulever plus de 250 kilogrammes. Une créature récalcitrante qui réussit un jet de sauvegarde de Constitution n''est pas affectée.
La cible ne peut se déplacer qu''en se poussant ou en se tirant sur un objet ou une surface à sa portée, comme si elle grimpait. À chacun de vos tours, vous pouvez la faire monter ou descendre de 6 mètres ; si vous n''êtes pas la cible, il vous faut une action pour la déplacer, et elle doit rester à portée. Quand le sort prend fin, la cible redescend doucement au sol.', ms.id, '{"ability":"con","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 8
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lévitation');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Lévitation';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Lévitation';
-- Modification d'apparence (niveau 2)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Modification d''apparence', 2, '1 action', 0, '["V","S"]', NULL, 0, 'Concentration, jusqu''à 1 heure', 1, 'Vous endossez une nouvelle forme et choisissez à l''incantation l''une des trois options ci-dessous ; par une action, vous pouvez en changer tant que le sort dure.
Adaptation aquatique : vous développez branchies et palmures, vous respirez sous l''eau et gagnez une vitesse de nage égale à votre vitesse de marche.
Changement d''apparence : vous remodelez votre allure (taille, corpulence, traits du visage, voix, pilosité, teint…), y compris pour ressembler à un membre d''une autre race, sans rien gagner de ses traits. Votre catégorie de taille et votre morphologie de base ne changent pas.
Armes naturelles : vous vous dotez de griffes, crocs, cornes ou d''une arme naturelle équivalente. Votre attaque à mains nues inflige 1d6 dégâts contondants, perforants ou tranchants selon l''arme choisie, vous en avez la maîtrise, et elle compte comme une arme magique dotée d''un bonus de +1 aux jets d''attaque et de dégâts.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 8
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Modification d''apparence');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Modification d''apparence';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Modification d''apparence';
-- Lenteur (niveau 3)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Lenteur', 3, '1 action', 36, '["V","S","M"]', 'une goutte de mélasse', 0, 'Concentration, jusqu''à 1 minute', 1, 'Vous distordez le temps autour de six créatures au maximum, choisies dans un cube de 12 mètres d''arête à portée. Chaque cible doit réussir un jet de sauvegarde de Sagesse ou être affectée pour la durée du sort.
Une créature affectée voit sa vitesse divisée par deux, subit un malus de -2 à sa CA et à ses jets de sauvegarde de Dextérité, et ne peut plus utiliser de réaction. À son tour, elle ne peut prendre qu''une action ou une action bonus, pas les deux, et ne peut effectuer qu''une seule attaque, quels que soient ses capacités ou ses objets magiques. Si elle lance un sort dont le temps d''incantation est d''une action, lancez 1d20 : sur 11 ou plus, le sort ne prend effet qu''à la fin de son tour suivant et elle doit y consacrer son action ; sinon, il est perdu.
À la fin de chacun de ses tours, une créature affectée peut refaire le jet de sauvegarde ; en cas de réussite, l''effet cesse pour elle.', ms.id, '{"ability":"wis","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 8
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Lenteur');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Lenteur';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Lenteur';
-- Confusion (niveau 4)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Confusion', 4, '1 action', 27, '["V","S","M"]', 'trois coquilles de noix', 0, 'Concentration, jusqu''à 1 minute', 1, 'Vous assaillez les esprits dans une sphère de 3 mètres de rayon centrée sur un point à portée. Chaque créature de la zone doit réussir un jet de sauvegarde de Sagesse ou être affectée.
Une cible affectée ne peut plus réagir et lance 1d10 au début de chacun de ses tours pour déterminer son comportement : sur 1, elle emploie tout son mouvement à se déplacer dans une direction aléatoire (1d8) et n''agit pas ; de 2 à 6, elle ne bouge pas et n''agit pas ; sur 7 ou 8, elle attaque au corps à corps une créature à sa portée choisie au hasard, ou ne fait rien si aucune n''est à portée ; sur 9 ou 10, elle agit et se déplace normalement.
À la fin de chacun de ses tours, une cible peut refaire le jet de sauvegarde ; en cas de réussite, l''effet cesse pour elle.
Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 5 ou supérieur, le rayon de la sphère augmente de 1,50 mètre pour chaque niveau d''emplacement au-delà du niveau 4.', ms.id, '{"ability":"wis","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 4
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Confusion');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Confusion';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Druide' WHERE s.name = 'Confusion';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Confusion';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Confusion';
-- Métamorphose (niveau 4)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Métamorphose', 4, '1 action', 18, '["V","S","M"]', 'un cocon de chenille', 0, 'Concentration, jusqu''à 1 heure', 1, 'Vous transformez une créature visible à portée. Une cible récalcitrante annule l''effet en réussissant un jet de sauvegarde de Sagesse ; le sort n''a aucune prise sur un métamorphe ou une créature à 0 point de vie.
La nouvelle forme est celle d''une bête dont le facteur de puissance ne dépasse pas celui de la cible (ou son niveau, à défaut de facteur de puissance). Les statistiques de la cible, y compris mentales, sont remplacées par celles de la bête ; elle conserve son alignement et sa personnalité, mais ne peut ni parler, ni lancer de sorts, ni rien entreprendre qui demande des mains ou la parole. Son équipement fusionne avec la nouvelle forme et devient inutilisable.
La cible adopte les points de vie de la bête et retrouve les siens en reprenant sa forme normale. Si elle y est ramenée par une chute à 0 point de vie, les dégâts excédentaires s''appliquent à sa forme normale ; tant qu''ils ne la réduisent pas elle-même à 0, elle ne tombe pas inconsciente.', ms.id, '{"ability":"wis","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 8
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Métamorphose');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Métamorphose';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Druide' WHERE s.name = 'Métamorphose';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Métamorphose';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Métamorphose';
-- Oeil magique (niveau 4)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Oeil magique', 4, '1 action', 9, '["V","S","M"]', 'quelques poils de chauve-souris', 0, 'Concentration, jusqu''à 1 heure', 1, 'Vous créez à portée un œil magique invisible qui flotte dans les airs pour la durée du sort. Vous en recevez une image mentale : il voit dans toutes les directions, avec une vision normale et une vision dans le noir jusqu''à 9 mètres.
Par une action, vous le déplacez de 9 mètres dans la direction de votre choix. Aucune distance maximale ne vous sépare de lui, mais il ne peut pas changer de plan d''existence. Les obstacles solides l''arrêtent, même s''il se faufile par toute ouverture d''au moins 2,50 centimètres de diamètre.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 3
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Oeil magique');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Oeil magique';
-- Immobilisation de monstre (niveau 5)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Immobilisation de monstre', 5, '1 action', 27, '["V","S","M"]', 'une petite pièce de fer', 0, 'Concentration, jusqu''à 1 minute', 1, 'Choisissez une créature visible à portée. Elle doit réussir un jet de sauvegarde de Sagesse ou être paralysée pour la durée du sort ; les morts-vivants y sont insensibles. À la fin de chacun de ses tours, la cible peut refaire le jet de sauvegarde et met fin au sort pour elle en cas de réussite.
Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, vous ciblez une créature de plus pour chaque niveau d''emplacement au-delà du niveau 5 ; toutes les cibles doivent alors se trouver à 9 mètres les unes des autres.', ms.id, '{"ability":"wis","success":"none"}', NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 4
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Immobilisation de monstre');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Barde' WHERE s.name = 'Immobilisation de monstre';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Ensorceleur' WHERE s.name = 'Immobilisation de monstre';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Immobilisation de monstre';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Occultiste' WHERE s.name = 'Immobilisation de monstre';
-- Invocation d'élémentaire (niveau 5)
INSERT INTO spells (name, level, casting_time, range, components, material, ritual, duration, concentration, description, school_id, dc, damages, heal, multi_attack)
SELECT 'Invocation d''élémentaire', 5, '1 minute', 27, '["V","S","M"]', 'de l''encens allumé pour l''air, de l''argile malléable pour la terre, du soufre et du phosphore pour le feu, ou de l''eau et du sable pour l''eau', 0, 'Concentration, jusqu''à 1 heure', 1, 'Vous appelez un serviteur élémentaire. Désignez à portée un cube de 3 mètres d''arête empli d''air, de terre, de feu ou d''eau : un élémentaire de facteur de puissance 5 au plus, adapté à cet élément, apparaît dans un espace inoccupé à 3 mètres ou moins de cette zone. Il disparaît à 0 point de vie ou quand le sort prend fin.
L''élémentaire vous est amical, à vous et à vos compagnons, et joue ses propres tours ; il obéit aux ordres verbaux que vous lui donnez sans que cela vous coûte une action, et se contente de se défendre si vous ne lui en donnez aucun.
Si votre concentration est rompue, il ne disparaît pas mais vous échappe : il devient hostile, peut vous attaquer, ne peut plus être renvoyé et s''évanouit une heure après avoir été invoqué.
Aux niveaux supérieurs. Lorsque vous lancez ce sort en utilisant un emplacement de sort de niveau 6 ou supérieur, le facteur de puissance de l''élémentaire augmente de 1 pour chaque niveau d''emplacement au-delà du niveau 5.', ms.id, NULL, NULL, NULL, NULL
FROM magic_schools ms WHERE ms.id = 2
  AND NOT EXISTS (SELECT 1 FROM spells WHERE name = 'Invocation d''élémentaire');
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Druide' WHERE s.name = 'Invocation d''élémentaire';
INSERT OR IGNORE INTO spell_classes (spell_id, class_id) SELECT s.id, c.id FROM spells s JOIN classes c ON c.name = 'Magicien' WHERE s.name = 'Invocation d''élémentaire';

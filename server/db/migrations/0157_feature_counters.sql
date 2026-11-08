-- Compteurs et coûts des capacités de classe (C10 #231, C11 #232). Pose sur les features déployées :
--   * le compteur d'utilisations (max_uses_formula + recharge_type) des capacités à usages limités ;
--   * le coût d'une option de Conduit divin et des capacités de ki de sous-classe (meta.cost), et les dépenses de ki du Moine
--     (meta.spends de « Ki ») ;
--   * recharge_type = NULL là où la capacité n'a ni compteur ni réserve (Incantation, Source d'inspiration…).
-- Pendant du seed : test/fixtures/featureCounterPatches.ts, gardé par test/nuxt/featureCountersMigration.test.ts.
--
-- AUTO-SUFFISANTE (pas de re-seed prod) et idempotente (UPDATE de valeurs fixes). Limitée à l'édition 2014 ; tolérante base
-- vierge : rien n'est posé si la feature n'existe pas encore, le seed s'en charge alors. Jamais BEGIN (D1).

-- Clerc — Intervention divine (niv. 10)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND f.name = 'Intervention divine' AND f.level_required = 10);

-- Clerc / Domaine de la lumière — Illumination protectrice (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"var","name":"wis_mod"}}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la lumière' AND f.name = 'Illumination protectrice' AND f.level_required = 1);

-- Clerc / Domaine de la guerre — Prêtre de guerre (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"var","name":"wis_mod"}}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la guerre' AND f.name = 'Prêtre de guerre' AND f.level_required = 1);

-- Clerc / Domaine de la tempête — Fureur de l'ouragan (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"var","name":"wis_mod"}}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la tempête' AND f.name = 'Fureur de l''ouragan' AND f.level_required = 1);

-- Clerc — Renvoi des morts-vivants (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND f.name = 'Renvoi des morts-vivants' AND f.level_required = 2);

-- Clerc / Domaine de la vie — Conduit divin : Préservation de la vie (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la vie' AND f.name = 'Conduit divin : Préservation de la vie' AND f.level_required = 2);

-- Clerc / Domaine de la lumière — Conduit divin : Radiance de l'aube (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la lumière' AND f.name = 'Conduit divin : Radiance de l''aube' AND f.level_required = 2);

-- Clerc / Domaine de la guerre — Conduit divin : Frappe guidée (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la guerre' AND f.name = 'Conduit divin : Frappe guidée' AND f.level_required = 2);

-- Clerc / Domaine de la guerre — Conduit divin : Bénédiction du dieu de la guerre (niv. 6)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la guerre' AND f.name = 'Conduit divin : Bénédiction du dieu de la guerre' AND f.level_required = 6);

-- Clerc / Domaine de la tempête — Conduit divin : Fureur destructrice (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la tempête' AND f.name = 'Conduit divin : Fureur destructrice' AND f.level_required = 2);

-- Clerc / Domaine de la nature — Conduit divin : Charme des animaux et des plantes (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la nature' AND f.name = 'Conduit divin : Charme des animaux et des plantes' AND f.level_required = 2);

-- Clerc / Domaine de la duperie — Conduit divin : Invocation de réplique (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la duperie' AND f.name = 'Conduit divin : Invocation de réplique' AND f.level_required = 2);

-- Clerc / Domaine de la duperie — Conduit divin : Linceul d'ombre (niv. 6)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine de la duperie' AND f.name = 'Conduit divin : Linceul d''ombre' AND f.level_required = 6);

-- Clerc / Domaine du savoir — Conduit divin : Savoir ancestral (niv. 2)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine du savoir' AND f.name = 'Conduit divin : Savoir ancestral' AND f.level_required = 2);

-- Clerc / Domaine du savoir — Conduit divin : Lecture des pensées (niv. 6)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Clerc' AND c.ruleset = '5' AND s.name = 'Domaine du savoir' AND f.name = 'Conduit divin : Lecture des pensées' AND f.level_required = 6);

-- Druide / Cercle de la terre — Récupération naturelle (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Druide' AND c.ruleset = '5' AND s.name = 'Cercle de la terre' AND f.name = 'Récupération naturelle' AND f.level_required = 2);

-- Ensorceleur — Incantation (niv. 1)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Incantation' AND f.level_required = 1);

-- Ensorceleur — Restauration ensorcelée (niv. 20)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND f.name = 'Restauration ensorcelée' AND f.level_required = 20);

-- Ensorceleur / Magie sauvage — Marée du chaos (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Ensorceleur' AND c.ruleset = '5' AND s.name = 'Magie sauvage' AND f.name = 'Marée du chaos' AND f.level_required = 1);

-- Barde — Source d'inspiration (niv. 5)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Barde' AND c.ruleset = '5' AND f.name = 'Source d''inspiration' AND f.level_required = 5);

-- Magicien — Restauration arcanique (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND f.name = 'Restauration arcanique' AND f.level_required = 1);

-- Magicien — Sorts de prédilection (niv. 20)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":2}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND f.name = 'Sorts de prédilection' AND f.level_required = 20);

-- Magicien / École d'abjuration — Protection arcanique (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École d''abjuration' AND f.name = 'Protection arcanique' AND f.level_required = 2);

-- Magicien / École de divination — Présage (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"lookup","table":[2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3]}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École de divination' AND f.name = 'Présage' AND f.level_required = 2);

-- Magicien / École d'enchantement — Regard hypnotique (niv. 2)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École d''enchantement' AND f.name = 'Regard hypnotique' AND f.level_required = 2);

-- Magicien / École d'enchantement — Charme instinctif (niv. 6)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École d''enchantement' AND f.name = 'Charme instinctif' AND f.level_required = 6);

-- Magicien / École d'évocation — Surcharge magique (niv. 14)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École d''évocation' AND f.name = 'Surcharge magique' AND f.level_required = 14);

-- Magicien / École d'illusion — Double illusoire (niv. 10)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Magicien' AND c.ruleset = '5' AND s.name = 'École d''illusion' AND f.name = 'Double illusoire' AND f.level_required = 10);

-- Moine / Voie de la paume — Plénitude physique (niv. 6)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND s.name = 'Voie de la paume' AND f.name = 'Plénitude physique' AND f.level_required = 6);

-- Moine / Voie de la paume — Tranquillité (niv. 11)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND s.name = 'Voie de la paume' AND f.name = 'Tranquillité' AND f.level_required = 11);

-- Moine / Voie de la paume — Paume frémissante (niv. 17)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"ki","amount":3}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND s.name = 'Voie de la paume' AND f.name = 'Paume frémissante' AND f.level_required = 17);

-- Moine / Voie de l'ombre — Arts des ombres (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"ki","amount":2}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND s.name = 'Voie de l''ombre' AND f.name = 'Arts des ombres' AND f.level_required = 3);

-- Paladin — Sens divin (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"add","left":{"op":"fixed","value":1},"right":{"op":"var","name":"cha_mod"}}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Sens divin' AND f.level_required = 1);

-- Paladin — Contact purifiant (niv. 14)
UPDATE features SET max_uses_formula = '{"op":"max","left":{"op":"fixed","value":1},"right":{"op":"var","name":"cha_mod"}}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND f.name = 'Contact purifiant' AND f.level_required = 14);

-- Paladin / Serment de dévotion — Nimbe sacré (niv. 20)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de dévotion' AND f.name = 'Nimbe sacré' AND f.level_required = 20);

-- Paladin / Serment des anciens — Sentinelle immortelle (niv. 15)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment des anciens' AND f.name = 'Sentinelle immortelle' AND f.level_required = 15);

-- Paladin / Serment des anciens — Champion antique (niv. 20)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment des anciens' AND f.name = 'Champion antique' AND f.level_required = 20);

-- Paladin / Serment de vengeance — Ange de la vengeance (niv. 20)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de vengeance' AND f.name = 'Ange de la vengeance' AND f.level_required = 20);

-- Paladin / Serment de dévotion — Conduit divin : Arme sacrée (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de dévotion' AND f.name = 'Conduit divin : Arme sacrée' AND f.level_required = 3);

-- Paladin / Serment de dévotion — Conduit divin : Renvoi des impies (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de dévotion' AND f.name = 'Conduit divin : Renvoi des impies' AND f.level_required = 3);

-- Paladin / Serment des anciens — Conduit divin : Courroux de la nature (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment des anciens' AND f.name = 'Conduit divin : Courroux de la nature' AND f.level_required = 3);

-- Paladin / Serment des anciens — Conduit divin : Renvoi des infidèles (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment des anciens' AND f.name = 'Conduit divin : Renvoi des infidèles' AND f.level_required = 3);

-- Paladin / Serment de vengeance — Conduit divin : Conspuer l'ennemi (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de vengeance' AND f.name = 'Conduit divin : Conspuer l''ennemi' AND f.level_required = 3);

-- Paladin / Serment de vengeance — Conduit divin : Vœu d'hostilité (niv. 3)
UPDATE features SET recharge_type = NULL, meta = '{"cost":{"resource":"channel_divinity","amount":1}}' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Paladin' AND c.ruleset = '5' AND s.name = 'Serment de vengeance' AND f.name = 'Conduit divin : Vœu d''hostilité' AND f.level_required = 3);

-- Roublard — Coup de chance (niv. 20)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND f.name = 'Coup de chance' AND f.level_required = 20);

-- Roublard / Escroc arcanique — Voleur de sort (niv. 17)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND s.name = 'Escroc arcanique' AND f.name = 'Voleur de sort' AND f.level_required = 17);

-- Roublard / Escroc arcanique — Incantation (niv. 3)
UPDATE features SET recharge_type = NULL WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Roublard' AND c.ruleset = '5' AND s.name = 'Escroc arcanique' AND f.name = 'Incantation' AND f.level_required = 3);

-- Occultiste / Le Fiélon — Chance du ténébreux (niv. 6)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Occultiste' AND c.ruleset = '5' AND s.name = 'Le Fiélon' AND f.name = 'Chance du ténébreux' AND f.level_required = 6);

-- Occultiste / Le Fiélon — Traversée des enfers (niv. 14)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'long_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Occultiste' AND c.ruleset = '5' AND s.name = 'Le Fiélon' AND f.name = 'Traversée des enfers' AND f.level_required = 14);

-- Occultiste / L'Archifée — Présence féerique (niv. 1)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Occultiste' AND c.ruleset = '5' AND s.name = 'L''Archifée' AND f.name = 'Présence féerique' AND f.level_required = 1);

-- Occultiste / L'Archifée — Échappatoire brumeuse (niv. 6)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Occultiste' AND c.ruleset = '5' AND s.name = 'L''Archifée' AND f.name = 'Échappatoire brumeuse' AND f.level_required = 6);

-- Occultiste / L'Archifée — Sombre délire (niv. 14)
UPDATE features SET max_uses_formula = '{"op":"fixed","value":1}', recharge_type = 'short_rest' WHERE id IN (SELECT f.id FROM features f JOIN subclasses s ON s.id = f.subclass_id JOIN classes c ON c.id = s.class_id WHERE c.name = 'Occultiste' AND c.ruleset = '5' AND s.name = 'L''Archifée' AND f.name = 'Sombre délire' AND f.level_required = 14);

-- Moine — Ki (niv. 2)
UPDATE features SET max_uses_formula = '{"op":"var","name":"class_level"}', recharge_type = 'short_rest', meta = '{"resource":"ki","pool":true,"saveDcAbility":"wis","spends":[{"label":"Défense patiente","amount":1},{"label":"Déluge de coups","amount":1},{"label":"Déplacement aérien","amount":1},{"label":"Parade de projectiles (renvoi)","amount":1,"minClassLevel":3},{"label":"Frappe étourdissante","amount":1,"minClassLevel":5},{"label":"Âme de diamant","amount":1,"minClassLevel":14},{"label":"Vide immaculé","amount":4,"minClassLevel":18},{"label":"Projection astrale","amount":8,"minClassLevel":18}],"regains":[{"label":"Perfection de l''être","amount":4,"minClassLevel":20,"whenEmpty":true}]}' WHERE id IN (SELECT f.id FROM features f JOIN classes c ON c.id = f.class_id WHERE c.name = 'Moine' AND c.ruleset = '5' AND f.name = 'Ki' AND f.level_required = 2);

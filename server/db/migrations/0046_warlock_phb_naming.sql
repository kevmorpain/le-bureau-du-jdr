-- Renommages des features Occultiste vers les noms officiels PHB FR 2014
-- Source : https://www.aidedd.org/regles/classes/occultiste/ et /dnd-filters/manifestations-occultes.php

-- ── Capacités de classe ─────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Magie de pacte'                 WHERE `name` = 'Magie du Pacte';
UPDATE `features` SET `name` = 'Manifestations occultes'        WHERE `name` = 'Invocations occultes';
UPDATE `features` SET `name` = 'Faveur de pacte'                WHERE `name` = 'Faveur du Pacte';
UPDATE `features` SET `name` = 'Arcanum mystique (niveau 6)'    WHERE `name` = 'Arcane mystérieux (6e niveau)';
UPDATE `features` SET `name` = 'Arcanum mystique (niveau 7)'    WHERE `name` = 'Arcane mystérieux (7e niveau)';
UPDATE `features` SET `name` = 'Arcanum mystique (niveau 8)'    WHERE `name` = 'Arcane mystérieux (8e niveau)';
UPDATE `features` SET `name` = 'Arcanum mystique (niveau 9)'    WHERE `name` = 'Arcane mystérieux (9e niveau)';
UPDATE `features` SET `name` = 'Maître de l''occulte'           WHERE `name` = 'Maîtrise éldritique';

-- ── Grand Ancien ────────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Esprit éveillé'                 WHERE `name` = 'Éveil mental';
UPDATE `features` SET `name` = 'Protection entropique'          WHERE `name` = 'Garde entropique';
UPDATE `features` SET `name` = 'Bouclier mental'                WHERE `name` = 'Voile de la pensée';
UPDATE `features` SET `name` = 'Asservissement'                 WHERE `name` = 'Création de thrall';

-- ── Le Fiélon ───────────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Bénédiction du ténébreux'       WHERE `name` = 'Bénédiction du sombre maître';

-- ── L'Archifée ──────────────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Échappatoire brumeuse'          WHERE `name` = 'Pas illusoire';
UPDATE `features` SET `name` = 'Défenses captivantes'           WHERE `name` = 'Protection contre les charmes';
UPDATE `features` SET `name` = 'Sombre délire'                  WHERE `name` = 'Forme sombre';

-- ── Manifestations occultes (PHB 2014) ──────────────────────────────────────
UPDATE `features` SET `name` = 'Armure d''ombres'               WHERE `name` = 'Armure des ombres';
UPDATE `features` SET `name` = 'Décharge déchirante'            WHERE `name` = 'Coup éldritique agonisant';
UPDATE `features` SET `name` = 'Décharge répulsive'             WHERE `name` = 'Décharge repoussante';
UPDATE `features` SET `name` = 'Lance occulte'                  WHERE `name` = 'Lance éldritique';
UPDATE `features` SET `name` = 'Langage animal'                 WHERE `name` = 'Bouche-à-oreille bestiale';
UPDATE `features` SET `name` = 'Lenteur de l''esprit'           WHERE `name` = 'Embourber l''esprit';
UPDATE `features` SET `name` = 'Maître des formes'              WHERE `name` = 'Maître des formes multiples';
UPDATE `features` SET `name` = 'Maître des ombres'              WHERE `name` = 'Au gré des ombres';
UPDATE `features` SET `name` = 'Mille visages'                  WHERE `name` = 'Masque aux mille visages';
UPDATE `features` SET `name` = 'Mot d''effroi'                  WHERE `name` = 'Verbe redouté';
UPDATE `features` SET `name` = 'Murmures de la tombe'           WHERE `name` = 'Murmures d''outre-tombe';
UPDATE `features` SET `name` = 'Murmures ensorcelants'          WHERE `name` = 'Murmures destructeurs';
UPDATE `features` SET `name` = 'Oeil du gardien des runes'      WHERE `name` = 'Yeux du gardien des runes';
UPDATE `features` SET `name` = 'Pas aérien'                     WHERE `name` = 'Pas ascendant';
UPDATE `features` SET `name` = 'Présence captivante'            WHERE `name` = 'Influence enjôleuse';
UPDATE `features` SET `name` = 'Royaumes lointains'             WHERE `name` = 'Visions de mondes lointains';
UPDATE `features` SET `name` = 'Saut d''Outremonde'             WHERE `name` = 'Saut surnaturel';
UPDATE `features` SET `name` = 'Sombre présage'                 WHERE `name` = 'Signe de mauvais augure';
UPDATE `features` SET `name` = 'Vision de sorcier'              WHERE `name` = 'Vue de sorcière';
UPDATE `features` SET `name` = 'Vision du diable'               WHERE `name` = 'Vue du Diable';
UPDATE `features` SET `name` = 'Vision occulte'                 WHERE `name` = 'Vue éldritique';
UPDATE `features` SET `name` = 'Visions embrumées'              WHERE `name` = 'Visions trompeuses';
UPDATE `features` SET `name` = 'Voix du maître des Chaînes'     WHERE `name` = 'Voix du maître des chaînes';
UPDATE `features` SET `name` = 'Voleur des cinq destinées'      WHERE `name` = 'Voleur de cinq destins';
UPDATE `features` SET `name` = 'Chaînes des Carcères'           WHERE `name` = 'Chaînes de Carceri';

-- ── Sorts ───────────────────────────────────────────────────────────────────
UPDATE `spells` SET `name` = 'Maléfice' WHERE `name` = 'Gibet démoniaque';

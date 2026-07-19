-- Reconstruit le Maître de guerre (Battle Master) du Guerrier selon le PHB FR 2014.
-- Source : https://www.aidedd.org/regles/classes/guerrier/
--
-- Le seed scindait « Supériorité martiale » en deux (Manœuvres + Dés) et il manquait
-- « Disciple martial » (L3) et « Supériorité martiale améliorée » (L10/L18) ; le L18
-- « Implacable » dupliquait la mécanique du L15. On purge les aptitudes du Maître de
-- guerre : le reseed ré-insère le jeu correct (6 aptitudes aux bons niveaux).

DELETE FROM `features`
  WHERE `subclass_id` = (
    SELECT `id` FROM `subclasses`
    WHERE `name` = 'Maître de guerre'
      AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Guerrier'));

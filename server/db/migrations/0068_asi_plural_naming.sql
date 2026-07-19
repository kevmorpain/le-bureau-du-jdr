-- Passe globale : « Amélioration de caractéristique » -> « Amélioration de
-- caractéristiques » (pluriel PHB FR 2014 / AideDD) sur TOUTES les classes.
-- Feature générique partagée par les 12 classes (l'Occultiste la définit à chaque
-- niveau d'ASI). Nom unique en base -> un seul UPDATE non scopé suffit, sans risque
-- de collision. Les libellés UI en dur ont été mis au pluriel dans le même lot.

UPDATE `features` SET `name` = 'Amélioration de caractéristiques'
  WHERE `name` = 'Amélioration de caractéristique';

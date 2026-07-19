-- Aligne l'Ensorceleur sur les noms officiels PHB FR 2014 (D&D 5e 2014).
-- Source de validation des noms : https://www.aidedd.org/regles/classes/ensorceleur/
--
-- Corrige le bug du character builder : la sous-classe était stockée 'Âme sauvage'
-- alors que le builder envoie 'Magie sauvage' (Wild Magic) -> resolveSubclassId ne
-- trouvait jamais la sous-classe (toast « Sous-classe introuvable »). On renomme
-- aussi les features de base et de sous-classe vers les noms PHB.
--
-- IMPORTANT : tous les renommages sont scopés sur l'Ensorceleur uniquement. Seul
-- son seed a été mis à jour ; renommer une feature partagée (ex. 'Lanceur de sorts',
-- présent chez les autres lanceurs) sans MAJ de leur seed créerait un doublon au
-- prochain reseed (seedClass insère si le nom n'existe pas).
--
-- Les descriptions et mécaniques (action_type, recharge_type) sont resynchronisées
-- par le seed lui-même (seedClass._resyncFeatureContent au reseed), pas ici, pour
-- éviter la duplication du contenu.

-- ── Sous-classe : Âme sauvage -> Magie sauvage (Wild Magic) ──────────────────
UPDATE `subclasses` SET `name` = 'Magie sauvage'
  WHERE `name` = 'Âme sauvage'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur');

-- ── Aptitudes de classe (base) ──────────────────────────────────────────────
UPDATE `features` SET `name` = 'Incantation'
  WHERE `name` = 'Lanceur de sorts'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur');
UPDATE `features` SET `name` = 'Source de magie'
  WHERE `name` = 'Source de sorcellerie'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur');
UPDATE `features` SET `name` = 'Restauration ensorcelée'
  WHERE `name` = 'Restauration de la source'
    AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur');

-- ── Lignée draconique ───────────────────────────────────────────────────────
UPDATE `features` SET `name` = 'Résistance draconique'
  WHERE `name` = 'Résilience draconique'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Lignée draconique'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));

-- ── Magie sauvage (la sous-classe est déjà renommée ci-dessus) ──────────────
UPDATE `features` SET `name` = 'Pic de magie sauvage'
  WHERE `name` = 'Magie sauvage'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Magie sauvage'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));
UPDATE `features` SET `name` = 'Marée du chaos'
  WHERE `name` = 'Vague du destin'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Magie sauvage'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));
UPDATE `features` SET `name` = 'Chance forcée'
  WHERE `name` = 'Surpuissance chaotique'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Magie sauvage'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));
UPDATE `features` SET `name` = 'Chaos contrôlé'
  WHERE `name` = 'Chance de l''âme sauvage'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Magie sauvage'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));
UPDATE `features` SET `name` = 'Bombardement de sort'
  WHERE `name` = 'Accès incontrôlé'
    AND `subclass_id` = (
      SELECT `id` FROM `subclasses`
      WHERE `name` = 'Magie sauvage'
        AND `class_id` = (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur'));

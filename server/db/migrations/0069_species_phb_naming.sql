-- Aligne les ESPÈCES (races/sous-races) sur le PHB FR 2014 (D&D 5e 2014).
-- Source de validation : https://www.aidedd.org/regles/races/<race>/
--
-- Le contenu des espèces était globalement propre (traits + effects structurés)
-- mais présentait : des noms de traits non conformes à AideDD, des incohérences
-- de noms entre sous-races, un trait mal placé (Ténacité naine sur les montagnes),
-- des « Langue supplémentaire » mal nommées et sans effets (2e lot d'espèces),
-- et une modélisation dédoublée de l'Augmentation de caractéristiques (base +
-- sous-race en deux features de même nom → collision latente au seed à froid).
--
-- Le seeder d'espèces est idempotent par (species, feature.name) mais NE
-- resynchronise PAS description/effets. Donc : renommages simples = UPDATE ;
-- changements de desc/effets ou fusion = purge ciblée (DELETE) + ré-insertion
-- propre par le reseed (le FK cascade nettoie species_features/feature_effects/
-- character_features). Traits purement ajoutés (Ténacité naine, Maîtrise des
-- outils des montagnes) = insérés par le reseed, aucune ligne ici.

-- ── A. Augmentation de caractéristiques : fusion base+sous-race ──────────────
-- Haut-elfe / Nain des collines / Halfelin pied-léger / Gnome des rochers
-- avaient DEUX features « Augmentation de caractéristique » (même nom). On les
-- purge → le reseed insère une seule « Augmentation de caractéristiques » portant
-- les deux effets (comme les autres espèces).
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` = 'Augmentation de caractéristique'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` IN ('Haut-elfe', 'Nain des collines', 'Halfelin pied-léger', 'Gnome des rochers'));

-- ── B. Singulier → pluriel (PHB/AideDD) sur les espèces à ASI unique ─────────
UPDATE `features` SET `name` = 'Augmentation de caractéristiques'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Augmentation de caractéristique';

-- ── C. Renommages de traits (nom seul ; desc/effets déjà corrects) ──────────
-- Elfe (Haut-elfe + Elfe des bois) : entraînement aux armes elfiques
UPDATE `features` SET `name` = 'Entraînement aux armes elfiques'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Entraînement martial elfique';

-- Ascendance féérique → féerique (Haut-elfe + Demi-elfe ; l'Elfe des bois est purgé en D)
UPDATE `features` SET `name` = 'Ascendance féerique'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Ascendance féérique'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` IN ('Haut-elfe', 'Demi-elfe'));

-- Elfe des bois : Mask of the Wild
UPDATE `features` SET `name` = 'Cachette naturelle'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Pas furtifs de la forêt';

-- Nain (collines + montagnes) : Dwarven Combat Training, nom unique AideDD
UPDATE `features` SET `name` = 'Entraînement aux armes naines'
  WHERE `feature_type` = 'species_trait' AND `name` IN ('Entraînement martial nain', 'Formation aux armes naines');

-- Nain des collines : maîtrise des outils (nom de base AideDD)
UPDATE `features` SET `name` = 'Maîtrise des outils'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Maîtrise d''outils';

-- Nain des montagnes : Dwarven Armor Training
UPDATE `features` SET `name` = 'Formation au port des armures naines'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Maîtrise des armures naines';

-- Halfelin robuste : Stout Resilience
UPDATE `features` SET `name` = 'Résistance des robustes'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Résistance robuste';

-- Gnome des rochers : Artificer's Lore (singulier AideDD)
UPDATE `features` SET `name` = 'Connaissance en ingénierie'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Connaissances en ingénierie';

-- Gnome des forêts : Natural Illusionist + Speak with Small Beasts
UPDATE `features` SET `name` = 'Illusionniste-né'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Magie innée des gnomes';
UPDATE `features` SET `name` = 'Communication avec les petits animaux'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Communication avec les bêtes';

-- Demi-orc : Savage Attacks
UPDATE `features` SET `name` = 'Attaques sauvages'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Sauvagerie';
-- Demi-orc : Relentless Endurance (+ correction coquille « ocup » → « coup »)
UPDATE `features`
  SET `name` = 'Endurance implacable',
      `description` = 'Si vous tombez à 0 point de vie sans être tué sur le coup, vous pouvez en fait vous retrouver à 1 point de vie. Une fois que vous avez utilisé cette aptitude, vous devez terminer un repos long pour pouvoir y recourir de nouveau.'
  WHERE `feature_type` = 'species_trait' AND `name` = 'Acharnement';

-- ── D. Purges ciblées (desc/effets à corriger → ré-insertion par le reseed) ──
-- Elfe des bois : Ascendance féérique manquait l'immunité au sommeil magique
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` = 'Ascendance féérique'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` = 'Elfe des bois');

-- « Langue supplémentaire » mal nommée + sans effets → « Langues » (Commun +
-- langue raciale). NB : on NE touche PAS le Haut-elfe, dont la « Langue
-- supplémentaire » est le vrai trait de sous-race (Extra Language).
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` = 'Langue supplémentaire'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` IN ('Elfe des bois', 'Nain des montagnes', 'Halfelin robuste', 'Gnome des forêts'));

-- Nain des montagnes : Connaissance de la pierre était sans effet (skill_bonus)
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` = 'Connaissance de la pierre'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` = 'Nain des montagnes');

-- Halfelin robuste : Chance/Bravoure → Chanceux/Brave (noms PHB + desc unifiée)
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` IN ('Chance', 'Bravoure')
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` = 'Halfelin robuste');

-- ── E. Trait mal placé ──────────────────────────────────────────────────────
-- « Robustesse naine » (Dwarven Toughness) est un trait Nain des COLLINES ;
-- il était à tort sur les montagnes. On le supprime des montagnes ; le reseed
-- ajoute « Ténacité naine » aux collines et « Maîtrise des outils » aux montagnes.
DELETE FROM `features`
  WHERE `feature_type` = 'species_trait' AND `name` = 'Robustesse naine'
    AND `id` IN (
      SELECT `sf`.`feature_id` FROM `species_features` `sf`
      JOIN `character_species` `cs` ON `cs`.`id` = `sf`.`species_id`
      WHERE `cs`.`name` = 'Nain des montagnes');

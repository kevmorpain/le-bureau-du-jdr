-- Aligne le libellé de la sous-race sur AideDD / PHB FR 2014 :
-- « Gnome des rochers » → « Gnome des roches ».
-- speciesId inchangé → les fiches existantes (référencées par speciesId) ne cassent pas.
-- L'Elfe noir (Drow), lui, est une nouvelle espèce insérée par le reseed (findFirst par
-- nom → absent → insert), donc aucune ligne SQL ici pour le Drow.

UPDATE `character_species` SET `name` = 'Gnome des roches'
  WHERE `name` = 'Gnome des rochers';

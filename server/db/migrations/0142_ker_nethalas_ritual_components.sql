-- Les composants rituels, ajoutés aux provisions (`emptyKnProvisions()`), valent 0 chez les survivants existants.
-- Sans eux, la fiche enregistrée serait refusée : chaque provision est obligatoire. Le DEFAULT de la colonne, qui n'a servi
-- qu'à l'ajouter et que SQLite ne permet pas de modifier, reste celui de 0135 : l'application fournit toujours les provisions.
UPDATE `kn_characters`
SET `provisions` = json_set(`provisions`, '$.ritualComponents', 0)
WHERE json_extract(`provisions`, '$.ritualComponents') IS NULL;

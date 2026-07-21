-- Alignement des sorts sur AideDD / PHB 2014 : renommages canoniques.
-- Renommages scopés par ancien nom (les noms de sorts sont uniques).
UPDATE `spells` SET `name` = 'Éclair traçant' WHERE `name` = 'Rayon traçant';
UPDATE `spells` SET `name` = 'Sens des pièges' WHERE `name` = 'Détection des pièges';
UPDATE `spells` SET `name` = 'Tentacules noirs d''Evard' WHERE `name` = 'Tentacules noirs';
UPDATE `spells` SET `name` = 'Invocation de fée' WHERE `name` = 'Conjuration de fée';
UPDATE `spells` SET `name` = 'Vision suprême' WHERE `name` = 'Vision lucide';
UPDATE `spells` SET `name` = 'Changement de plan' WHERE `name` = 'Voyage planaire';
UPDATE `spells` SET `name` = 'Mauvais oeil' WHERE `name` = 'Mauvais œil';
UPDATE `spells` SET `name` = 'Cécité/Surdité' WHERE `name` = 'Cécité / Surdité';

-- Sort bogus « Porte-objet » (absent d'AideDD, aucun équivalent PHB) : suppression
-- des liens classe↔sort puis du sort. Aucune fiche de personnage ne le référence.
DELETE FROM `spell_classes` WHERE `spell_id` IN (SELECT `id` FROM `spells` WHERE `name` = 'Porte-objet');
DELETE FROM `spells` WHERE `name` = 'Porte-objet';

-- « Rayon affaiblissant » était (à tort) un cantrip d'Ensorceleur ; c'est en réalité
-- Ray of Enfeeblement (niveau 2, Magicien/Occultiste). Le seed n'efface jamais un
-- lien classe↔sort, on retire donc ici le lien Ensorceleur devenu caduc.
DELETE FROM `spell_classes`
WHERE `spell_id` IN (SELECT `id` FROM `spells` WHERE `name` = 'Rayon affaiblissant')
  AND `class_id` IN (SELECT `id` FROM `classes` WHERE `name` = 'Ensorceleur');

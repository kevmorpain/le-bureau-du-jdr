-- Aligne le nom de la sous-classe Occultiste sur le nom officiel PHB FR 2014
-- utilisé par l'UI du character builder ('Le Grand Ancien'). Sans ça, le POST
-- builder cherche 'Le Grand Ancien' en DB, ne trouve rien (la row était 'Grand
-- Ancien'), met subclassId à null, et n'attache aucune feature de sous-classe.

UPDATE `subclasses` SET `name` = 'Le Grand Ancien' WHERE `name` = 'Grand Ancien';

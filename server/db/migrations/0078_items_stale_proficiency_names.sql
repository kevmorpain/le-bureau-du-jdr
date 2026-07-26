-- Rattrapage du volet OBJETS (migration 0076).
--
-- Les maîtrises d'armes et d'outils sont stockées en TEXTE LIBRE dans
-- character_proficiency_overrides, et la maîtrise d'une arme est déterminée en
-- comparant cette chaîne au NOM de l'objet (useCharacterInventory.ts,
-- isWeaponProficient : `p.toLowerCase() === item.name.toLowerCase()`).
-- Les renommages AideDD appliqués par 0076 ont donc pu laisser des maîtrises
-- orphelines : elles s'affichent encore sur la fiche mais n'accordent plus le
-- bonus, silencieusement. Cette migration réaligne ces valeurs.
--
-- Aucune ligne n'est concernée sur la base locale ; c'est un filet pour les
-- fiches de production, qu'on ne peut pas inspecter directement.
--
-- `UPDATE OR REPLACE` : la clé primaire est (character_sheet_id,
-- proficiency_type, value). Si une fiche portait DÉJÀ le nouveau nom, la ligne
-- devenue redondante est remplacée au lieu de faire échouer la migration.
-- Idempotent : au second passage, plus aucune ligne ne porte l'ancien nom.

PRAGMA foreign_keys=ON;

-- ══ Maîtrises d'armes ══════════════════════════════════════════════════════
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Massue'
  WHERE proficiency_type = 'weapon' AND value = 'Grande massue';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Serpe'
  WHERE proficiency_type = 'weapon' AND value = 'Faucille';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Coutille'
  WHERE proficiency_type = 'weapon' AND value = 'Glaive';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Hache à deux mains'
  WHERE proficiency_type = 'weapon' AND value = 'Grande hache';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Lance d''arçon'
  WHERE proficiency_type = 'weapon' AND value = 'Lance de cavalier';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Pic de guerre'
  WHERE proficiency_type = 'weapon' AND value = 'Épieu de guerre';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Arbalète de poing'
  WHERE proficiency_type = 'weapon' AND value = 'Arbalète à main';

-- « Fauchard » n'existe pas au PHB 2014 : c'était un doublon exact de la
-- Coutille (Glaive), supprimé par 0076. On reporte la maîtrise sur la Coutille
-- plutôt que de la perdre.
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Coutille'
  WHERE proficiency_type = 'weapon' AND value = 'Fauchard';

-- ══ Maîtrises d'outils ═════════════════════════════════════════════════════
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Ustensiles de cuisinier'
  WHERE proficiency_type = 'tool' AND value = 'Outils de cuisinier';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Outils de bijoutier'
  WHERE proficiency_type = 'tool' AND value = 'Outils de joaillier';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Matériel de peintre'
  WHERE proficiency_type = 'tool' AND value = 'Outils de peintre';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Outils de souffleur de verre'
  WHERE proficiency_type = 'tool' AND value = 'Outils de verrier';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Jeu de cartes'
  WHERE proficiency_type = 'tool' AND value = 'Jeu de cartes du Destin';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Jeu d''échecs draconiques'
  WHERE proficiency_type = 'tool' AND value = 'Jeu d''échecs des dragons';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Kit d''herboriste'
  WHERE proficiency_type = 'tool' AND value = 'Kit de guérisseur';
UPDATE OR REPLACE character_proficiency_overrides SET value = 'Outils de navigateur'
  WHERE proficiency_type = 'tool' AND value = 'Matériel de navigation';

-- « Outils de graveur » et « Outils de tonnelier » (métiers absents du PHB,
-- supprimés du catalogue par 0076) sont laissés tels quels : une maîtrise
-- d'outil est un simple libellé d'affichage, et supprimer un choix du joueur
-- serait plus dommageable que de garder un intitulé hors catalogue.

-- Réalignement des objets (items) sur AideDD (trad FR officielle PHB 2014).
-- Audit des 89 items du seed : dégâts/CA/propriétés étaient corrects (sauf 1),
-- mais 21 noms FR étaient erronés vs AideDD, 3 items n'existent pas au PHB 2014,
-- et 13 items PHB manquaient. Le seed items.ts est INSERT-only par `id`
-- (aucun resync) → cette migration porte TOUTES les corrections de contenu ;
-- elle est auto-suffisante → la prod n'a PAS besoin d'être reseedée.
--
-- Les fiches référencent les objets par item_id (character_inventory.item_id,
-- item_effects.item_id) → les renommages de `name` sont FK-safe (ids préservés).
-- Chaque UPDATE matche l'ancienne valeur → idempotent (no-op sur une base déjà
-- réalignée ou fraîchement seedée). Les DELETE sont conditionnés à l'absence de
-- référence (FK-safe) et les INSERT sont ignorés si l'id existe déjà.

PRAGMA foreign_keys=ON;

-- ══ Renommages d'armes (noms FR officiels AideDD) ═══════════════════════════
-- Greatclub : « Grande massue » → « Massue » + correction dégâts 2d6 → 1d8.
UPDATE items SET name = 'Massue' WHERE id = 3 AND name = 'Grande massue';
UPDATE items
SET properties = '{"damage_dice":"1d8","damage_type":"bludgeoning","weapon_category":"simple_melee","weapon_properties":["two_handed"]}'
WHERE id = 3
  AND properties = '{"damage_dice":"2d6","damage_type":"bludgeoning","weapon_category":"simple_melee","weapon_properties":["two_handed"]}';

UPDATE items SET name = 'Serpe' WHERE id = 9 AND name = 'Faucille';                              -- Sickle
UPDATE items SET name = 'Coutille' WHERE id = 17 AND name = 'Glaive';                            -- Glaive
UPDATE items SET name = 'Hache à deux mains' WHERE id = 18 AND name = 'Grande hache';            -- Greataxe
UPDATE items SET name = 'Lance d''arçon' WHERE id = 21 AND name = 'Lance de cavalier';           -- Lance
UPDATE items SET name = 'Pic de guerre' WHERE id = 25 AND name = 'Épieu de guerre';              -- War pick
UPDATE items SET name = 'Arbalète de poing' WHERE id = 32 AND name = 'Arbalète à main';          -- Hand crossbow

-- Lance d'arçon : la description était passée au helper en 3e argument (l'objet
-- `properties`) au lieu du 4e → elle finissait sérialisée dans le JSON au lieu de
-- la colonne `description`. On la déplace, et on la complète (le PHB ajoute la
-- contrainte des deux mains hors monture).
UPDATE items
SET properties = '{"damage_dice":"1d12","damage_type":"piercing","weapon_category":"martial_melee","weapon_properties":["reach"]}',
    description = 'Désavantage aux attaques contre les cibles à 1,50 m ou moins. Nécessite deux mains hors monture.'
WHERE id = 21
  AND properties = '{"damage_dice":"1d12","damage_type":"piercing","weapon_category":"martial_melee","weapon_properties":["reach"],"description":"Désavantage aux attaques contre les cibles adjacentes."}';

-- ══ Renommages d'armures (CA/malus déjà corrects) ══════════════════════════
UPDATE items SET name = 'Armure de peaux' WHERE id = 42 AND name = 'Armure de peau';             -- Hide
UPDATE items SET name = 'Broigne' WHERE id = 47 AND name = 'Cotte de mailles en anneaux';        -- Ring mail (CA14)
UPDATE items SET name = 'Clibanion' WHERE id = 49 AND name = 'Broigne';                          -- Splint (CA17)
UPDATE items SET name = 'Harnois' WHERE id = 50 AND name = 'Armure en plaques';                  -- Plate (CA18)

-- ══ Renommages d'outils ════════════════════════════════════════════════════
UPDATE items SET name = 'Ustensiles de cuisinier' WHERE id = 73 AND name = 'Outils de cuisinier';       -- Cook's utensils
UPDATE items SET name = 'Outils de bijoutier' WHERE id = 75 AND name = 'Outils de joaillier';           -- Jeweler's tools
UPDATE items SET name = 'Matériel de peintre' WHERE id = 77 AND name = 'Outils de peintre';             -- Painter's supplies
UPDATE items SET name = 'Outils de souffleur de verre' WHERE id = 82 AND name = 'Outils de verrier';    -- Glassblower's tools
UPDATE items SET name = 'Jeu de cartes' WHERE id = 101 AND name = 'Jeu de cartes du Destin';            -- Playing card set
UPDATE items SET name = 'Jeu d''échecs draconiques' WHERE id = 102 AND name = 'Jeu d''échecs des dragons'; -- Dragonchess set
UPDATE items SET name = 'Kit d''herboriste' WHERE id = 113 AND name = 'Kit de guérisseur';              -- Herbalism kit
UPDATE items SET name = 'Outils de navigateur' WHERE id = 114 AND name = 'Matériel de navigation';      -- Navigator's tools

-- ══ Renommages de matériel d'aventurier ════════════════════════════════════
UPDATE items SET name = 'Corde en chanvre (15 m)' WHERE id = 64 AND name = 'Corde de chanvre (15 m)';   -- Rope, hempen
UPDATE items SET name = 'Trousse de soins' WHERE id = 68 AND name = 'Kit de premiers secours';          -- Healer's kit

-- ══ Suppression des items hors-PHB 2014 (FK-safe : uniquement si non référencés) ══
-- id 24 « Fauchard » (arme fantôme, doublon exact de Coutille) ; id 74 « Outils de
-- graveur » et id 81 « Outils de tonnelier » (métiers d'artisan absents du PHB).
-- Le NOT IN protège d'un échec FK si une fiche prod les référence (no-op alors).
DELETE FROM items
WHERE id IN (24, 74, 81)
  AND id NOT IN (SELECT item_id FROM character_inventory)
  AND id NOT IN (SELECT item_id FROM item_effects);

-- ══ Ajout des 13 items PHB 2014 manquants (idempotent : ignoré si id présent) ══
-- Les JSON `properties` sont identiques à la sérialisation Drizzle du seed
-- (même ordre de clés) → une base fraîchement seedée produit des lignes égales.
INSERT OR IGNORE INTO items (id, name, item_type, properties, description, is_custom) VALUES
  (35, 'Maillet', 'weapon', '{"damage_dice":"2d6","damage_type":"bludgeoning","weapon_category":"martial_melee","weapon_properties":["heavy","two_handed"]}', NULL, 0),
  (36, 'Pique', 'weapon', '{"damage_dice":"1d10","damage_type":"piercing","weapon_category":"martial_melee","weapon_properties":["heavy","reach","two_handed"]}', NULL, 0),
  (37, 'Filet', 'weapon', '{"damage_dice":"0","damage_type":"bludgeoning","weapon_category":"martial_ranged","weapon_properties":["thrown"],"range":{"normal":1.5,"long":4.5}}', 'Sans dégâts. Une créature de taille G ou inférieure touchée est entravée jusqu''à libération : une action et un jet de Force DD 10, ou 5 dégâts tranchants infligés au filet (CA 10). Une seule attaque par action, action bonus ou réaction, quel que soit le nombre d''attaques.', 0),
  (38, 'Sarbacane', 'weapon', '{"damage_dice":"1d1","damage_type":"piercing","weapon_category":"martial_ranged","weapon_properties":["ammunition","loading"],"range":{"normal":7.5,"long":30}}', 'Dégâts fixes de 1 (aiguille de sarbacane), sans jet de dé.', 0),
  (52, 'Armure matelassée', 'armor', '{"armor_type":"light","base_ac":11,"dex_limit":null,"stealth_disadvantage":true}', NULL, 0),
  (86, 'Outils de cartographe', 'tool', '{"tool_type":"artisan","category":"Outils d''artisan"}', NULL, 0),
  (87, 'Outils de bricoleur', 'tool', '{"tool_type":"artisan","category":"Outils d''artisan"}', NULL, 0),
  (88, 'Outils de menuisier', 'tool', '{"tool_type":"artisan","category":"Outils d''artisan"}', NULL, 0),
  (97, 'Chalemie', 'tool', '{"tool_type":"musical","category":"Instrument de musique"}', NULL, 0),
  (98, 'Flûte de pan', 'tool', '{"tool_type":"musical","category":"Instrument de musique"}', NULL, 0),
  (99, 'Tympanon', 'tool', '{"tool_type":"musical","category":"Instrument de musique"}', NULL, 0),
  (103, 'Jeu des Dragons', 'tool', '{"tool_type":"gaming","category":"Jeu"}', NULL, 0),
  (104, 'Kit de contrefaçon', 'tool', '{"tool_type":"other","category":"Outil spécial"}', NULL, 0);

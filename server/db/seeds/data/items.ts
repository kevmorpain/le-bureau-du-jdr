import type { ItemType, ItemProperties, WeaponProperties, ArmorProperties, EquipmentProperties, ToolProperties } from '../../schema/items'

interface ItemSeed {
  id: number
  name: string
  itemType: ItemType
  properties: ItemProperties
  description?: string
}

function weapon(
  id: number,
  name: string,
  props: WeaponProperties,
  description?: string,
): ItemSeed {
  return { id, name, itemType: 'weapon', properties: props, description }
}

function armor(
  id: number,
  name: string,
  props: ArmorProperties,
  description?: string,
): ItemSeed {
  return { id, name, itemType: 'armor', properties: props, description }
}

function equipment(
  id: number,
  name: string,
  category: string,
  description?: string,
): ItemSeed {
  return { id, name, itemType: 'equipment', properties: { category } satisfies EquipmentProperties, description }
}

function tool(
  id: number,
  name: string,
  tool_type: ToolProperties['tool_type'],
  category: string,
  description?: string,
): ItemSeed {
  return { id, name, itemType: 'tool', properties: { tool_type, category } satisfies ToolProperties, description }
}

// Noms officiels alignés sur AideDD (trad FR du PHB 2014). Voir migration
// 0076_items_phb_naming pour les renommages/ajouts/suppressions appliqués aux
// bases déjà peuplées (ce seed est INSERT-only par id).

// ─── Armes simples de mêlée ───────────────────────────────────────────────────

const simpleMeleeWeapons: ItemSeed[] = [
  weapon(1, 'Gourdin', {
    damage_dice: '1d4',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_melee',
    weapon_properties: ['light'],
  }),
  weapon(2, 'Dague', {
    damage_dice: '1d4',
    damage_type: 'piercing',
    weapon_category: 'simple_melee',
    weapon_properties: ['finesse', 'light', 'thrown'],
    range: { normal: 6, long: 18 },
  }),
  weapon(3, 'Massue', {
    damage_dice: '1d8',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_melee',
    weapon_properties: ['two_handed'],
  }),
  weapon(4, 'Hachette', {
    damage_dice: '1d6',
    damage_type: 'slashing',
    weapon_category: 'simple_melee',
    weapon_properties: ['light', 'thrown'],
    range: { normal: 6, long: 18 },
  }),
  weapon(5, 'Javeline', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'simple_melee',
    weapon_properties: ['thrown'],
    range: { normal: 9, long: 36 },
  }),
  weapon(6, 'Marteau léger', {
    damage_dice: '1d4',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_melee',
    weapon_properties: ['light', 'thrown'],
    range: { normal: 6, long: 18 },
  }),
  weapon(7, 'Masse d\'armes', {
    damage_dice: '1d6',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_melee',
    weapon_properties: [],
  }),
  weapon(8, 'Bâton', {
    damage_dice: '1d6',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_melee',
    weapon_properties: ['versatile'],
    versatile_damage: '1d8',
  }),
  weapon(9, 'Serpe', {
    damage_dice: '1d4',
    damage_type: 'slashing',
    weapon_category: 'simple_melee',
    weapon_properties: ['light'],
  }),
  weapon(10, 'Lance', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'simple_melee',
    weapon_properties: ['thrown', 'versatile'],
    range: { normal: 6, long: 18 },
    versatile_damage: '1d8',
  }),
]

// ─── Armes simples à distance ─────────────────────────────────────────────────

const simpleRangedWeapons: ItemSeed[] = [
  weapon(11, 'Arbalète légère', {
    damage_dice: '1d8',
    damage_type: 'piercing',
    weapon_category: 'simple_ranged',
    weapon_properties: ['ammunition', 'loading', 'two_handed'],
    range: { normal: 24, long: 96 },
  }),
  weapon(12, 'Fléchette', {
    damage_dice: '1d4',
    damage_type: 'piercing',
    weapon_category: 'simple_ranged',
    weapon_properties: ['finesse', 'thrown'],
    range: { normal: 6, long: 18 },
  }),
  weapon(13, 'Fronde', {
    damage_dice: '1d4',
    damage_type: 'bludgeoning',
    weapon_category: 'simple_ranged',
    weapon_properties: ['ammunition'],
    range: { normal: 9, long: 36 },
  }),
  weapon(14, 'Arc court', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'simple_ranged',
    weapon_properties: ['ammunition', 'two_handed'],
    range: { normal: 24, long: 96 },
  }),
]

// ─── Armes de guerre de mêlée ─────────────────────────────────────────────────

const martialMeleeWeapons: ItemSeed[] = [
  weapon(15, 'Hache d\'armes', {
    damage_dice: '1d8',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['versatile'],
    versatile_damage: '1d10',
  }),
  weapon(16, 'Fléau d\'armes', {
    damage_dice: '1d8',
    damage_type: 'bludgeoning',
    weapon_category: 'martial_melee',
    weapon_properties: [],
  }),
  weapon(17, 'Coutille', {
    damage_dice: '1d10',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'reach', 'two_handed'],
  }),
  weapon(18, 'Hache à deux mains', {
    damage_dice: '1d12',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'two_handed'],
  }),
  weapon(19, 'Épée à deux mains', {
    damage_dice: '2d6',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'two_handed'],
  }),
  weapon(20, 'Hallebarde', {
    damage_dice: '1d10',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'reach', 'two_handed'],
  }),
  weapon(21, 'Lance d\'arçon', {
    damage_dice: '1d12',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['reach'],
  }, 'Désavantage aux attaques contre les cibles à 1,50 m ou moins. Nécessite deux mains hors monture.'),
  weapon(22, 'Épée longue', {
    damage_dice: '1d8',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['versatile'],
    versatile_damage: '1d10',
  }),
  weapon(23, 'Morgenstern', {
    damage_dice: '1d8',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: [],
  }),
  weapon(25, 'Pic de guerre', {
    damage_dice: '1d8',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: [],
  }),
  weapon(26, 'Rapière', {
    damage_dice: '1d8',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['finesse'],
  }),
  weapon(27, 'Cimeterre', {
    damage_dice: '1d6',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['finesse', 'light'],
  }),
  weapon(28, 'Épée courte', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['finesse', 'light'],
  }),
  weapon(29, 'Trident', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['thrown', 'versatile'],
    range: { normal: 6, long: 18 },
    versatile_damage: '1d8',
  }),
  weapon(30, 'Fouet', {
    damage_dice: '1d4',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['finesse', 'reach'],
  }),
  weapon(31, 'Marteau de guerre', {
    damage_dice: '1d8',
    damage_type: 'bludgeoning',
    weapon_category: 'martial_melee',
    weapon_properties: ['versatile'],
    versatile_damage: '1d10',
  }),
  // Ajouts PHB 2014 (absents du seed initial) — ids dans le trou 35-36.
  weapon(35, 'Maillet', {
    damage_dice: '2d6',
    damage_type: 'bludgeoning',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'two_handed'],
  }),
  weapon(36, 'Pique', {
    damage_dice: '1d10',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'reach', 'two_handed'],
  }),
]

// ─── Armes de guerre à distance ───────────────────────────────────────────────

const martialRangedWeapons: ItemSeed[] = [
  weapon(32, 'Arbalète de poing', {
    damage_dice: '1d6',
    damage_type: 'piercing',
    weapon_category: 'martial_ranged',
    weapon_properties: ['ammunition', 'light', 'loading'],
    range: { normal: 9, long: 36 },
  }),
  weapon(33, 'Arbalète lourde', {
    damage_dice: '1d10',
    damage_type: 'piercing',
    weapon_category: 'martial_ranged',
    weapon_properties: ['ammunition', 'heavy', 'loading', 'two_handed'],
    range: { normal: 30, long: 120 },
  }),
  weapon(34, 'Arc long', {
    damage_dice: '1d8',
    damage_type: 'piercing',
    weapon_category: 'martial_ranged',
    weapon_properties: ['ammunition', 'heavy', 'two_handed'],
    range: { normal: 45, long: 180 },
  }),
  // Ajouts PHB 2014 (armes spéciales) — ids dans le trou 37-38.
  // Filet : sans dégâts (le schéma exige un dé → "0"), effet d'entrave en description.
  weapon(37, 'Filet', {
    damage_dice: '0',
    damage_type: 'bludgeoning',
    weapon_category: 'martial_ranged',
    weapon_properties: ['thrown'],
    range: { normal: 1.5, long: 4.5 },
  }, 'Sans dégâts. Une créature de taille G ou inférieure touchée est entravée jusqu\'à libération : une action et un jet de Force DD 10, ou 5 dégâts tranchants infligés au filet (CA 10). Une seule attaque par action, action bonus ou réaction, quel que soit le nombre d\'attaques.'),
  // Sarbacane : 1 dégât fixe → modélisé "1d1" (jet toujours = 1).
  weapon(38, 'Sarbacane', {
    damage_dice: '1d1',
    damage_type: 'piercing',
    weapon_category: 'martial_ranged',
    weapon_properties: ['ammunition', 'loading'],
    range: { normal: 7.5, long: 30 },
  }, 'Dégâts fixes de 1 (aiguille de sarbacane), sans jet de dé.'),
]

// ─── Armures ──────────────────────────────────────────────────────────────────

const armors: ItemSeed[] = [
  // Armures légères
  armor(40, 'Armure de cuir', {
    armor_type: 'light',
    base_ac: 11,
    dex_limit: null,
    stealth_disadvantage: false,
  }),
  armor(41, 'Armure de cuir clouté', {
    armor_type: 'light',
    base_ac: 12,
    dex_limit: null,
    stealth_disadvantage: false,
  }),
  // Armure matelassée (ajout PHB) — id dans le trou 52.
  armor(52, 'Armure matelassée', {
    armor_type: 'light',
    base_ac: 11,
    dex_limit: null,
    stealth_disadvantage: true,
  }),
  // Armures intermédiaires
  armor(42, 'Armure de peaux', {
    armor_type: 'medium',
    base_ac: 12,
    dex_limit: 2,
    stealth_disadvantage: false,
  }),
  armor(43, 'Chemise de mailles', {
    armor_type: 'medium',
    base_ac: 13,
    dex_limit: 2,
    stealth_disadvantage: false,
  }),
  armor(44, 'Armure d\'écailles', {
    armor_type: 'medium',
    base_ac: 14,
    dex_limit: 2,
    stealth_disadvantage: true,
  }),
  armor(45, 'Cuirasse', {
    armor_type: 'medium',
    base_ac: 14,
    dex_limit: 2,
    stealth_disadvantage: false,
  }),
  armor(46, 'Demi-plate', {
    armor_type: 'medium',
    base_ac: 15,
    dex_limit: 2,
    stealth_disadvantage: true,
  }),
  // Armures lourdes
  armor(47, 'Broigne', {
    armor_type: 'heavy',
    base_ac: 14,
    dex_limit: 0,
    stealth_disadvantage: true,
  }),
  armor(48, 'Cotte de mailles', {
    armor_type: 'heavy',
    base_ac: 16,
    dex_limit: 0,
    strength_requirement: 13,
    stealth_disadvantage: true,
  }),
  armor(49, 'Clibanion', {
    armor_type: 'heavy',
    base_ac: 17,
    dex_limit: 0,
    strength_requirement: 15,
    stealth_disadvantage: true,
  }),
  armor(50, 'Harnois', {
    armor_type: 'heavy',
    base_ac: 18,
    dex_limit: 0,
    strength_requirement: 15,
    stealth_disadvantage: true,
  }),
  // Bouclier
  armor(51, 'Bouclier', {
    armor_type: 'shield',
    base_ac: 2,
    dex_limit: null,
    stealth_disadvantage: false,
  }),
]

// ─── Équipement d'aventurier ──────────────────────────────────────────────────

const equipmentItems: ItemSeed[] = [
  equipment(60, 'Sac à dos', 'Conteneur', 'Contient jusqu\'à 30 livres de matériel.'),
  equipment(61, 'Sac de couchage', 'Repos'),
  equipment(62, 'Torche', 'Éclairage', 'Éclaire sur 6 mètres en lumière vive et 6 mètres supplémentaires en lumière faible. Dure 1 heure.'),
  equipment(63, 'Rations (1 jour)', 'Nourriture'),
  equipment(64, 'Corde en chanvre (15 m)', 'Outil'),
  equipment(65, 'Grappin', 'Outil'),
  equipment(66, 'Lanterne à capote', 'Éclairage', 'Éclaire sur 9 mètres en lumière vive et 9 mètres en lumière faible. Dure 6 heures par flasque d\'huile.'),
  equipment(67, 'Huile (flasque)', 'Consommable'),
  equipment(68, 'Trousse de soins', 'Médical', 'Stabilise un personnage mourant. 10 utilisations.'),
  equipment(69, 'Outils de voleur', 'Outil', 'Nécessaires pour crocheter des serrures et désamorcer des pièges. Maîtrise requise.'),
]

// ─── Outils ───────────────────────────────────────────────────────────────────

const toolItems: ItemSeed[] = [
  // Outils d'artisan
  tool(70, 'Outils de forgeron', 'artisan', 'Outils d\'artisan'),
  tool(71, 'Outils de charpentier', 'artisan', 'Outils d\'artisan'),
  tool(72, 'Outils de cordonnier', 'artisan', 'Outils d\'artisan'),
  tool(73, 'Ustensiles de cuisinier', 'artisan', 'Outils d\'artisan'),
  tool(75, 'Outils de bijoutier', 'artisan', 'Outils d\'artisan'),
  tool(76, 'Outils de maçon', 'artisan', 'Outils d\'artisan'),
  tool(77, 'Matériel de peintre', 'artisan', 'Outils d\'artisan'),
  tool(78, 'Outils de potier', 'artisan', 'Outils d\'artisan'),
  tool(79, 'Outils de tanneur', 'artisan', 'Outils d\'artisan'),
  tool(80, 'Outils de tisserand', 'artisan', 'Outils d\'artisan'),
  tool(82, 'Outils de souffleur de verre', 'artisan', 'Outils d\'artisan'),
  tool(83, 'Matériel d\'alchimiste', 'artisan', 'Outils d\'artisan'),
  tool(84, 'Matériel de brasseur', 'artisan', 'Outils d\'artisan'),
  tool(85, 'Matériel de calligraphe', 'artisan', 'Outils d\'artisan'),
  // Ajouts PHB (outils d'artisan) — ids dans le trou 86-88.
  tool(86, 'Outils de cartographe', 'artisan', 'Outils d\'artisan'),
  tool(87, 'Outils de bricoleur', 'artisan', 'Outils d\'artisan'),
  tool(88, 'Outils de menuisier', 'artisan', 'Outils d\'artisan'),
  // Instruments de musique
  tool(90, 'Cornemuse', 'musical', 'Instrument de musique'),
  tool(91, 'Cor', 'musical', 'Instrument de musique'),
  tool(92, 'Flûte', 'musical', 'Instrument de musique'),
  tool(93, 'Luth', 'musical', 'Instrument de musique'),
  tool(94, 'Lyre', 'musical', 'Instrument de musique'),
  tool(95, 'Tambour', 'musical', 'Instrument de musique'),
  tool(96, 'Viole', 'musical', 'Instrument de musique'),
  // Ajouts PHB (instruments) — ids dans le trou 97-99.
  tool(97, 'Chalemie', 'musical', 'Instrument de musique'),
  tool(98, 'Flûte de pan', 'musical', 'Instrument de musique'),
  tool(99, 'Tympanon', 'musical', 'Instrument de musique'),
  // Jeux
  tool(100, 'Jeu de dés', 'gaming', 'Jeu'),
  tool(101, 'Jeu de cartes', 'gaming', 'Jeu'),
  tool(102, 'Jeu d\'échecs draconiques', 'gaming', 'Jeu'),
  // Ajout PHB (jeu) — id dans le trou 103.
  tool(103, 'Jeu des Dragons', 'gaming', 'Jeu'),
  // Outils spéciaux
  tool(110, 'Outils de voleur', 'other', 'Outil spécial', 'Permet de crocheter des serrures et désamorcer des pièges. Maîtrise requise.'),
  tool(111, 'Kit de déguisement', 'other', 'Outil spécial'),
  tool(112, 'Kit d\'empoisonneur', 'other', 'Outil spécial'),
  tool(113, 'Kit d\'herboriste', 'other', 'Outil spécial'),
  tool(114, 'Outils de navigateur', 'other', 'Outil spécial'),
  tool(115, 'Véhicules (terrestres)', 'other', 'Véhicule'),
  tool(116, 'Véhicules (maritimes)', 'other', 'Véhicule'),
  // Ajout PHB (kit) — id dans le trou 104.
  tool(104, 'Kit de contrefaçon', 'other', 'Outil spécial'),
]

export const itemsData: ItemSeed[] = [
  ...simpleMeleeWeapons,
  ...simpleRangedWeapons,
  ...martialMeleeWeapons,
  ...martialRangedWeapons,
  ...armors,
  ...equipmentItems,
  ...toolItems,
]

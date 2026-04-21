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
  weapon(3, 'Grande massue', {
    damage_dice: '2d6',
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
  weapon(9, 'Faucille', {
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
  weapon(17, 'Glaive', {
    damage_dice: '1d10',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'reach', 'two_handed'],
  }),
  weapon(18, 'Grande hache', {
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
  weapon(21, 'Lance de cavalier', {
    damage_dice: '1d12',
    damage_type: 'piercing',
    weapon_category: 'martial_melee',
    weapon_properties: ['reach'],
    description: 'Désavantage aux attaques contre les cibles adjacentes.',
  }),
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
  weapon(24, 'Fauchard', {
    damage_dice: '1d10',
    damage_type: 'slashing',
    weapon_category: 'martial_melee',
    weapon_properties: ['heavy', 'reach', 'two_handed'],
  }),
  weapon(25, 'Épieu de guerre', {
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
]

// ─── Armes de guerre à distance ───────────────────────────────────────────────

const martialRangedWeapons: ItemSeed[] = [
  weapon(32, 'Arbalète à main', {
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
  // Armures intermédiaires
  armor(42, 'Armure de peau', {
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
  armor(47, 'Cotte de mailles en anneaux', {
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
  armor(49, 'Broigne', {
    armor_type: 'heavy',
    base_ac: 17,
    dex_limit: 0,
    strength_requirement: 15,
    stealth_disadvantage: true,
  }),
  armor(50, 'Armure en plaques', {
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
  equipment(64, 'Corde de chanvre (15 m)', 'Outil'),
  equipment(65, 'Grappin', 'Outil'),
  equipment(66, 'Lanterne à capote', 'Éclairage', 'Éclaire sur 9 mètres en lumière vive et 9 mètres en lumière faible. Dure 6 heures par flasque d\'huile.'),
  equipment(67, 'Huile (flasque)', 'Consommable'),
  equipment(68, 'Kit de premiers secours', 'Médical', 'Stabilise un personnage mourant. 10 utilisations.'),
  equipment(69, 'Outils de voleur', 'Outil', 'Nécessaires pour crocheter des serrures et désamorcer des pièges. Maîtrise requise.'),
]

// ─── Outils ───────────────────────────────────────────────────────────────────

const toolItems: ItemSeed[] = [
  // Outils d'artisan
  tool(70, 'Outils de forgeron', 'artisan', 'Outils d\'artisan'),
  tool(71, 'Outils de charpentier', 'artisan', 'Outils d\'artisan'),
  tool(72, 'Outils de cordonnier', 'artisan', 'Outils d\'artisan'),
  tool(73, 'Outils de cuisinier', 'artisan', 'Outils d\'artisan'),
  tool(74, 'Outils de graveur', 'artisan', 'Outils d\'artisan'),
  tool(75, 'Outils de joaillier', 'artisan', 'Outils d\'artisan'),
  tool(76, 'Outils de maçon', 'artisan', 'Outils d\'artisan'),
  tool(77, 'Outils de peintre', 'artisan', 'Outils d\'artisan'),
  tool(78, 'Outils de potier', 'artisan', 'Outils d\'artisan'),
  tool(79, 'Outils de tanneur', 'artisan', 'Outils d\'artisan'),
  tool(80, 'Outils de tisserand', 'artisan', 'Outils d\'artisan'),
  tool(81, 'Outils de tonnelier', 'artisan', 'Outils d\'artisan'),
  tool(82, 'Outils de verrier', 'artisan', 'Outils d\'artisan'),
  tool(83, 'Matériel d\'alchimiste', 'artisan', 'Outils d\'artisan'),
  tool(84, 'Matériel de brasseur', 'artisan', 'Outils d\'artisan'),
  tool(85, 'Matériel de calligraphe', 'artisan', 'Outils d\'artisan'),
  // Instruments de musique
  tool(90, 'Cornemuse', 'musical', 'Instrument de musique'),
  tool(91, 'Cor', 'musical', 'Instrument de musique'),
  tool(92, 'Flûte', 'musical', 'Instrument de musique'),
  tool(93, 'Luth', 'musical', 'Instrument de musique'),
  tool(94, 'Lyre', 'musical', 'Instrument de musique'),
  tool(95, 'Tambour', 'musical', 'Instrument de musique'),
  tool(96, 'Viole', 'musical', 'Instrument de musique'),
  // Jeux
  tool(100, 'Jeu de dés', 'gaming', 'Jeu'),
  tool(101, 'Jeu de cartes du Destin', 'gaming', 'Jeu'),
  tool(102, 'Jeu d\'échecs des dragons', 'gaming', 'Jeu'),
  // Outils spéciaux
  tool(110, 'Outils de voleur', 'other', 'Outil spécial', 'Permet de crocheter des serrures et désamorcer des pièges. Maîtrise requise.'),
  tool(111, 'Kit de déguisement', 'other', 'Outil spécial'),
  tool(112, 'Kit d\'empoisonneur', 'other', 'Outil spécial'),
  tool(113, 'Kit de guérisseur', 'other', 'Outil spécial'),
  tool(114, 'Matériel de navigation', 'other', 'Outil spécial'),
  tool(115, 'Véhicules (terrestres)', 'other', 'Véhicule'),
  tool(116, 'Véhicules (maritimes)', 'other', 'Véhicule'),
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

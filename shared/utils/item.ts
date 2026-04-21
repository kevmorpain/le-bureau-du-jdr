import { z } from 'zod'

// ─── Weapon schemas ────────────────────────────────────────────────────────────

export const weaponPropertySchema = z.enum([
  'finesse', 'light', 'heavy', 'two_handed', 'thrown',
  'reach', 'loading', 'ammunition', 'versatile',
])

export const weaponCategorySchema = z.enum([
  'simple_melee', 'simple_ranged', 'martial_melee', 'martial_ranged',
])

export const weaponPropertiesSchema = z.object({
  damage_dice: z.string().min(1).max(10),
  damage_type: z.string().min(1),
  weapon_category: weaponCategorySchema,
  weapon_properties: z.array(weaponPropertySchema),
  range: z.object({ normal: z.number(), long: z.number() }).optional(),
  versatile_damage: z.string().optional(),
})

// ─── Armor schemas ─────────────────────────────────────────────────────────────

export const armorTypeSchema = z.enum(['light', 'medium', 'heavy', 'shield'])

export const armorPropertiesSchema = z.object({
  armor_type: armorTypeSchema,
  base_ac: z.number().int().min(1).max(20),
  dex_limit: z.number().int().min(0).max(10).nullable(),
  strength_requirement: z.number().int().min(1).optional(),
  stealth_disadvantage: z.boolean(),
})

// ─── Equipment / Tool schemas ──────────────────────────────────────────────────

export const equipmentPropertiesSchema = z.object({
  category: z.string().min(1),
})

export const toolTypeSchema = z.enum(['artisan', 'gaming', 'musical', 'other'])

export const toolPropertiesSchema = z.object({
  tool_type: toolTypeSchema,
  category: z.string().min(1),
})

// ─── Item type discriminator ───────────────────────────────────────────────────

export const itemTypeSchema = z.enum(['weapon', 'armor', 'equipment', 'tool'])

const itemPropertiesSchema = z.discriminatedUnion('__type', [
  weaponPropertiesSchema.extend({ __type: z.literal('weapon') }),
  armorPropertiesSchema.extend({ __type: z.literal('armor') }),
  equipmentPropertiesSchema.extend({ __type: z.literal('equipment') }),
  toolPropertiesSchema.extend({ __type: z.literal('tool') }),
]).or(
  // Allow plain objects without __type discriminator (for DB-stored objects)
  z.union([weaponPropertiesSchema, armorPropertiesSchema, equipmentPropertiesSchema, toolPropertiesSchema]),
)

export const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  itemType: itemTypeSchema,
  properties: itemPropertiesSchema,
  description: z.string().max(1000).optional(),
})

// ─── Inventory entry schemas ───────────────────────────────────────────────────

export const createInventoryEntrySchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
  equipped: z.boolean().default(false),
  magicBonus: z.number().int().min(0).max(3).default(0),
  magicEffects: z.array(z.any()).optional(),
  notes: z.string().max(500).optional(),
})

export const updateInventoryEntrySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  equipped: z.boolean().optional(),
  magicBonus: z.number().int().min(0).max(3).optional(),
  magicEffects: z.array(z.any()).optional(),
  notes: z.string().max(500).optional(),
})

// ─── Proficiency override schemas ─────────────────────────────────────────────

export const proficiencyOverrideSchema = z.object({
  proficiencyType: z.enum(['weapon', 'armor', 'language', 'tool']),
  value: z.string().min(1),
  action: z.enum(['grant', 'revoke']),
})

// ─── Labels ───────────────────────────────────────────────────────────────────

export const weaponCategoryLabels: Record<string, string> = {
  simple_melee: 'Arme simple de mêlée',
  simple_ranged: 'Arme simple à distance',
  martial_melee: 'Arme de guerre de mêlée',
  martial_ranged: 'Arme de guerre à distance',
}

export const weaponPropertyLabels: Record<string, string> = {
  finesse: 'finesse',
  light: 'légère',
  heavy: 'lourde',
  two_handed: 'à deux mains',
  thrown: 'de lancer',
  reach: 'allonge',
  loading: 'chargement',
  ammunition: 'munitions',
  versatile: 'polyvalente',
}

export const armorTypeLabels: Record<string, string> = {
  light: 'Armure légère',
  medium: 'Armure intermédiaire',
  heavy: 'Armure lourde',
  shield: 'Bouclier',
}

export const toolTypeLabels: Record<string, string> = {
  artisan: 'Outil d\'artisan',
  gaming: 'Jeu',
  musical: 'Instrument de musique',
  other: 'Outil spécial',
}

export const languageLabels: Record<string, string> = {
  common: 'Commun',
  elvish: 'Elfique',
  dwarvish: 'Nain',
  halfling: 'Halfelin',
  gnomish: 'Gnome',
  orcish: 'Orque',
  draconic: 'Draconique',
  abyssal: 'Abyssal',
  celestial: 'Céleste',
  infernal: 'Infernal',
  giant: 'Géant',
  goblin: 'Gobelin',
  sylvan: 'Sylvain',
  undercommon: 'Langue des profondeurs',
  primordial: 'Primordial',
  deep_speech: 'Langage des profondeurs',
}

import { z } from 'zod'
import { KN_DAMAGE_TYPES } from './catalog/damageTypes'
import { knMagicSchema } from './magicSchema'
import { KN_WEAPON_SKILL_KEYS } from './skills'
import { boundedInt } from './zodHelpers'

export const KN_ITEM_KINDS = [
  'weapon',
  'shield',
  'helmet',
  'torso',
  'vambraces',
  'greaves',
  'belt',
  'gloves',
  'boots',
  'ring',
  'backpack',
  'pouch',
  'gear',
  'potion',
  'fragment',
  'gems',
] as const

export type KnItemKind = (typeof KN_ITEM_KINDS)[number]

// `bulk` : des pièces, comptées par centaine (gemmes) ; les autres valent un emplacement de sac, ou davantage.
export const KN_ITEM_WEIGHTS = ['none', 'light', 'normal', 'heavy', 'bulk'] as const

export type KnItemWeight = (typeof KN_ITEM_WEIGHTS)[number]

// Où l'objet se trouve : dans le sac, dans un emplacement rapide de la Ceinture, ou porté sur le corps.
export const KN_ITEM_PLACES = [
  'bag',
  'quick',
  'mainHand',
  'offHand',
  'belt',
  'head',
  'armor',
  'gloves',
  'boots',
  'ring',
  'backpack',
  'pouch',
] as const

export type KnItemPlace = (typeof KN_ITEM_PLACES)[number]

export const KN_WEAPON_TRAITS = ['defensive', 'quick', 'parrying', 'powerful', 'simple', 'twoHanded', 'versatile'] as const

export type KnWeaponTrait = (typeof KN_WEAPON_TRAITS)[number]

// La chaîne des dés d'Intégrité d'une armure ou d'un bouclier.
export const KN_INTEGRITY_DICE = [4, 6, 8, 10, 12] as const

export const knIntegrityDieSchema = z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)])

export type KnIntegrityDie = z.infer<typeof knIntegrityDieSchema>

// Un cran de moins sur la chaîne des dés d'Intégrité (D4 est le dernier).
export const knIntegrityDown = (die: KnIntegrityDie): KnIntegrityDie => KN_INTEGRITY_DICE[Math.max(0, KN_INTEGRITY_DICE.indexOf(die) - 1)]!

export const knWeaponStatsSchema = z.object({
  skill: z.enum(KN_WEAPON_SKILL_KEYS),
  speed: boundedInt({ min: 0, max: 20 }),
  damageType: z.enum(KN_DAMAGE_TYPES),
  traits: z.array(z.enum(KN_WEAPON_TRAITS)).max(KN_WEAPON_TRAITS.length),
})

export const KN_BASE_CARRY_SLOTS = 10
export const KN_BACKPACK_SLOTS = 20
export const KN_POUCH_SLOTS = 5
export const KN_QUICK_SLOTS = 4
export const KN_LIGHT_PER_SLOT = 10
export const KN_BULK_PER_SLOT = 100
export const KN_MAX_ITEMS = 120

// Les places du corps : les types d'objet qu'elles reçoivent, leur capacité, et si elle vaut par type (une armure se compose
// d'un torse, de vambraces et de jambières, qui n'occupent qu'un seul emplacement).
const BODY_PLACES = {
  mainHand: { kinds: ['weapon'], max: 1, perKind: false },
  offHand: { kinds: ['weapon', 'shield'], max: 1, perKind: false },
  belt: { kinds: ['belt'], max: 1, perKind: false },
  head: { kinds: ['helmet'], max: 1, perKind: false },
  armor: { kinds: ['torso', 'vambraces', 'greaves'], max: 1, perKind: true },
  gloves: { kinds: ['gloves'], max: 1, perKind: false },
  boots: { kinds: ['boots'], max: 1, perKind: false },
  ring: { kinds: ['ring'], max: 2, perKind: false },
  backpack: { kinds: ['backpack'], max: 1, perKind: false },
  pouch: { kinds: ['pouch'], max: 3, perKind: false },
} as const satisfies Record<string, { kinds: readonly KnItemKind[], max: number, perKind: boolean }>

export type KnBodyPlace = keyof typeof BODY_PLACES

export const KN_BODY_PLACES = Object.keys(BODY_PLACES) as KnBodyPlace[]

const isBodyPlace = (place: KnItemPlace): place is KnBodyPlace => place in BODY_PLACES

// Un sac à dos ou une pochette ne se range pas dans un emplacement rapide.
const QUICK_KINDS: readonly KnItemKind[] = KN_ITEM_KINDS.filter(kind => kind !== 'backpack' && kind !== 'pouch')

export const knPlacesFor = (kind: KnItemKind): KnItemPlace[] => [
  'bag',
  ...(QUICK_KINDS.includes(kind) ? ['quick' as const] : []),
  ...KN_BODY_PLACES.filter(place => (BODY_PLACES[place].kinds as readonly KnItemKind[]).includes(kind)),
]

export const knItemSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(100),
  kind: z.enum(KN_ITEM_KINDS),
  weight: z.enum(KN_ITEM_WEIGHTS),
  quantity: boundedInt({ min: 1, max: 9999 }),
  place: z.enum(KN_ITEM_PLACES),
  // La case de Ceinture (1 à 4) d'un objet rangé dans un emplacement rapide.
  slot: boundedInt({ min: 1, max: KN_QUICK_SLOTS }).optional(),
  // Le prix du catalogue, en pièces.
  value: boundedInt({ min: 0, max: 99999 }).optional(),
  // La clé de l'objet du catalogue dont celui-ci est un exemplaire.
  ref: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/).optional(),
  weapon: knWeaponStatsSchema.optional(),
  // Armure, casque : Armure apportée à la zone qu'ils couvrent.
  protection: boundedInt({ min: 0, max: 9 }).optional(),
  // Bonus à la parade d'un bouclier.
  parry: boundedInt({ min: 0, max: 30 }).optional(),
  // Malus d'agilité (Acrobatie, Esquive, Furtivité) d'une armure, et de Perception d'un casque, en points.
  maneuverability: boundedInt({ min: 0, max: 30 }).optional(),
  perception: boundedInt({ min: 0, max: 30 }).optional(),
  integrity: z.object({ max: knIntegrityDieSchema, current: knIntegrityDieSchema }).optional(),
  magic: knMagicSchema.optional(),
  // D'où vient un fragment ou une potion : la table de butin et le jet, pour relire ses effets dans le contenu. Une potion
  // trouvée n'est identifiée qu'après un test de Médecine ou une gorgée ; son vieillissement se tire alors, une fois.
  consumable: z.object({
    table: z.enum(['fragments', 'potions']),
    roll: boundedInt({ min: 1, max: 100 }),
    identified: z.boolean().optional(),
    aging: boundedInt({ min: 1, max: 20 }).optional(),
  }).optional(),
  note: z.string().trim().max(600).optional(),
})

export type KnItem = z.infer<typeof knItemSchema>

const twoHanded = (item: KnItem) => !!item.weapon?.traits.includes('twoHanded')

const inPlace = (items: readonly KnItem[], place: KnItemPlace) => items.filter(item => item.place === place)

// Les invariants de l'inventaire : ce qui est porté va au bon endroit, une seule fois, en un exemplaire ; les emplacements
// rapides n'existent qu'avec une Ceinture portée ; une arme à deux mains laisse l'autre main libre.
export function knInventoryIssues(items: readonly KnItem[]): string[] {
  const issues: string[] = []
  if (new Set(items.map(item => item.id)).size !== items.length) issues.push('identifiant en double')

  for (const item of items) {
    if (isBodyPlace(item.place)) {
      if (!(BODY_PLACES[item.place].kinds as readonly KnItemKind[]).includes(item.kind)) issues.push(`${item.name} ne se porte pas à cet endroit`)
      if (item.quantity !== 1) issues.push(`${item.name} : un objet porté est unique`)
    }
    if (item.place === 'quick') {
      if (!QUICK_KINDS.includes(item.kind)) issues.push(`${item.name} ne se range pas à la Ceinture`)
      if (item.slot === undefined) issues.push(`${item.name} : case de Ceinture manquante`)
    } else if (item.slot !== undefined) issues.push(`${item.name} : une case de Ceinture sans emplacement rapide`)
  }

  for (const place of KN_BODY_PLACES) {
    const rule = BODY_PLACES[place]
    const worn = inPlace(items, place)
    const over = rule.perKind
      ? (rule.kinds as readonly KnItemKind[]).some(kind => worn.filter(item => item.kind === kind).length > rule.max)
      : worn.length > rule.max
    if (over) issues.push(`trop d'objets à cet endroit : ${place}`)
  }

  const quick = inPlace(items, 'quick')
  if (quick.length && !inPlace(items, 'belt').length) issues.push('des objets rangés à la Ceinture sans Ceinture portée')
  if (new Set(quick.map(item => item.slot)).size !== quick.length) issues.push('deux objets dans la même case de Ceinture')
  const main = inPlace(items, 'mainHand')[0]
  if (main && twoHanded(main) && inPlace(items, 'offHand').length) issues.push('une arme à deux mains occupe les deux mains')
  if (inPlace(items, 'offHand').some(twoHanded)) issues.push('une arme à deux mains se tient dans la main principale')
  return issues
}

export const knInventorySchema = z.array(knItemSchema).max(KN_MAX_ITEMS).superRefine((items, ctx) => {
  for (const message of knInventoryIssues(items)) ctx.addIssue({ code: 'custom', message })
})

export const emptyKnInventory = (): KnItem[] => []

// Un objet qu'on ajoute : dans le sac, sans emplacement rapide.
export function knNewItem(item: Pick<KnItem, 'name' | 'kind' | 'weight'> & Partial<KnItem>, id: string): KnItem {
  return { quantity: 1, ...item, id, place: 'bag' }
}

export const knCarryCapacity = (items: readonly KnItem[], bonus = 0): number =>
  KN_BASE_CARRY_SLOTS
  + (inPlace(items, 'backpack').length ? KN_BACKPACK_SLOTS : 0)
  + KN_POUCH_SLOTS * inPlace(items, 'pouch').length
  + bonus

export const knQuickSlotCount = (items: readonly KnItem[]): number => inPlace(items, 'belt').length ? KN_QUICK_SLOTS : 0

// Les objets du corps : 10 emplacements, 9 avec une arme à deux mains. Les pièces d'armure n'en font qu'un, et l'amulette, qui
// n'est pas dans l'inventaire, en occupe un si elle est portée.
export const KN_BODY_SLOTS = 10

export const knBodySlotMax = (items: readonly KnItem[]): number =>
  inPlace(items, 'mainHand').some(twoHanded) ? KN_BODY_SLOTS - 1 : KN_BODY_SLOTS

export const knBodySlotCount = (items: readonly KnItem[], amuletWorn: boolean): number =>
  items.filter(item => isBodyPlace(item.place) && item.place !== 'backpack' && item.place !== 'pouch').length
  - Math.max(0, inPlace(items, 'armor').length - 1)
  + (amuletWorn ? 1 : 0)

export interface KnEncumbrance {
  used: number
  capacity: number
  over: boolean
  normal: number
  heavy: number
  light: number
  bulk: number
}

// Ce que le survivant porte dans son sac : un emplacement par objet normal, deux par objet lourd, un par dizaine d'objets
// légers (provisions et amulettes non portées comprises), un par centaine de pièces et de gemmes. Ce qui est porté sur le
// corps ou rangé à la Ceinture ne compte pas.
export function knEncumbrance(
  items: readonly KnItem[],
  carried: { provisions: number, coins: number, amulets: number },
  bonus = 0,
): KnEncumbrance {
  const bag = inPlace(items, 'bag')
  const count = (weight: KnItemWeight) => bag.filter(item => item.weight === weight).reduce((sum, item) => sum + item.quantity, 0)
  const normal = count('normal')
  const heavy = count('heavy') * 2
  const light = Math.ceil((count('light') + carried.provisions + carried.amulets) / KN_LIGHT_PER_SLOT)
  const bulk = Math.ceil((count('bulk') + carried.coins) / KN_BULK_PER_SLOT)
  const used = normal + heavy + light + bulk
  const capacity = knCarryCapacity(items, bonus)
  return { used, capacity, over: used > capacity, normal, heavy, light, bulk }
}

export type KnPlaceError = 'wrongKind' | 'noBelt' | 'slotTaken' | 'full' | 'twoHandedOffHand' | 'notUnique'

export type KnPlaceResult = { items: KnItem[] } | { error: KnPlaceError }

const withoutSlot = ({ slot: _slot, ...item }: KnItem): KnItem => item

const toBag = (item: KnItem): KnItem => ({ ...withoutSlot(item), place: 'bag' })

// Les objets rangés à la Ceinture retournent au sac quand la Ceinture n'est plus portée.
const dropQuickIfNoBelt = (items: KnItem[]): KnItem[] =>
  inPlace(items, 'belt').length ? items : items.map(item => item.place === 'quick' ? toBag(item) : item)

// Déplace un objet vers un emplacement. Un emplacement unique déjà pris voit son objet retourner au sac ; une arme à deux
// mains libère l'autre main de la même façon.
export function knPlaceItem(items: readonly KnItem[], id: string, place: KnItemPlace, slot?: number): KnPlaceResult {
  const item = items.find(entry => entry.id === id)
  if (!item) return { items: [...items] }
  if (!knPlacesFor(item.kind).includes(place)) return { error: 'wrongKind' }

  if (place === 'bag') return { items: dropQuickIfNoBelt(items.map(entry => entry.id === id ? toBag(entry) : entry)) }

  if (place === 'quick') {
    if (!inPlace(items, 'belt').length) return { error: 'noBelt' }
    const free = slot ?? Array.from({ length: KN_QUICK_SLOTS }, (_, i) => i + 1).find(n => !items.some(entry => entry.place === 'quick' && entry.slot === n && entry.id !== id))
    if (free === undefined || items.some(entry => entry.place === 'quick' && entry.slot === free && entry.id !== id)) return { error: 'slotTaken' }
    return { items: items.map(entry => entry.id === id ? { ...entry, place, slot: free } : entry) }
  }

  if (item.quantity !== 1) return { error: 'notUnique' }
  const rule = BODY_PLACES[place]
  const others = items.filter(entry => entry.id !== id)
  const sameSlot = others.filter(entry => entry.place === place && (!rule.perKind || entry.kind === item.kind))
  if (rule.max > 1 && sameSlot.length >= rule.max) return { error: 'full' }

  const displaced = new Set(rule.max === 1 ? sameSlot.map(entry => entry.id) : [])
  if (place === 'mainHand' && twoHanded(item)) others.filter(entry => entry.place === 'offHand').forEach(entry => displaced.add(entry.id))
  if (place === 'offHand') {
    if (twoHanded(item)) return { error: 'twoHandedOffHand' }
    const main = others.find(entry => entry.place === 'mainHand')
    if (main && twoHanded(main)) displaced.add(main.id)
  }

  const next = items.map((entry) => {
    if (entry.id === id) return { ...withoutSlot(entry), place }
    return displaced.has(entry.id) ? toBag(entry) : entry
  })
  return { items: dropQuickIfNoBelt(next) }
}

// Retire un objet de l'inventaire ; sa Ceinture emporte avec elle l'accès aux emplacements rapides.
export function knRemoveItem(items: readonly KnItem[], id: string): KnItem[] {
  return dropQuickIfNoBelt(items.filter(item => item.id !== id))
}

export interface KnBeltCheck {
  items: KnItem[]
  destroyed?: KnItem
}

// Test de Ceinture : un D4 désigne la case, et l'objet qui s'y trouve est détruit.
export function knBeltCheck(items: readonly KnItem[], roll: number): KnBeltCheck {
  const hit = items.find(item => item.place === 'quick' && item.slot === roll)
  return hit ? { items: items.filter(item => item.id !== hit.id), destroyed: hit } : { items: [...items] }
}

// Un identifiant libre pour un objet qui arrive.
export function knNextItemId(items: readonly KnItem[]): string {
  const taken = new Set(items.map(item => item.id))
  let n = 1
  while (taken.has(`i${n}`)) n++
  return `i${n}`
}

// L'encombrement habituel d'un type d'objet, proposé à l'ajout.
export const knDefaultWeight = (kind: KnItemKind): KnItemWeight => {
  if (kind === 'potion' || kind === 'fragment' || kind === 'ring') return 'light'
  if (kind === 'gems') return 'bulk'
  return 'normal'
}

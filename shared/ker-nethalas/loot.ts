import { z } from 'zod'
import { KN_PROVISION_BOUNDS, type KnProvisions } from './camp'
import { knRollDice } from './dice'
import { knUseSchema } from './consumables'
import { knDiceSchema } from './diceSchema'
import { KN_MAX_ITEMS, knDefaultWeight, knNextItemId, type KnItem, type KnItemKind } from './inventory'
import { knItemFromCatalog, type KnCatalogItem } from './items'
import { KN_MAGIC_TYPE_DIE, knMagicTypeAt, type KnMagicType } from './magic'
import type { KnMagicTable } from './magicSchema'
import { knRollDie, type KnRng } from './run'
import { knCheckCoverage } from './zodHelpers'

// Les tables de butin du livre et leur dé.
export const KN_LOOT_TABLES = {
  spoils: 6,
  mundane: 100,
  valuable: 20,
  precious: 20,
  gems: 20,
  fragments: 20,
  potions: 20,
  resources: 10,
  weapons: 100,
  armor: 10,
  torso: 100,
  vambraces: 100,
  greaves: 100,
  helmets: 100,
  shields: 100,
  masteries: 20,
} as const

export type KnLootTableKey = keyof typeof KN_LOOT_TABLES

export const KN_LOOT_TABLE_KEYS = Object.keys(KN_LOOT_TABLES) as [KnLootTableKey, ...KnLootTableKey[]]

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

// Ce qu'un résultat donne : une autre table à tirer, un objet du catalogue (ou des provisions), une gemme, un fragment, une
// potion, un objet magique ou une Relique à générer, une Maîtrise (amulette), ou rien.
export const knLootDropSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('table'), table: z.enum(KN_LOOT_TABLE_KEYS) }),
  z.object({ kind: z.literal('item'), ref: slug, count: knDiceSchema.optional() }),
  z.object({ kind: z.literal('gem'), value: knDiceSchema }),
  z.object({ kind: z.literal('fragment') }),
  z.object({ kind: z.literal('potion') }),
  z.object({ kind: z.literal('magic'), item: z.enum(['weapon', 'armor']).optional() }),
  z.object({ kind: z.literal('relic') }),
  z.object({ kind: z.literal('mastery'), key: slug }),
  z.object({ kind: z.literal('nothing') }),
])

export type KnLootDrop = z.infer<typeof knLootDropSchema>

export const knLootEntrySchema = z.object({
  min: z.number().int().min(1).max(100),
  max: z.number().int().min(1).max(100),
  // Le nom de ce qu'on trouve (Antidote, Précieux…) quand le texte est une description.
  title: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(600),
  drop: knLootDropSchema,
  // Ce que fait un fragment ou une potion quand on l'emploie.
  use: knUseSchema.optional(),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

export type KnLootEntry = z.infer<typeof knLootEntrySchema>

export const knLootTableSchema = (die: number) => z.object({
  die: z.literal(die),
  entries: z.array(knLootEntrySchema).min(1).max(die),
}).superRefine((table, ctx) => knCheckCoverage(table.entries, die, ctx))

export interface KnLootTable {
  die: number
  entries: KnLootEntry[]
}

// Tout le butin d'un seul jeu de données : une table par clé, certaines pouvant manquer tant qu'elles ne sont pas écrites.
export const knLootContentSchema = z.object(
  Object.fromEntries(KN_LOOT_TABLE_KEYS.map(key => [key, knLootTableSchema(KN_LOOT_TABLES[key]).optional()])) as Record<KnLootTableKey, z.ZodOptional<ReturnType<typeof knLootTableSchema>>>,
)

export type KnLootContent = Partial<Record<KnLootTableKey, KnLootTable>>

export interface KnLootStep {
  table: KnLootTableKey
  die: number
  roll: number
  text: string
  title?: string
}

export type KnLootFinal = Exclude<KnLootDrop, { kind: 'table' }>

export interface KnLootResult {
  steps: KnLootStep[]
  drop: KnLootFinal
  // Le nombre tiré pour un objet « D4 Fournitures » (au moins 1), la valeur d'une gemme.
  count: number
  value: number
  // Un objet magique : son type (D8), et pour une arme ou une armure l'objet ordinaire dont il est la version enchantée.
  magic?: { type: KnMagicType, baseRef?: string }
}

const MAX_CHAIN = 6

export const knLootEntryAt = (table: KnLootTable | undefined, roll: number): KnLootEntry | undefined =>
  table?.entries.find(entry => roll >= entry.min && roll <= entry.max)

// Le résultat de la table de butin dont un fragment ou une potion est issu : c'est là que se relisent ses effets.
export const knConsumableEntry = (content: KnLootContent | null, item: Pick<KnItem, 'consumable'>): KnLootEntry | undefined =>
  item.consumable && content ? knLootEntryAt(content[item.consumable.table], item.consumable.roll) : undefined

function rollChain(content: KnLootContent, start: KnLootTableKey, rng: KnRng): KnLootResult | { missing: KnLootTableKey } {
  const steps: KnLootStep[] = []
  let key = start
  for (let depth = 0; depth < MAX_CHAIN; depth++) {
    const table = content[key]
    if (!table) return { missing: key }
    const roll = knRollDie(table.die, rng)
    const entry = knLootEntryAt(table, roll)
    if (!entry) return { missing: key }
    steps.push({ table: key, die: table.die, roll, text: entry.text, ...(entry.title ? { title: entry.title } : {}) })
    const { drop } = entry
    if (drop.kind === 'table') {
      key = drop.table
      continue
    }
    const count = drop.kind === 'item' && drop.count ? Math.max(1, knRollDice(drop.count, rng).total) : 1
    const value = drop.kind === 'gem' ? knRollDice(drop.value, rng).total : 0
    return { steps, drop, count, value }
  }
  return { missing: key }
}

const MAGIC_BASE_TABLES = { weapon: 'weapons', armor: 'armor' } as const satisfies Record<string, KnLootTableKey>

// L'objet ordinaire dont un objet magique est la version enchantée : on tire sur la table des armes ou des armures aléatoires, et on
// relance tant qu'elle redonne un objet magique.
function rollMagicBase(content: KnLootContent, type: 'weapon' | 'armor', rng: KnRng): string | undefined {
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = rollChain(content, MAGIC_BASE_TABLES[type], rng)
    if ('missing' in result) return undefined
    if (result.drop.kind === 'item') return result.drop.ref
  }
  return undefined
}

// Tire sur une table, puis sur celles qu'elle désigne, jusqu'à ce qu'un résultat donne quelque chose. Si une table de la chaîne
// n'est pas chargée, rend celle qui manque. Un objet magique tire en plus son type.
export function knRollLoot(content: KnLootContent, start: KnLootTableKey, rng: KnRng = Math.random): KnLootResult | { missing: KnLootTableKey } {
  const result = rollChain(content, start, rng)
  if ('missing' in result || result.drop.kind !== 'magic') return result
  const type = result.drop.item ?? knMagicTypeAt(knRollDie(KN_MAGIC_TYPE_DIE, rng))
  const baseRef = type === 'weapon' || type === 'armor' ? rollMagicBase(content, type, rng) : undefined
  return { ...result, magic: { type, ...(baseRef ? { baseRef } : {}) } }
}

// L'armure d'un kit de départ : on tire sur la table des armures aléatoires, et on relance tant que le résultat n'est pas une pièce
// du catalogue (une armure magique ne convient pas à un survivant qui commence).
export function knRollStartingArmor(content: KnLootContent, rng: KnRng = Math.random): string | undefined {
  for (let attempt = 0; attempt < 20; attempt++) {
    const result = rollChain(content, 'armor', rng)
    if ('missing' in result) return undefined
    if (result.drop.kind === 'item') return result.drop.ref
  }
  return undefined
}

export interface KnLootState {
  inventory: KnItem[]
  provisions: KnProvisions
}

export interface KnLootApplied {
  state: KnLootState
  // Ce qui s'est ajouté, en une phrase par ligne.
  lines: string[]
  // Une amulette : elle n'entre pas dans l'inventaire, c'est une Maîtrise à tirer.
  amulet?: boolean
}

const MAGIC_PLACEHOLDERS: Record<KnMagicTable, { name: string, kind: KnItemKind }> = {
  weapon: { name: 'Arme magique', kind: 'gear' },
  armor: { name: 'Armure magique', kind: 'gear' },
  belt: { name: 'Ceinture', kind: 'belt' },
  boots: { name: 'Bottes', kind: 'boots' },
  gloves: { name: 'Gants', kind: 'gloves' },
  ring: { name: 'Anneau', kind: 'ring' },
}

const label = (result: KnLootResult) => {
  const last = result.steps[result.steps.length - 1]!
  return last.title ?? last.text
}

const addItem = (state: KnLootState, item: Omit<KnItem, 'id'>): KnLootApplied | undefined => {
  if (state.inventory.length >= KN_MAX_ITEMS) return undefined
  return { state: { ...state, inventory: [...state.inventory, { ...item, id: knNextItemId(state.inventory) }] }, lines: [item.name] }
}

// Ajoute à l'inventaire ou aux provisions ce que le tirage a donné. Un objet du catalogue arrive « trouvé » (Intégrité d'un cran en
// moins) ; les objets magiques et les Reliques arrivent non identifiés, à générer plus tard.
export function knApplyLoot(state: KnLootState, result: KnLootResult, catalog: readonly KnCatalogItem[]): KnLootApplied {
  const { drop } = result
  if (drop.kind === 'nothing' || drop.kind === 'mastery') return { state, lines: [] }

  if (drop.kind === 'item') {
    const entry = catalog.find(candidate => candidate.key === drop.ref)
    if (!entry) return { state, lines: [`${label(result)} : objet absent du catalogue`] }
    if (entry.provision) {
      const next = Math.min(KN_PROVISION_BOUNDS.max, state.provisions[entry.provision] + result.count)
      return { state: { ...state, provisions: { ...state.provisions, [entry.provision]: next } }, lines: [`${result.count} × ${entry.name}`] }
    }
    let next = state
    const lines: string[] = []
    for (let i = 0; i < result.count; i++) {
      const item = knItemFromCatalog(entry, 'x', { found: true })
      const added = addItem(next, item)
      if (!added) return { state: next, lines: [...lines, 'inventaire plein'] }
      next = added.state
      lines.push(entry.name)
    }
    return { state: next, lines }
  }

  const base = { quantity: 1, place: 'bag' as const }
  if (drop.kind === 'gem') {
    return addItem(state, { ...base, name: `Gemme : ${label(result)}`, kind: 'gems', weight: 'bulk', value: result.value }) ?? { state, lines: ['inventaire plein'] }
  }
  if (drop.kind === 'fragment' || drop.kind === 'potion') {
    const last = result.steps[result.steps.length - 1]!
    const consumable = last.table === 'fragments' || last.table === 'potions' ? { table: last.table, roll: last.roll } : undefined
    const item = drop.kind === 'fragment'
      ? { ...base, name: `Fragment${last.title ? ` : ${last.title}` : ''}`, kind: 'fragment' as const, weight: 'light' as const, note: last.text.slice(0, 600) }
      : { ...base, name: 'Potion non identifiée', kind: 'potion' as const, weight: 'light' as const, note: 'Un test de Médecine l\'identifie ; sinon, il ne reste qu\'à la boire.' }
    return addItem(state, { ...item, ...(consumable ? { consumable: drop.kind === 'potion' ? { ...consumable, identified: false } : consumable } : {}) }) ?? { state, lines: ['inventaire plein'] }
  }
  if (drop.kind === 'magic' && result.magic) {
    const { type, baseRef } = result.magic
    if (type === 'amulet') return { state, lines: [], amulet: true }
    const entry = baseRef ? catalog.find(candidate => candidate.key === baseRef && !candidate.provision) : undefined
    const placeholder = MAGIC_PLACEHOLDERS[type]
    const ordinary: Omit<KnItem, 'id'> = entry
      ? omitId(knItemFromCatalog(entry, 'x', { found: true }))
      : { ...base, name: placeholder.name, kind: placeholder.kind, weight: knDefaultWeight(placeholder.kind) }
    const added = addItem(state, { ...ordinary, magic: { table: type, identified: false, properties: [], peculiarities: [] } })
    return added ? { ...added, lines: [`${ordinary.name} (objet magique à harmoniser)`] } : { state, lines: ['inventaire plein'] }
  }
  const name = drop.kind === 'relic' ? 'Relique à identifier' : 'Objet magique à identifier'
  return addItem(state, { ...base, name, kind: 'gear', weight: 'normal' }) ?? { state, lines: ['inventaire plein'] }
}

const omitId = ({ id: _id, ...item }: KnItem): Omit<KnItem, 'id'> => item

import type { ItemType, WeaponCategory, ToolType } from '~~/server/db/schema/items'

export type ItemSelector
  = | { weapon: readonly WeaponCategory[] }
    | { tool: ToolType, except?: readonly string[] }
    | { category: string }

export type StackRef = { item: string, quantity?: number, itemType?: ItemType }

export type EquipmentRef
  = | StackRef
    | { pick: ItemSelector }
    | { pack: PackKey }
    | { po: number }

export interface EquipmentOption {
  refs: EquipmentRef[]
  label?: string
}

// Un groupe fixe est un groupe à une seule option : le reste du code ne distingue pas les deux.
export type EquipmentGroup = { fixed: EquipmentRef[] } | { options: EquipmentOption[] }

// Groupes par origine (`class:barbarian`, `background:acolyte`) : la clé préfixe les choix, qui ne survivent
// donc pas à un changement de classe ou d'historique, et reviennent si l'on y revient.
export type EquipmentSources = Record<string, EquipmentGroup[]>

export interface EquipmentSelection {
  options: Record<string, number>
  picks: Record<string, string>
}

export interface EquipmentLine {
  name: string
  quantity: number
  itemType?: ItemType
}

export interface PickSlot {
  key: string
  selector: ItemSelector
}

export interface ExpandedEquipment {
  lines: EquipmentLine[]
  po: number
  missingPicks: PickSlot[]
}

export interface CatalogItem {
  id: number
  name: string
  itemType: ItemType
  properties: unknown
  isCustom: boolean
}

export const EQUIPMENT_PACKS = {
  artist: {
    name: 'Sac d\'artiste',
    items: [
      { item: 'Sac à dos' }, { item: 'Sac de couchage' }, { item: 'Vêtements, costume', quantity: 2 }, { item: 'Bougie', quantity: 5 },
      { item: 'Rations (1 jour)', quantity: 5 }, { item: 'Gourde (pleine)' }, { item: 'Kit de déguisement' },
    ],
  },
  burglar: {
    name: 'Sac de cambrioleur',
    items: [
      { item: 'Sac à dos' }, { item: 'Billes (sac de 1000)' }, { item: 'Chaîne (3 m)' }, { item: 'Cloche' }, { item: 'Bougie', quantity: 5 },
      { item: 'Pied-de-biche' }, { item: 'Marteau' }, { item: 'Piton', quantity: 10 }, { item: 'Lanterne à capote' },
      { item: 'Huile (flasque)', quantity: 2 }, { item: 'Rations (1 jour)', quantity: 5 }, { item: 'Boite d\'allume-feu' },
      { item: 'Gourde (pleine)' }, { item: 'Corde en chanvre (15 m)' },
    ],
  },
  diplomat: {
    name: 'Sac de diplomate',
    items: [
      { item: 'Coffre' }, { item: 'Étui à cartes ou parchemins', quantity: 2 }, { item: 'Vêtements, fins' }, { item: 'Encre (bouteille de 30 ml)' },
      { item: 'Plume d\'écriture' }, { item: 'Lampe' }, { item: 'Huile (flasque)', quantity: 2 }, { item: 'Papier (une feuille)', quantity: 5 },
      { item: 'Parfum (fiole)' }, { item: 'Cire à cacheter' }, { item: 'Savon' },
    ],
  },
  priest: {
    name: 'Sac d\'ecclésiastique',
    items: [
      { item: 'Sac à dos' }, { item: 'Couverture' }, { item: 'Bougie', quantity: 10 }, { item: 'Boite d\'allume-feu' },
      { item: 'Boîte pour l\'aumône' }, { item: 'Bâtonnet d\'encens', quantity: 2 }, { item: 'Encensoir' }, { item: 'Habits de cérémonie' },
      { item: 'Rations (1 jour)', quantity: 2 }, { item: 'Gourde (pleine)' },
    ],
  },
  scholar: {
    name: 'Sac d\'érudit',
    items: [
      { item: 'Sac à dos' }, { item: 'Livre' }, { item: 'Encre (bouteille de 30 ml)' }, { item: 'Plume d\'écriture' },
      { item: 'Parchemin (une feuille)', quantity: 10 }, { item: 'Petit sac de sable' }, { item: 'Petit couteau' },
    ],
  },
  explorer: {
    name: 'Sac d\'explorateur',
    items: [
      { item: 'Sac à dos' }, { item: 'Sac de couchage' }, { item: 'Gamelle' }, { item: 'Boite d\'allume-feu' }, { item: 'Torche', quantity: 10 },
      { item: 'Rations (1 jour)', quantity: 10 }, { item: 'Gourde (pleine)' }, { item: 'Corde en chanvre (15 m)' },
    ],
  },
  dungeoneer: {
    name: 'Sac d\'exploration souterraine',
    items: [
      { item: 'Sac à dos' }, { item: 'Pied-de-biche' }, { item: 'Marteau' }, { item: 'Piton', quantity: 10 }, { item: 'Torche', quantity: 10 },
      { item: 'Boite d\'allume-feu' }, { item: 'Rations (1 jour)', quantity: 10 }, { item: 'Gourde (pleine)' }, { item: 'Corde en chanvre (15 m)' },
    ],
  },
} as const satisfies Record<string, { name: string, items: readonly StackRef[] }>

export type PackKey = keyof typeof EQUIPMENT_PACKS

export const SIMPLE_WEAPON: ItemSelector = { weapon: ['simple_melee', 'simple_ranged'] }
export const SIMPLE_MELEE_WEAPON: ItemSelector = { weapon: ['simple_melee'] }
export const MARTIAL_WEAPON: ItemSelector = { weapon: ['martial_melee', 'martial_ranged'] }
export const MARTIAL_MELEE_WEAPON: ItemSelector = { weapon: ['martial_melee'] }
export const ARTISAN_TOOL: ItemSelector = { tool: 'artisan' }
export const MUSICAL_INSTRUMENT: ItemSelector = { tool: 'musical' }
export const ARCANE_FOCUS: ItemSelector = { category: 'Focaliseur arcanique' }
export const DRUIDIC_FOCUS: ItemSelector = { category: 'Focaliseur druidique' }
export const HOLY_SYMBOL: ItemSelector = { category: 'Symbole sacré' }
export const CON_TOOL: ItemSelector = { category: 'Outils d\'escroquerie' }

const WEAPON_SELECTOR_LABELS: Record<string, string> = {
  'simple_melee,simple_ranged': 'Arme courante',
  'simple_melee': 'Arme courante de corps à corps',
  'martial_melee,martial_ranged': 'Arme de guerre',
  'martial_melee': 'Arme de guerre de corps à corps',
}

const TOOL_SELECTOR_LABELS: Record<ToolType, string> = {
  artisan: 'Outils d\'artisan',
  musical: 'Instrument de musique',
  gaming: 'Jeu',
  other: 'Outil',
}

export function selectorLabel(selector: ItemSelector): string {
  if ('weapon' in selector) return WEAPON_SELECTOR_LABELS[[...selector.weapon].sort().join(',')] ?? 'Arme'
  if ('tool' in selector) return TOOL_SELECTOR_LABELS[selector.tool]
  return selector.category
}

export function refLabel(ref: EquipmentRef): string {
  if ('item' in ref) return (ref.quantity ?? 1) > 1 ? `${ref.item} ×${ref.quantity}` : ref.item
  if ('pick' in ref) return selectorLabel(ref.pick)
  if ('pack' in ref) return EQUIPMENT_PACKS[ref.pack].name
  return `${ref.po} po`
}

export function optionLabel(option: EquipmentOption): string {
  if (option.label) return option.label
  const counts = new Map<string, number>()
  for (const ref of option.refs) counts.set(refLabel(ref), (counts.get(refLabel(ref)) ?? 0) + 1)
  return [...counts].map(([label, n]) => (n > 1 ? `${label} ×${n}` : label)).join(' + ')
}

export function groupOptions(group: EquipmentGroup): EquipmentOption[] {
  return 'options' in group ? group.options : [{ refs: group.fixed }]
}

export const groupKey = (source: string, group: number) => `${source}:${group}`
export const pickKey = (source: string, group: number, option: number, ref: number) => `${source}:${group}:${option}:${ref}`

export function chosenOptionIndex(group: EquipmentGroup, selection: EquipmentSelection, source: string, groupIndex: number): number {
  const wanted = selection.options[groupKey(source, groupIndex)] ?? 0
  return wanted >= 0 && wanted < groupOptions(group).length ? wanted : 0
}

function selectorMatches(selector: ItemSelector, item: CatalogItem): boolean {
  const props = item.properties as { weapon_category?: WeaponCategory, tool_type?: ToolType, category?: string }
  if ('weapon' in selector) return item.itemType === 'weapon' && !!props.weapon_category && selector.weapon.includes(props.weapon_category)
  if ('tool' in selector) return item.itemType === 'tool' && props.tool_type === selector.tool && !selector.except?.includes(item.name)
  return item.itemType === 'equipment' && props.category === selector.category
}

export function candidatesFor(selector: ItemSelector, items: readonly CatalogItem[]): CatalogItem[] {
  return items
    .filter(item => !item.isCustom && selectorMatches(selector, item))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export const emptySelection = (): EquipmentSelection => ({ options: {}, picks: {} })

export function expandEquipment(sources: EquipmentSources, selection: EquipmentSelection): ExpandedEquipment {
  const merged = new Map<string, EquipmentLine>()
  const add = (name: string, quantity: number, itemType?: ItemType) => {
    const key = `${name}|${itemType ?? ''}`
    const line = merged.get(key)
    if (line) line.quantity += quantity
    else merged.set(key, { name, quantity, ...(itemType ? { itemType } : {}) })
  }

  let po = 0
  const missingPicks: PickSlot[] = []

  for (const [source, groups] of Object.entries(sources)) {
    groups.forEach((group, g) => {
      const o = chosenOptionIndex(group, selection, source, g)
      groupOptions(group)[o]!.refs.forEach((ref, r) => {
        if ('item' in ref) add(ref.item, ref.quantity ?? 1, ref.itemType)
        else if ('pack' in ref) EQUIPMENT_PACKS[ref.pack].items.forEach(it => add(it.item, 'quantity' in it ? it.quantity : 1))
        else if ('po' in ref) po += ref.po
        else {
          const key = pickKey(source, g, o, r)
          const picked = selection.picks[key]
          if (picked) add(picked, 1)
          else missingPicks.push({ key, selector: ref.pick })
        }
      })
    })
  }

  return { lines: [...merged.values()], po, missingPicks }
}

export function resolveLines(lines: readonly EquipmentLine[], items: readonly CatalogItem[]): { entries: { itemId: number, quantity: number }[], unresolved: string[] } {
  const entries: { itemId: number, quantity: number }[] = []
  const unresolved: string[] = []
  for (const line of lines) {
    const found = items.find(it => !it.isCustom && it.name === line.name && (!line.itemType || it.itemType === line.itemType))
    if (found) entries.push({ itemId: found.id, quantity: line.quantity })
    else unresolved.push(line.name)
  }
  return { entries, unresolved }
}

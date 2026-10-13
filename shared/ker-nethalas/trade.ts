import { KN_PROVISION_BOUNDS, type KnProvisions } from './camp'
import { KN_BOUNDS } from './character'
import { KN_MAX_ITEMS, knNextItemId, type KnItem } from './inventory'
import { knItemFromCatalog, type KnCatalogItem } from './items'

export interface KnTradeState {
  coins: number
  inventory: KnItem[]
  provisions: KnProvisions
}

export type KnTradeError = 'coins' | 'full' | 'unknown' | 'stock'

export type KnTradeResult = { state: KnTradeState } | { error: KnTradeError }

// Un marchand rachète à la moitié du prix, arrondie à l'inférieur ; les gemmes et bijoux se vendent à leur valeur entière.
export const knSellPrice = (item: Pick<KnItem, 'kind' | 'value' | 'quantity'>): number => {
  const unit = item.value ?? 0
  return item.kind === 'gems' ? unit * item.quantity : Math.floor(unit / 2) * item.quantity
}

export const knUnitSellPrice = (entry: Pick<KnCatalogItem, 'value'>): number => Math.floor(entry.value / 2)

const gain = (coins: number, amount: number) => Math.min(KN_BOUNDS.coins.max, coins + amount)

// Acheter `count` exemplaires d'un objet du catalogue : une provision s'ajoute aux provisions, le reste à l'inventaire.
export function knBuy(state: KnTradeState, entry: KnCatalogItem, count = 1): KnTradeResult {
  const price = entry.value * count
  if (price > state.coins) return { error: 'coins' }
  if (entry.provision) {
    const owned = state.provisions[entry.provision]
    if (owned + count > KN_PROVISION_BOUNDS.max) return { error: 'full' }
    return { state: { ...state, coins: state.coins - price, provisions: { ...state.provisions, [entry.provision]: owned + count } } }
  }
  if (state.inventory.length + count > KN_MAX_ITEMS) return { error: 'full' }
  let inventory = state.inventory
  for (let i = 0; i < count; i++) inventory = [...inventory, knItemFromCatalog(entry, knNextItemId(inventory))]
  return { state: { ...state, coins: state.coins - price, inventory } }
}

export function knSell(state: KnTradeState, id: string): KnTradeResult {
  const item = state.inventory.find(entry => entry.id === id)
  if (!item) return { error: 'unknown' }
  return { state: { ...state, coins: gain(state.coins, knSellPrice(item)), inventory: state.inventory.filter(entry => entry.id !== id) } }
}

export function knSellProvision(state: KnTradeState, entry: KnCatalogItem, count = 1): KnTradeResult {
  if (!entry.provision) return { error: 'unknown' }
  if (state.provisions[entry.provision] < count) return { error: 'stock' }
  return {
    state: {
      ...state,
      coins: gain(state.coins, knUnitSellPrice(entry) * count),
      provisions: { ...state.provisions, [entry.provision]: state.provisions[entry.provision] - count },
    },
  }
}

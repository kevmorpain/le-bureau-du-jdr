import type { ActionType, RechargeType } from '~~/server/db/schema/features'
import { ACTION_COSTS, featureCostOf, spellCostOf, type ActionCost } from '~~/shared/rules/actionCost'
import { matchesSearch } from '~~/shared/utils/search'

export const PLAY_CARD_KINDS = ['spell', 'feature', 'weapon', 'item'] as const
export type PlayCardKind = typeof PLAY_CARD_KINDS[number]

export const PLAY_CARD_ICONS = {
  spell: 'spell',
  feature: 'feature',
  weapon: 'weapon',
  item: 'item',
} as const satisfies Record<PlayCardKind, string>

// What a card spends when used: a spell slot, a feature's uses, an item's charges or a piece of ammunition.
export type PlayCardResource = 'slot' | 'arcanum' | 'uses' | 'charges' | 'ammunition'

export interface PlayCardUses {
  max: number
  remaining: number
}

export interface PlayCard {
  key: string
  kind: PlayCardKind
  id: number
  name: string
  cost: ActionCost
  resource: PlayCardResource | null
  uses: PlayCardUses | null
  isAvailable: boolean
  spellLevel: number | null
  isConcentration: boolean
  isRitual: boolean
  rechargeType: RechargeType | null
  reach: 'melee' | 'ranged' | null
}

export interface PlayCardSpell {
  spellId: number
  isArcanum: boolean
  hasSlotAvailable: boolean
  arcanumUses: PlayCardUses | null
  spell: { name: string, level: number, castingTime: string, concentration: boolean, ritual: boolean }
}

export interface PlayCardFeature {
  id: number
  name: string
  actionType: ActionType | null
  rechargeType: RechargeType | null
  maxUses: number | null
  currentUses: number
  unlimited?: boolean
}

export interface PlayCardWeapon {
  entryId: number
  name: string
  isRanged: boolean
  ammunition: { available: number } | null
  maxUses: number | null
  currentUses: number
  rechargeType: RechargeType | null
}

export interface PlayCardItem {
  entryId: number
  name: string
  maxUses: number
  currentUses: number
  rechargeType: RechargeType | null
}

const emptyCard = { resource: null, uses: null, spellLevel: null, isConcentration: false, isRitual: false, rechargeType: null, reach: null }

// Stored `currentUses` counts what has been SPENT; a card shows what is left.
const getUses = (max: number | null | undefined, spent: number): PlayCardUses | null =>
  max && max > 0 ? { max, remaining: Math.max(0, max - spent) } : null

export const toSpellCard = ({ spellId, isArcanum, hasSlotAvailable, arcanumUses, spell }: PlayCardSpell): PlayCard => {
  const isCantrip = spell.level === 0
  return {
    ...emptyCard,
    key: `spell-${spellId}`,
    kind: 'spell',
    id: spellId,
    name: spell.name,
    cost: spellCostOf(spell.castingTime),
    resource: isCantrip ? null : isArcanum ? 'arcanum' : 'slot',
    uses: isArcanum ? arcanumUses : null,
    isAvailable: isCantrip || (isArcanum ? (arcanumUses?.remaining ?? 0) > 0 : hasSlotAvailable),
    spellLevel: spell.level,
    isConcentration: spell.concentration,
    isRitual: spell.ritual,
  }
}

// A passive feature (no action, no limited use) has nothing to do during play.
export const isPlayableFeature = (feature: PlayCardFeature): boolean =>
  (feature.actionType !== null && feature.actionType !== 'free') || (feature.maxUses ?? 0) > 0

export const toFeatureCard = (feature: PlayCardFeature): PlayCard => {
  const uses = feature.unlimited ? null : getUses(feature.maxUses, feature.currentUses)
  return {
    ...emptyCard,
    key: `feature-${feature.id}`,
    kind: 'feature',
    id: feature.id,
    name: feature.name,
    cost: featureCostOf(feature.actionType),
    resource: uses ? 'uses' : null,
    uses,
    isAvailable: !uses || uses.remaining > 0,
    rechargeType: feature.rechargeType,
  }
}

export const toWeaponCard = (weapon: PlayCardWeapon): PlayCard => {
  const uses = getUses(weapon.maxUses, weapon.currentUses)
  return {
    ...emptyCard,
    key: `weapon-${weapon.entryId}`,
    kind: 'weapon',
    id: weapon.entryId,
    name: weapon.name,
    cost: 'action',
    resource: uses ? 'charges' : weapon.ammunition ? 'ammunition' : null,
    uses,
    isAvailable: !weapon.ammunition || weapon.ammunition.available > 0,
    rechargeType: weapon.rechargeType,
    reach: weapon.isRanged ? 'ranged' : 'melee',
  }
}

export const toItemCard = (item: PlayCardItem): PlayCard => {
  const uses = getUses(item.maxUses, item.currentUses)
  return {
    ...emptyCard,
    key: `item-${item.entryId}`,
    kind: 'item',
    id: item.entryId,
    name: item.name,
    cost: 'other',
    resource: 'charges',
    uses,
    isAvailable: (uses?.remaining ?? 0) > 0,
    rechargeType: item.rechargeType,
  }
}

export const PLAY_FACETS = {
  available: (card: PlayCard) => card.isAvailable,
  concentration: (card: PlayCard) => card.isConcentration,
  ritual: (card: PlayCard) => card.isRitual,
  cantrip: (card: PlayCard) => card.spellLevel === 0,
  leveled: (card: PlayCard) => (card.spellLevel ?? 0) > 0,
  short_rest: (card: PlayCard) => card.rechargeType === 'short_rest',
  long_rest: (card: PlayCard) => card.rechargeType === 'long_rest',
  melee: (card: PlayCard) => card.reach === 'melee',
  ranged: (card: PlayCard) => card.reach === 'ranged',
} satisfies Record<string, (card: PlayCard) => boolean>

export type PlayFacet = keyof typeof PLAY_FACETS

export const FACETS_BY_KIND: Record<PlayCardKind | 'all', PlayFacet[]> = {
  all: ['available', 'concentration'],
  spell: ['available', 'cantrip', 'leveled', 'concentration', 'ritual'],
  feature: ['available', 'short_rest', 'long_rest'],
  weapon: ['melee', 'ranged'],
  item: ['available'],
}

export interface PlayCardFilters {
  kind: PlayCardKind | 'all'
  cost: ActionCost | 'all'
  facets: readonly PlayFacet[]
  search: string
}

export const filterPlayCards = (cards: readonly PlayCard[], { kind, cost, facets, search }: PlayCardFilters): PlayCard[] =>
  cards.filter(card =>
    (kind === 'all' || card.kind === kind)
    && (cost === 'all' || card.cost === cost)
    && facets.every(facet => PLAY_FACETS[facet](card))
    && matchesSearch(card.name, search))

export const groupPlayCardsByCost = (cards: readonly PlayCard[]): { cost: ActionCost, cards: PlayCard[] }[] =>
  ACTION_COSTS
    .map(cost => ({ cost, cards: cards.filter(card => card.cost === cost) }))
    .filter(group => group.cards.length > 0)

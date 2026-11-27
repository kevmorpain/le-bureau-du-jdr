import type { ActionType } from '~~/server/db/schema/features'

export const ACTION_COSTS = ['action', 'bonus', 'reaction', 'other'] as const
export type ActionCost = typeof ACTION_COSTS[number]

// Casting times are seeded as French text ("1 action", "1 action bonus", "1 réaction", "10 minutes"…):
// "réaction" contains "action", so the order of the tests matters.
export const spellCostTagOf = (castingTime: string | null | undefined): Exclude<ActionCost, 'other'> | null => {
  const cost = spellCostOf(castingTime)
  return cost === 'other' ? null : cost
}

export const spellCostOf = (castingTime: string | null | undefined): ActionCost => {
  const text = (castingTime ?? '').trim().toLowerCase()
  if (/^1 réaction\b/.test(text)) return 'reaction'
  if (/^1 action bonus\b/.test(text)) return 'bonus'
  if (/^1 action\b/.test(text)) return 'action'
  return 'other'
}

const FEATURE_COSTS: Record<ActionType, ActionCost> = {
  action: 'action',
  bonus_action: 'bonus',
  reaction: 'reaction',
  free: 'other',
}

export const featureCostOf = (actionType: ActionType | null | undefined): ActionCost =>
  actionType ? FEATURE_COSTS[actionType] ?? 'other' : 'other'

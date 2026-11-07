export const AMMUNITION_TYPES = ['arrow', 'bolt', 'bullet', 'needle'] as const
export type AmmunitionType = typeof AMMUNITION_TYPES[number]

export const AMMUNITION_LABELS: Record<AmmunitionType, string> = {
  arrow: 'flèches',
  bolt: 'carreaux',
  bullet: 'billes de fronde',
  needle: 'aiguilles de sarbacane',
}

export interface AmmunitionStack {
  entryId: number
  quantity: number
  ammunitionType: AmmunitionType | null
}

export function ammunitionAvailable(stacks: readonly AmmunitionStack[], type: AmmunitionType): number {
  return stacks.reduce((sum, s) => (s.ammunitionType === type ? sum + s.quantity : sum), 0)
}

export function stackToSpend(stacks: readonly AmmunitionStack[], type: AmmunitionType): AmmunitionStack | null {
  return stacks.find(s => s.ammunitionType === type && s.quantity > 0) ?? null
}

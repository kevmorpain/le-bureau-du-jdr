import type { KnConditionKey } from './conditions'
import type { KnDamageType } from './damageTypes'

export const KN_CREATURE_TYPES = ['animal', 'astral', 'construct', 'demon', 'elemental', 'humanoid', 'plant', 'undead'] as const

export type KnCreatureType = (typeof KN_CREATURE_TYPES)[number]

export interface KnCreatureTypeRules {
  immune: readonly KnConditionKey[]
  vulnerable: readonly KnDamageType[]
  restored: readonly KnDamageType[]
  // Un Élémentaire est restauré par le type de dégâts de son affinité.
  restoredByAffinity?: boolean
}

export const KN_CREATURE_TYPE_RULES: Record<KnCreatureType, KnCreatureTypeRules> = {
  animal: { immune: [], vulnerable: [], restored: [] },
  astral: { immune: ['bleeding', 'poisoned', 'sickened', 'frightened'], vulnerable: [], restored: [] },
  construct: { immune: ['charmed', 'poisoned', 'bleeding', 'sickened', 'frightened', 'sleeping'], vulnerable: [], restored: [] },
  demon: { immune: ['poisoned'], vulnerable: ['holy'], restored: ['infernal'] },
  elemental: { immune: ['bleeding', 'sickened', 'poisoned'], vulnerable: [], restored: [], restoredByAffinity: true },
  humanoid: { immune: [], vulnerable: [], restored: [] },
  plant: { immune: ['frightened', 'blinded'], vulnerable: ['fire'], restored: [] },
  undead: { immune: ['bleeding', 'sickened', 'poisoned', 'frightened'], vulnerable: ['holy'], restored: ['necrotic'] },
}

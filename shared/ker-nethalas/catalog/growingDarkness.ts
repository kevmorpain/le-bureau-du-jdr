import type { KnEffect } from '../effects'
import type { KnSkillKey } from '../skills'

export type KnGrowingDarknessParam = 'maxAetherLoss' | 'maxToughnessLoss' | 'skill'

export interface KnGrowingDarknessParams {
  value?: number
  skill?: KnSkillKey
}

export interface KnGrowingDarknessDef {
  range: readonly [number, number]
  // `immediate` : l'événement se résout sur le moment ; il reste compté parmi les événements actifs du Domaine.
  kind: 'ongoing' | 'immediate'
  param?: KnGrowingDarknessParam
  // Dé tiré pour obtenir la valeur du paramètre (D4 d'Éther, D6 de Robustesse).
  paramDie?: number
  effects?: (params: KnGrowingDarknessParams) => KnEffect[]
}

// Gravebound p. 120-122 : table D100, 35 entrées. Les événements ne touchent qu'un Domaine mais y restent en jeu.
export const KN_GROWING_DARKNESS = {
  gd_01_02: { range: [1, 2], kind: 'ongoing' },
  gd_03_04: { range: [3, 4], kind: 'immediate' },
  gd_05_06: { range: [5, 6], kind: 'immediate' },
  gd_07_08: { range: [7, 8], kind: 'immediate' },
  gd_09_10: {
    range: [9, 10],
    kind: 'ongoing',
    param: 'maxAetherLoss',
    paramDie: 4,
    effects: p => [{ type: 'maxVitalDelta', vital: 'aether', amount: -(p.value ?? 0) }],
  },
  gd_11_12: {
    range: [11, 12],
    kind: 'ongoing',
    param: 'maxToughnessLoss',
    paramDie: 6,
    effects: p => [{ type: 'maxVitalDelta', vital: 'toughness', amount: -(p.value ?? 0) }],
  },
  gd_13_14: { range: [13, 14], kind: 'ongoing' },
  gd_15_16: { range: [15, 16], kind: 'ongoing' },
  gd_17_18: { range: [17, 18], kind: 'ongoing' },
  gd_19_20: { range: [19, 20], kind: 'ongoing' },
  gd_21_22: {
    range: [21, 22],
    kind: 'ongoing',
    effects: () => [{ type: 'modifier', targets: ['spellward'], amount: -5 }],
  },
  gd_23_24: { range: [23, 24], kind: 'ongoing' },
  gd_25_26: { range: [25, 26], kind: 'immediate' },
  gd_27_28: { range: [27, 28], kind: 'immediate' },
  gd_29_30: { range: [29, 30], kind: 'ongoing' },
  gd_31_32: { range: [31, 32], kind: 'immediate' },
  gd_33_34: { range: [33, 34], kind: 'immediate' },
  gd_35_36: { range: [35, 36], kind: 'ongoing' },
  gd_37_50: { range: [37, 50], kind: 'immediate' },
  gd_51_52: { range: [51, 52], kind: 'ongoing' },
  gd_53_54: { range: [53, 54], kind: 'immediate' },
  gd_55_56: { range: [55, 56], kind: 'ongoing' },
  gd_57_58: {
    range: [57, 58],
    kind: 'ongoing',
    param: 'skill',
    effects: p => p.skill ? [{ type: 'modifier', targets: [p.skill], amount: -10 }] : [],
  },
  gd_59_60: { range: [59, 60], kind: 'ongoing' },
  gd_61_62: { range: [61, 62], kind: 'ongoing' },
  gd_63_64: { range: [63, 64], kind: 'immediate' },
  gd_65_66: { range: [65, 66], kind: 'ongoing' },
  gd_67_68: { range: [67, 68], kind: 'immediate' },
  gd_69_70: { range: [69, 70], kind: 'ongoing' },
  gd_71_72: { range: [71, 72], kind: 'immediate' },
  gd_73_74: {
    range: [73, 74],
    kind: 'ongoing',
    effects: () => [{ type: 'modifier', targets: ['nonCombatSkills'], amount: -10 }],
  },
  gd_75_76: { range: [75, 76], kind: 'immediate' },
  gd_77_78: { range: [77, 78], kind: 'ongoing' },
  gd_79_80: { range: [79, 80], kind: 'immediate' },
  gd_81_100: { range: [81, 100], kind: 'ongoing' },
} as const satisfies Record<string, KnGrowingDarknessDef>

export type KnGrowingDarknessKey = keyof typeof KN_GROWING_DARKNESS

export const KN_GROWING_DARKNESS_KEYS = Object.keys(KN_GROWING_DARKNESS) as KnGrowingDarknessKey[]

export const knGrowingDarknessDef = (key: KnGrowingDarknessKey): KnGrowingDarknessDef => KN_GROWING_DARKNESS[key]

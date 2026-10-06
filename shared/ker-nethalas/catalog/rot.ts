import type { KnActiveSource, KnEffect, KnReminderSeverity } from '../effects'

export const KN_ROT_MAX_STAGE = 8

interface KnRotStageDef {
  effects: KnEffect[]
  severity: KnReminderSeverity
}

// Gravebound p. 87. Chaque stade s'ajoute aux précédents.
export const KN_ROT_STAGES: Record<number, KnRotStageDef> = {
  1: { effects: [], severity: 'info' },
  2: { effects: [{ type: 'maxVitalHalf', vital: 'toughness' }], severity: 'warning' },
  3: { effects: [], severity: 'info' },
  4: { effects: [], severity: 'info' },
  5: { effects: [], severity: 'info' },
  6: {
    effects: [{ type: 'disadvantage', targets: ['weaponSkills', 'dodge', 'athletics', 'acrobatics'] }],
    severity: 'warning',
  },
  7: { effects: [], severity: 'info' },
  8: { effects: [], severity: 'danger' },
}

export function knRotSource(stage: number): KnActiveSource | null {
  if (stage < 1) return null

  const active = Array.from({ length: Math.min(stage, KN_ROT_MAX_STAGE) }, (_, i) => i + 1)

  return {
    id: 'rot',
    label: { key: 'ker_nethalas.sources.rot', params: { stage } },
    effects: active.flatMap(n => KN_ROT_STAGES[n]!.effects),
    reminders: active.map(n => ({
      label: { key: `ker_nethalas.rot.stage${n}` },
      severity: KN_ROT_STAGES[n]!.severity,
    })),
  }
}

// Stade 7 : immunité aux effets de l'Épuisement.
export const KN_ROT_EXHAUSTION_IMMUNITY_STAGE = 7

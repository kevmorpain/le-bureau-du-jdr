import type { KnActiveSource } from '../effects'

// Les effets sont cumulatifs, 21 points ou plus tuent le personnage.
export const KN_EXHAUSTION_THRESHOLDS = { halfHealing: 11, disadvantage: 16, death: 21 } as const

export function knExhaustionSource(exhaustion: number): KnActiveSource | null {
  if (exhaustion < KN_EXHAUSTION_THRESHOLDS.halfHealing) return null

  const source: KnActiveSource = {
    id: 'exhaustion',
    label: { key: 'ker_nethalas.sources.exhaustion', params: { value: exhaustion } },
    effects: [],
    reminders: [{ label: { key: 'ker_nethalas.reminders.exhaustionHalfHealing' }, severity: 'warning' }],
  }

  if (exhaustion >= KN_EXHAUSTION_THRESHOLDS.disadvantage) {
    source.effects.push({ type: 'disadvantage', targets: ['allChecks'] })
  }
  if (exhaustion >= KN_EXHAUSTION_THRESHOLDS.death) {
    source.reminders.push({ label: { key: 'ker_nethalas.reminders.exhaustionDeath' }, severity: 'danger' })
  }

  return source
}

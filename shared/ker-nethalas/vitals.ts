import type { KnVitalKey } from './effects'
import { KN_STATUS_BOUNDS, type KnStatus, type KnUseLimit } from './status'

export const knTemporaryOf = (status: Pick<KnStatus, 'temporary'>, vital: KnVitalKey) => status.temporary?.[vital] ?? 0

export function knSetTemporary(status: KnStatus, vital: KnVitalKey, amount: number): KnStatus {
  const { min, max } = KN_STATUS_BOUNDS.temporary
  return { ...status, temporary: { ...status.temporary, [vital]: Math.min(max, Math.max(min, Math.trunc(amount))) } }
}

// Plusieurs gains s'additionnent : le livre ne prévoit pas qu'on ne garde que le meilleur.
export const knGainTemporary = (status: KnStatus, vital: KnVitalKey, amount: number): KnStatus =>
  knSetTemporary(status, vital, knTemporaryOf(status, vital) + amount)

export function knClearTemporary(status: KnStatus): KnStatus {
  const { temporary: _cleared, ...rest } = status
  return rest
}

export interface KnWoundsState {
  toughness: number
  toughnessMax: number
  health: number
  healthMax: number
  temporaryToughness: number
}

// Les dégâts retirent d'abord la Robustesse temporaire (dépensée), puis la Robustesse, puis la Santé (p. 81).
export function knTakeDamage(state: KnWoundsState, amount: number): KnWoundsState {
  const fromTemporary = Math.min(state.temporaryToughness, Math.max(0, amount))
  const fromToughness = Math.min(state.toughness, Math.max(0, amount) - fromTemporary)
  const fromHealth = Math.max(0, amount) - fromTemporary - fromToughness
  return {
    ...state,
    temporaryToughness: state.temporaryToughness - fromTemporary,
    toughness: state.toughness - fromToughness,
    health: Math.max(0, state.health - fromHealth),
  }
}

// « Récupérer X Blessures » remplit d'abord toute la Robustesse, puis seulement la Santé (p. 13 et 86). Un maximum déjà
// dépassé n'est jamais ramené en arrière.
export function knHealWounds(state: KnWoundsState, amount: number): KnWoundsState {
  const gain = Math.max(0, amount)
  const toughness = Math.max(state.toughness, Math.min(state.toughnessMax, state.toughness + gain))
  const left = gain - (toughness - state.toughness)
  return { ...state, toughness, health: Math.max(state.health, Math.min(state.healthMax, state.health + left)) }
}

// Une pause ou un camp remet à zéro le temporaire et les aptitudes « par repos » ; le camp, aussi celles « par camp ».
export const KN_REST_LIMITS: Record<'breather' | 'camp', readonly KnUseLimit[]> = {
  breather: ['rest'],
  camp: ['rest', 'campRest'],
}

export function knRest(status: KnStatus, kind: 'breather' | 'camp'): KnStatus {
  const cleared = knClearTemporary(status)
  return knResetUses(cleared, KN_REST_LIMITS[kind])
}

export function knResetUses(status: KnStatus, limits: readonly KnUseLimit[]): KnStatus {
  if (!status.used) return status
  return { ...status, used: status.used.filter(use => !limits.includes(use.limit)) }
}

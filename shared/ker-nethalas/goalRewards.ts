import { knRollDice } from './dice'
import { KN_ONE_SHOT_GOAL_EFFECTS, type KnGoalEffectEntry } from './goalEffects'
import { knClaimGoal, knGoalReached, knUnclaimGoal, type KnGoalPick, type KnPersonalGoal } from './goals'
import type { KnLevelSheet } from './levelUp'
import type { KnRng } from './run'

export type KnGoalSheet = Pick<KnLevelSheet, 'xp' | 'healthMax' | 'healthCurrent' | 'toughnessMax' | 'toughnessCurrent' | 'aetherMax' | 'aetherCurrent' | 'sanityMax' | 'sanityCurrent'> & {
  goalPicks: KnGoalPick[]
  goalEffects: KnGoalEffectEntry[]
}

export type KnGoalClaim
  = | { patch: Partial<KnGoalSheet>, lines: string[], amulet: boolean }
    | { error: 'notReached' }

const VITAL_LABELS = { health: 'Santé', toughness: 'Robustesse', sanity: 'Santé mentale', aether: 'Éther' } as const

// Récupérer la récompense : l'objectif passe en « récupéré » ; ses effets durables rejoignent la fiche, ses gains ponctuels ne se
// donnent qu'une fois, même après une annulation suivie d'une nouvelle récupération.
export function knClaimGoalReward(sheet: KnGoalSheet, goal: KnPersonalGoal, rng: KnRng = Math.random): KnGoalClaim {
  const before = sheet.goalPicks.find(pick => pick.key === goal.key)
  if (!before || before.claimed || !knGoalReached(goal, before)) return { error: 'notReached' }

  const claimed = knClaimGoal(sheet.goalPicks, goal)
  const patch: Partial<KnGoalSheet> = { goalPicks: claimed }
  const lines: string[] = []
  let amulet = false
  const { effect } = goal

  if (effect && !KN_ONE_SHOT_GOAL_EFFECTS.includes(effect.kind)) {
    patch.goalEffects = [
      ...sheet.goalEffects.filter(entry => entry.goal !== goal.key),
      { goal: goal.key, effect, ...(effect.kind === 'note' ? { text: goal.reward } : {}) },
    ]
  } else if (effect && !before.granted) {
    patch.goalPicks = claimed.map(pick => pick.key === goal.key ? { ...pick, granted: true } : pick)
    if (effect.kind === 'xp') {
      patch.xp = sheet.xp + effect.amount
      lines.push(`+${effect.amount} XP`)
    } else if (effect.kind === 'amulet') {
      amulet = true
    } else if (effect.kind === 'maxVital') {
      const gained = knRollDice(effect.dice, rng).total
      patch[`${effect.vital}Max`] = sheet[`${effect.vital}Max`] + gained
      patch[`${effect.vital}Current`] = sheet[`${effect.vital}Current`] + gained
      lines.push(`${VITAL_LABELS[effect.vital]} maximale +${gained}`)
    }
  }
  return { patch, lines, amulet }
}

// Annuler une récupération faite par mégarde : les effets durables partent, ce qui a déjà été donné reste donné.
export function knUnclaimGoalReward(
  sheet: Pick<KnGoalSheet, 'goalPicks' | 'goalEffects'>,
  key: string,
): Pick<KnGoalSheet, 'goalPicks' | 'goalEffects'> {
  const goalPicks = knUnclaimGoal(sheet.goalPicks, key)
  const reopened = goalPicks.some(pick => pick.key === key && !pick.claimed)
  return { goalPicks, goalEffects: reopened ? sheet.goalEffects.filter(entry => entry.goal !== key) : sheet.goalEffects }
}

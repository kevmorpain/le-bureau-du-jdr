import { z } from 'zod'

export const HIT_DIE_SIDES = ['4', '6', '8', '10', '12'] as const

export type HitDieSides = (typeof HIT_DIE_SIDES)[number]

export const currentHitDieSchema = z.array(z.object({
  die: z.enum(HIT_DIE_SIDES),
  count: z.number().int().min(0).max(20),
}))

export type CurrentHitDie = z.infer<typeof currentHitDieSchema>[number]

// `classes.hitDice` vaut « 1d10 » ; `currentHitDie` ne garde que les côtés (« 10 »).
export const hitDieSidesOf = (hitDice: string | null | undefined): HitDieSides | undefined => {
  const sides = hitDice?.match(/\d+d(\d+)/)?.[1]
  return HIT_DIE_SIDES.find(s => s === sides)
}

export const hitDieValueOf = (hitDice: string | null | undefined): number | null => {
  const sides = hitDieSidesOf(hitDice)
  return sides ? Number(sides) : null
}

export const hitDiceTotals = (classes: { level: number, hitDice?: string | null }[]): CurrentHitDie[] => {
  const totals = new Map<HitDieSides, number>()
  for (const cls of classes) {
    const die = hitDieSidesOf(cls.hitDice)
    if (die) totals.set(die, (totals.get(die) ?? 0) + cls.level)
  }
  return [...totals].map(([die, count]) => ({ die, count }))
}

// Fiche sans `currentHitDie` (créée avant la colonne) : tous les dés sont dépensables.
// Le budget (moitié du total, arrondie à l'inférieur, minimum 1) est partagé entre les types
// de dés, les plus gros d'abord : choix de répartition, la règle ne tranche pas.
export const recoverHitDice = (
  current: CurrentHitDie[] | null | undefined,
  totals: CurrentHitDie[],
): CurrentHitDie[] => {
  const max = new Map(totals.map(t => [t.die, t.count]))
  let budget = Math.max(1, Math.floor(totals.reduce((sum, t) => sum + t.count, 0) / 2))
  const recovered = new Map<HitDieSides, number>()
  for (const { die, count } of [...(current ?? totals)].sort((a, b) => Number(b.die) - Number(a.die))) {
    const total = max.get(die)
    if (total === undefined) continue
    const gain = Math.min(budget, Math.max(0, total - count))
    budget -= gain
    recovered.set(die, count + gain)
  }
  return (current ?? totals).map(({ die, count }) => ({ die, count: recovered.get(die) ?? count }))
}

export const remainingHitDice = (current: CurrentHitDie[] | null | undefined, totals: CurrentHitDie[]): CurrentHitDie[] =>
  totals.map(({ die, count }) => ({ die, count: Math.min(count, current?.find(c => c.die === die)?.count ?? count) }))

export const spendHitDice = (
  current: CurrentHitDie[] | null | undefined,
  totals: CurrentHitDie[],
  spent: readonly { die: string, count: number }[],
): CurrentHitDie[] =>
  remainingHitDice(current, totals).map(({ die, count }) => ({
    die,
    count: Math.max(0, count - spent.filter(s => s.die === die).reduce((sum, s) => sum + s.count, 0)),
  }))

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

export const hitDiceTotals = (classes: { level: number, hitDice?: string | null }[]): CurrentHitDie[] => {
  const totals = new Map<HitDieSides, number>()
  for (const cls of classes) {
    const die = hitDieSidesOf(cls.hitDice)
    if (die) totals.set(die, (totals.get(die) ?? 0) + cls.level)
  }
  return [...totals].map(([die, count]) => ({ die, count }))
}

// Fiche sans `currentHitDie` (créée avant la colonne) : tous les dés sont dépensables.
// Moitié des dés arrondie au supérieur : comportement historique, règle non resourcée.
export const recoverHitDice = (
  current: CurrentHitDie[] | null | undefined,
  totals: CurrentHitDie[],
): CurrentHitDie[] => {
  const max = new Map(totals.map(t => [t.die, t.count]))
  return (current ?? totals).map(({ die, count }) => {
    const total = max.get(die)
    return { die, count: Math.min(total ?? count, count + Math.ceil((total ?? 0) / 2)) }
  })
}

import { z } from 'zod'

export const boundedInt = ({ min, max }: { min: number, max: number }) => z.number().int().min(min).max(max)

export const shapeOf = <K extends string, V extends z.ZodTypeAny>(keys: readonly K[], value: V) =>
  Object.fromEntries(keys.map(k => [k, value])) as Record<K, V>

// Les plages d'une table se suivent, sans trou ni recouvrement, de 1 jusqu'à la dernière face du dé.
export function knCheckCoverage(entries: readonly { min: number, max: number }[], die: number, ctx: z.RefinementCtx) {
  let expected = 1
  entries.forEach((entry, index) => {
    if (entry.min !== expected) ctx.addIssue({ code: 'custom', path: ['entries', index, 'min'], message: `la plage doit commencer à ${expected}` })
    if (entry.max > die) ctx.addIssue({ code: 'custom', path: ['entries', index, 'max'], message: `la plage dépasse le dé (${die})` })
    expected = entry.max + 1
  })
  if (expected !== die + 1) ctx.addIssue({ code: 'custom', path: ['entries'], message: `les plages doivent couvrir de 1 à ${die}` })
}

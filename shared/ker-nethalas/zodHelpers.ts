import { z } from 'zod'

export const boundedInt = ({ min, max }: { min: number, max: number }) => z.number().int().min(min).max(max)

export const shapeOf = <K extends string, V extends z.ZodTypeAny>(keys: readonly K[], value: V) =>
  Object.fromEntries(keys.map(k => [k, value])) as Record<K, V>

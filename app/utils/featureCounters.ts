type CounterMeta = { slotLevelFormula?: unknown, hideCounter?: boolean, resource?: string } | null | undefined

// Pact Magic's count is its spell slots, and `hideCounter` marks a count that is information only (invocations known).
export const hasInformativeCounter = (meta: CounterMeta): boolean =>
  Boolean(meta?.slotLevelFormula) || Boolean(meta?.hideCounter)

export const hasPoolCounter = (meta: CounterMeta): boolean => Boolean(meta?.resource)

export const isSpellSlotFeature = (meta: CounterMeta): boolean => Boolean(meta?.slotLevelFormula)

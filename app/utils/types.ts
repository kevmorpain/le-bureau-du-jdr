// Source: https://stackoverflow.com/a/24457420
export const isNumeric = (value: string): boolean => /^-?\d+$/.test(value)

export interface SpellContext {
  characterLevel: ComputedRef<number>
  spellcastingModifier: ComputedRef<number | null>
}

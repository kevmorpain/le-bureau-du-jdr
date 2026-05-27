// Source: https://stackoverflow.com/a/24457420
export const isNumeric = (value: string): boolean => /^-?\d+$/.test(value)

export interface SpellContext {
  characterLevel: ComputedRef<number>
  spellcastingModifier: ComputedRef<number | null>
  // Modifications de Décharge occulte (Manifestations occultes — Occultiste)
  eldritchBlastAgonizing?: ComputedRef<boolean>
  eldritchBlastRepelling?: ComputedRef<boolean>
  eldritchBlastRangeExtended?: ComputedRef<boolean>
  eldritchBlastSourceNames?: ComputedRef<string[]>
  charismaModifier?: ComputedRef<number>
}

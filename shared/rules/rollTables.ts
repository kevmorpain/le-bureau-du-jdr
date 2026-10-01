export const ROLL_TABLE_KEYS = ['wild_magic_surge'] as const

export type RollTableKey = (typeof ROLL_TABLE_KEYS)[number]

export interface RollTableEntry {
  min: number
  max: number
  text: string
}

export interface RollTable {
  name: string
  die: number
  entries: RollTableEntry[]
}

export function rollTableEntryIndex(entries: RollTableEntry[], roll: number): number {
  return entries.findIndex(e => roll >= e.min && roll <= e.max)
}

// Au d100, la table imprimée numérote sur deux chiffres : « 01-02 » … « 99-100 ».
export function rollTableRangeLabel(entry: RollTableEntry, die: number): string {
  const format = (n: number) => (die === 100 ? String(n).padStart(2, '0') : String(n))
  return entry.min === entry.max ? format(entry.min) : `${format(entry.min)}-${format(entry.max)}`
}

import { updateCharacterSheetSchema } from '~~/shared/utils/character_sheet'
import type { QueuedMutation } from './offlineQueue'

export type SheetField = keyof typeof updateCharacterSheetSchema.shape
export const SHEET_FIELDS = Object.keys(updateCharacterSheetSchema.shape) as SheetField[]

export const CONFLICT_GROUPS = ['spell-slots', 'inventory', 'spells', 'features', 'proficiency-overrides', 'background', 'rest', 'other'] as const
export type ConflictGroup = typeof CONFLICT_GROUPS[number]

type SheetLike = Record<string, unknown>

// JSON columns come back with their keys in any order: compare them as text, keys sorted.
const canonical = (value: unknown): string => JSON.stringify(value ?? null, (_, inner) =>
  inner && typeof inner === 'object' && !Array.isArray(inner)
    ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
    : inner)

export const isSameValue = (a: unknown, b: unknown): boolean => canonical(a) === canonical(b)

export interface SheetFieldsSplit {
  // Changed on both sides since the last sync, to different values: the player chooses.
  conflicts: SheetField[]
  // Changed on this device only: kept without asking.
  localOnly: SheetField[]
}

// Without the last synced copy (a device that predates it), every differing field is a conflict.
export const splitSheetFields = (base: SheetLike | null, local: SheetLike, server: SheetLike): SheetFieldsSplit => {
  const split: SheetFieldsSplit = { conflicts: [], localOnly: [] }
  for (const field of SHEET_FIELDS) {
    if (!(field in local) || isSameValue(local[field], server[field])) continue
    if (!base) {
      split.conflicts.push(field)
      continue
    }
    const isChangedHere = !isSameValue(local[field], base[field])
    const isChangedThere = !isSameValue(server[field], base[field])
    if (isChangedHere && isChangedThere) split.conflicts.push(field)
    else if (isChangedHere) split.localOnly.push(field)
  }
  return split
}

export const mergeSheet = (server: SheetLike, local: SheetLike, fromLocal: readonly SheetField[]): SheetLike => ({
  ...server,
  ...Object.fromEntries(fromLocal.map(field => [field, local[field]])),
})

// `/api/character_sheets/12` is the sheet itself; `/api/character_sheets/12/spells` a resource of it.
export const conflictGroupOf = (op: Pick<QueuedMutation, 'endpoint'>): ConflictGroup | 'sheet' => {
  const resource = op.endpoint.replace(/^\/api\/character_sheets\/\d+\/?/, '').split('/')[0] ?? ''
  if (!resource) return 'sheet'
  return (CONFLICT_GROUPS as readonly string[]).includes(resource) ? resource as ConflictGroup : 'other'
}

export const pendingGroups = (ops: readonly Pick<QueuedMutation, 'endpoint'>[]): Map<ConflictGroup, number> => {
  const counts = new Map<ConflictGroup, number>()
  for (const op of ops) {
    const group = conflictGroupOf(op)
    if (group !== 'sheet') counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  return counts
}

export const keepQueuedOps = <T extends Pick<QueuedMutation, 'endpoint' | 'body'>>(
  ops: readonly T[],
  { sheetBody, droppedGroups }: { sheetBody: SheetLike | null, droppedGroups: readonly ConflictGroup[] },
): T[] => ops.flatMap((op) => {
  const group = conflictGroupOf(op)
  if (group === 'sheet') return sheetBody ? [{ ...op, body: sheetBody }] : []
  return droppedGroups.includes(group) ? [] : [op]
})

type SlotState = { current: number, max: number }
export type SnapshotSlots = Partial<Record<'spellcasting' | 'pact_magic', Record<number, SlotState>>>

export const spentSlotsInSnapshot = (slots: SnapshotSlots | null): number =>
  Object.values(slots ?? {}).flatMap(levels => Object.values(levels ?? {})).reduce((sum, slot) => sum + Math.max(0, slot.max - slot.current), 0)

export const spentSlotsOnServer = (sheet: { spellSlots?: { used?: number }[] } | null): number =>
  (sheet?.spellSlots ?? []).reduce((sum, slot) => sum + (slot.used ?? 0), 0)

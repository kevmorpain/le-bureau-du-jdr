// File de mutations hors-ligne, persistée en localStorage par personnage.
// Couche « pure » (pas de réactivité Vue, pas de $fetch) : lecture/écriture du stockage
// + dédoublonnage. Le rejeu réseau vit dans useOfflineSync.
//
// iOS/iPadOS n'expose pas l'API Background Sync : la file est rejouée par l'app
// (events online + reprise au premier plan), pas par le service worker.

// Import explicite (plutôt que via l'auto-import Nuxt) pour rester testable hors contexte Nuxt.
import { characterStorageKey } from './storage'

export type QueuedMethod = 'PUT' | 'POST' | 'DELETE'

export interface QueuedMutation {
  id: string // identifiant unique de l'op (crypto.randomUUID)
  ts: number // horodatage d'enfilement
  characterId: number
  endpoint: string // ex. /api/character_sheets/12/spell-slots
  method: QueuedMethod
  body?: unknown
  // Ops « remplacement complet » partageant un dedupeKey : seule la dernière est conservée
  // (ex. 'sheet', 'spell-slots'). Les ops incrémentales n'ont pas de dedupeKey.
  dedupeKey?: string
  // character_sheets.updatedAt connu au moment de l'enfilement (garde-fou anti-écrasement).
  baseVersion?: string | null
  // Libellé court pour l'UI (« PV », « Slots de sorts »…).
  label?: string
}

const QUEUE_SUFFIX = 'syncQueue'
const QUEUE_KEY_RE = /^char:(\d+):syncQueue$/

const queueKey = (characterId: number): string => characterStorageKey(characterId, QUEUE_SUFFIX)

export function readQueue(characterId: number): QueuedMutation[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(queueKey(characterId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed as QueuedMutation[] : []
  }
  catch {
    return []
  }
}

export function writeQueue(characterId: number, ops: QueuedMutation[]): void {
  if (import.meta.server) return
  try {
    localStorage.setItem(queueKey(characterId), JSON.stringify(ops))
  }
  catch {
    // Quota dépassé / stockage indisponible : on n'a pas mieux à faire ici.
  }
}

/** Enfile une op (dédoublonnage des ops à dedupeKey) et renvoie la file mise à jour. */
export function enqueueMutation(op: QueuedMutation): QueuedMutation[] {
  const ops = readQueue(op.characterId)
  const next = op.dedupeKey ? ops.filter(o => o.dedupeKey !== op.dedupeKey) : ops
  next.push(op)
  writeQueue(op.characterId, next)
  return next
}

export function removeMutation(characterId: number, id: string): QueuedMutation[] {
  const ops = readQueue(characterId).filter(o => o.id !== id)
  writeQueue(characterId, ops)
  return ops
}

export function clearQueue(characterId: number): void {
  if (import.meta.server) return
  localStorage.removeItem(queueKey(characterId))
}

/** Énumère les persos ayant au moins une op en attente (scan du localStorage). */
export function listQueuedCharacterIds(): number[] {
  if (import.meta.server) return []
  const ids: number[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const match = key?.match(QUEUE_KEY_RE)
    if (!match?.[1]) continue
    const id = Number(match[1])
    if (readQueue(id).length) ids.push(id)
  }
  return ids
}

export function totalPending(): number {
  return listQueuedCharacterIds().reduce((n, id) => n + readQueue(id).length, 0)
}

export function hasPending(characterId: number): boolean {
  return readQueue(characterId).length > 0
}

// ── Snapshots d'état local ───────────────────────────────────────────────────
// Permettent de restaurer l'état optimiste après un reload hors-ligne (le cache
// Workbox ne contient que l'état serveur *avant* les modifs en attente).

const snapshotKey = (characterId: number, suffix: string): string =>
  characterStorageKey(characterId, `snapshot:${suffix}`)

export function readSnapshot<T = unknown>(characterId: number, suffix = 'sheet'): T | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(snapshotKey(characterId, suffix))
    return raw ? JSON.parse(raw) as T : null
  }
  catch {
    return null
  }
}

export function writeSnapshot(characterId: number, data: unknown, suffix = 'sheet'): void {
  if (import.meta.server) return
  try {
    localStorage.setItem(snapshotKey(characterId, suffix), JSON.stringify(data))
  }
  catch {
    // Quota dépassé / indisponible.
  }
}

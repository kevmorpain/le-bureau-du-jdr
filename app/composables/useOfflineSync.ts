import { useOnline } from '@vueuse/core'
import {
  enqueueMutation,
  listQueuedCharacterIds,
  readQueue,
  removeMutation,
  clearQueue,
  totalPending,
  type QueuedMutation,
} from '~/utils/offlineQueue'

// ── État partagé (singleton module-level) ───────────────────────────────────
// Partagé entre l'indicateur de synchro, le wrapper offlineMutate et le plugin.
const pendingCount = ref(0)
const isSyncing = ref(false)
const lastError = ref<string | null>(null)
// Persos dont le rejeu est bloqué car la fiche a changé ailleurs (ex. level-up sur PC).
const conflicts = ref<number[]>([])
// Signal de réconciliation : émis quand la file d'un perso vient d'être entièrement vidée.
// La page de la fiche l'observe pour re-fetcher (récupère les vrais ids, l'état serveur du repos…).
const lastSynced = ref<{ characterId: number, ts: number } | null>(null)

// character_sheets.updatedAt connu (dernier état synchronisé) par perso. Renseigné par la
// page de la fiche au chargement et après chaque synchro/refresh, lu par offlineMutate pour
// estampiller chaque op (garde-fou anti-écrasement).
const baseVersions = reactive<Record<number, string | null>>({})

export function setBaseVersion(characterId: number, updatedAt: string | null | undefined): void {
  baseVersions[characterId] = updatedAt ?? null
}

export function getBaseVersion(characterId: number): string | null {
  return baseVersions[characterId] ?? null
}

function refreshPendingCount(): void {
  pendingCount.value = totalPending()
}

async function fetchServerVersion(characterId: number): Promise<string | null> {
  const sheet = await $fetch<{ updatedAt: string | null }>(`/api/character_sheets/${characterId}`)
  return sheet?.updatedAt ?? null
}

/**
 * Rejoue la file d'un perso, dans l'ordre.
 * @param force ignore le garde-fou de version (résolution de conflit « garder mes modifs »).
 */
async function flushCharacter(characterId: number, force = false): Promise<void> {
  const ops = readQueue(characterId)
  if (!ops.length) return

  // Garde-fou anti-écrasement : la fiche a-t-elle changé ailleurs depuis qu'on est parti hors-ligne ?
  if (!force) {
    const baseVersion = ops[0]?.baseVersion ?? null
    let serverVersion: string | null
    try {
      serverVersion = await fetchServerVersion(characterId)
    }
    catch {
      return // hors-ligne / réseau instable : on retentera
    }
    if (baseVersion && serverVersion && serverVersion !== baseVersion) {
      if (!conflicts.value.includes(characterId)) conflicts.value = [...conflicts.value, characterId]
      return
    }
  }

  // Rejeu séquentiel (pas de db.batch ni de transaction — cf. limites D1).
  let replayed = 0
  for (const op of ops) {
    try {
      await $fetch(op.endpoint, { method: op.method, body: op.body as Record<string, unknown> })
      removeMutation(characterId, op.id)
      refreshPendingCount()
      replayed++
    }
    catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err)
      return // on garde l'ordre : on retentera la file restante plus tard
    }
  }
  conflicts.value = conflicts.value.filter(id => id !== characterId)
  // File vidée → signal de réconciliation (re-fetch pour vrais ids / état serveur).
  if (replayed > 0) lastSynced.value = { characterId, ts: Date.now() }
}

export function useOfflineSync() {
  const online = useOnline()
  const hasConflict = computed(() => conflicts.value.length > 0)

  /** Enfile une mutation puis tente un flush immédiat si en ligne. */
  function enqueue(op: Omit<QueuedMutation, 'id' | 'ts'>): void {
    enqueueMutation({ ...op, id: crypto.randomUUID(), ts: Date.now() })
    refreshPendingCount()
    if (online.value) void flushAll()
  }

  async function flushAll(): Promise<void> {
    if (!online.value || isSyncing.value) return
    isSyncing.value = true
    try {
      for (const id of listQueuedCharacterIds()) {
        if (conflicts.value.includes(id)) continue // attend une résolution explicite
        await flushCharacter(id)
      }
    }
    finally {
      isSyncing.value = false
      refreshPendingCount()
    }
  }

  /** Résolution de conflit (UI Phase 4). */
  async function resolveConflict(characterId: number, choice: 'local' | 'server'): Promise<void> {
    if (choice === 'local') {
      isSyncing.value = true
      try {
        await flushCharacter(characterId, true) // écrase le serveur
      }
      finally {
        isSyncing.value = false
        refreshPendingCount()
      }
    }
    else {
      clearQueue(characterId) // abandonne les modifs locales en attente
      refreshPendingCount()
    }
    conflicts.value = conflicts.value.filter(id => id !== characterId)
  }

  return {
    online,
    pendingCount,
    isSyncing,
    lastError,
    conflicts,
    hasConflict,
    lastSynced,
    enqueue,
    flushAll,
    resolveConflict,
    refreshPendingCount,
  }
}

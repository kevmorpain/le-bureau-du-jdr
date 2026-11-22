import { computed, inject, ref } from 'vue'

interface SaveSignals {
  conflict: boolean
  online: boolean
  syncing: boolean
  pending: number
  autoSave: AutoSaveStatus
}

// Un conflit ou une file bloquée l'emportent sur l'autosave : tant qu'ils durent, « enregistré » serait faux.
export const saveStateOf = ({ conflict, online, syncing, pending, autoSave }: SaveSignals) => {
  if (conflict) return 'conflict'
  if (!online) return 'offline'
  if (syncing) return 'saving'
  if (pending > 0) return 'pending'
  if (autoSave === 'error') return 'failed'
  if (autoSave === 'saving') return 'saving'
  return 'saved'
}

export function useSaveState() {
  const { online, pendingCount, isSyncing, hasConflict, flushAll } = useOfflineSync()
  const autoSaveStatus = inject(autoSaveStatusKey, ref<AutoSaveStatus>('idle'))

  const state = computed(() => saveStateOf({
    conflict: hasConflict.value,
    online: online.value,
    syncing: isSyncing.value,
    pending: pendingCount.value,
    autoSave: autoSaveStatus.value,
  }))

  return { state, pendingCount, isSyncing, autoSaveStatus, flushAll }
}

import { computed, inject, ref } from 'vue'

interface SaveSignals {
  hasConflict: boolean
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  autoSave: AutoSaveStatus
}

// A conflict or a blocked queue outranks the autosave: while they last, "saved" would be a lie.
export const getSaveState = ({ hasConflict, isOnline, isSyncing, pendingCount, autoSave }: SaveSignals) => {
  if (hasConflict) return 'conflict'
  if (!isOnline) return 'offline'
  if (isSyncing) return 'saving'
  if (pendingCount > 0) return 'pending'
  if (autoSave === 'error') return 'failed'
  if (autoSave === 'saving') return 'saving'
  return 'saved'
}

export function useSaveState() {
  const { online, pendingCount, isSyncing, hasConflict, flushAll } = useOfflineSync()
  const autoSaveStatus = inject(autoSaveStatusKey, ref<AutoSaveStatus>('idle'))

  const state = computed(() => getSaveState({
    hasConflict: hasConflict.value,
    isOnline: online.value,
    isSyncing: isSyncing.value,
    pendingCount: pendingCount.value,
    autoSave: autoSaveStatus.value,
  }))

  return { state, pendingCount, isSyncing, autoSaveStatus, flushAll }
}

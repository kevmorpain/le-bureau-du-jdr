import { useEventListener } from '@vueuse/core'
import { getCurrentScope, nextTick, onScopeDispose, provide, ref, watch, type Ref } from 'vue'
import { useCharacterPreferences } from '~/composables/character/useCharacterPreferences'

export async function useSheetPersistence(charId: Ref<number>) {
  const scope = getCurrentScope()
  const { offlineMutate } = useOfflineMutation(charId)
  const toaster = useToast()
  const { t } = useI18n()
  const route = useRoute()
  const isAutoSavePaused = ref(false)
  const characterSheet = ref() as Ref<CharacterSheet>

  const updateCharacterSheet = async () => {
    await offlineMutate({
      endpoint: `/api/character_sheets/${charId.value}`,
      method: 'PUT',
      body: characterSheet.value,
      dedupeKey: 'sheet',
      label: 'Fiche',
    })
  }

  const { status: autoSaveStatus, schedule: scheduleSave, flush: flushSave } = useAutoSave(updateCharacterSheet, {
    delay: 2000,
    maxWait: 10_000,
    onError: () => toaster.add({ title: t('sheet.save.error_toast'), color: 'error' }),
  })
  provide(autoSaveStatusKey, autoSaveStatus)

  const { data, refresh } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${charId.value}`)

  if (!data.value) {
    throw createError({ statusCode: 404, statusMessage: t('sheet.not_found') })
  }

  characterSheet.value = data.value

  // The fetched sheet predates the changes still queued offline: the local snapshot is the up-to-date state.
  if (import.meta.client && hasPending(charId.value)) {
    const snapshot = readSnapshot<CharacterSheet>(charId.value)
    if (snapshot) characterSheet.value = snapshot
  }
  setBaseVersion(charId.value, data.value.updatedAt)

  async function refreshSheet() {
    await refresh()
    if (!data.value) return
    // Replacing the sheet with the server state must not send it back to the server.
    isAutoSavePaused.value = true
    characterSheet.value = data.value
    setBaseVersion(charId.value, data.value.updatedAt)
    await nextTick()
    isAutoSavePaused.value = false
  }

  // Past the `await`, no component instance is current: without the page scope, these would outlive the page.
  scope?.run(() => {
    watch(characterSheet, () => {
      if (isAutoSavePaused.value) return
      if (import.meta.client) writeSnapshot(charId.value, characterSheet.value)
      scheduleSave()
    }, { deep: true })

    // A debounced change is not sent yet: send it before the tab is hidden or the page left.
    if (import.meta.client) {
      useEventListener(document, 'visibilitychange', () => {
        if (document.hidden) void flushSave()
      })
    }
    onScopeDispose(() => {
      void flushSave()
    })
  })

  // The deep watcher only schedules the save on the next tick.
  async function saveNow() {
    await nextTick()
    await flushSave()
  }

  function retrySave() {
    scheduleSave()
    return saveNow()
  }

  const { setPreference } = useCharacterPreferences(characterSheet)

  // Both pages share the `useFetch` cache: the other page would read the previous choice and redirect back.
  async function switchSheetDesign(isNewSheet: boolean) {
    setPreference('newSheet', isNewSheet)
    await saveNow()
    const target = isNewSheet ? getNewSheetPath(charId.value) : `/characters/${charId.value}`
    if (route.path === target) return
    await refreshSheet()
    await navigateTo(target)
  }

  return { characterSheet, refreshSheet, autoSaveStatus, saveNow, retrySave, switchSheetDesign }
}

// Once the offline queue is flushed or a conflict resolved, the server state is canonical (real ids, rest results).
export function useSheetReconciliation(charId: Ref<number>, refreshers: Array<() => Promise<unknown>>) {
  const reconcile = () => Promise.all(refreshers.map(refresh => refresh()))

  const { lastSynced } = useOfflineSync()
  watch(lastSynced, (synced) => {
    if (!synced || synced.characterId !== charId.value) return
    if (hasPending(charId.value)) return
    void reconcile()
  })

  return { reconcile }
}

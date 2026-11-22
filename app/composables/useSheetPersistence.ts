import { useEventListener } from '@vueuse/core'
import { getCurrentScope, nextTick, onScopeDispose, provide, ref, watch, type Ref } from 'vue'
import { useCharacterPreferences } from '~/composables/character/useCharacterPreferences'

/**
 * Chargement et sauvegarde de la fiche, communs à l'ancienne et à la nouvelle page : autosave, instantané
 * hors ligne et version de référence du garde-fou anti-écrasement.
 */
export async function useSheetPersistence(charId: Ref<number>) {
  // Tout ce qui a besoin de l'instance (provide, file hors ligne) se crée avant le `await`.
  const scope = getCurrentScope()
  const { offlineMutate } = useOfflineMutation(charId)
  const toaster = useToast()
  const route = useRoute()
  const pauseAutoSave = ref(false)
  const characterSheet = ref() as Ref<CharacterSheet>

  // Hors-ligne, le PUT est mis en file : l'indicateur de synchro prend alors le relais.
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
    onError: () => toaster.add({ title: 'Erreur lors de la sauvegarde', color: 'error' }),
  })
  provide(autoSaveStatusKey, autoSaveStatus)

  const { data, refresh } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${charId.value}`)

  if (!data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Fiche de personnage introuvable' })
  }

  characterSheet.value = data.value

  // Reload hors-ligne : si des modifs sont en attente pour ce perso, repartir de l'état local
  // optimiste (le cache ne contient que l'état serveur d'avant les modifs).
  if (import.meta.client && hasPending(charId.value)) {
    const snap = readSnapshot<CharacterSheet>(charId.value)
    if (snap) characterSheet.value = snap
  }
  setBaseVersion(charId.value, data.value.updatedAt)

  async function refreshSheet() {
    await refresh()
    if (!data.value) return
    // Évite que le watch deep redéclenche un save vers le serveur (boucle).
    pauseAutoSave.value = true
    characterSheet.value = data.value
    setBaseVersion(charId.value, data.value.updatedAt)
    await nextTick()
    pauseAutoSave.value = false
  }

  // Après le `await`, l'instance n'est plus courante : sans le scope de la page, ces écoutes survivraient à la fiche.
  scope?.run(() => {
    watch(characterSheet, () => {
      if (pauseAutoSave.value) return
      // Snapshot local immédiat pour survivre à un reload hors-ligne.
      if (import.meta.client) writeSnapshot(charId.value, characterSheet.value)
      scheduleSave()
    }, { deep: true })

    // Le debounce laisse une fenêtre où la modif n'est pas partie : on la vide avant de quitter la fiche.
    if (import.meta.client) {
      useEventListener(document, 'visibilitychange', () => {
        if (document.hidden) void flushSave()
      })
    }
    onScopeDispose(() => {
      void flushSave()
    })
  })

  // Le watch profond ne part qu'au prochain tick : sans l'attendre, il n'y aurait encore rien à envoyer.
  async function saveNow() {
    await nextTick()
    await flushSave()
  }

  function retrySave() {
    scheduleSave()
    return saveNow()
  }

  const { setPreference } = useCharacterPreferences(characterSheet)

  // L'autre page relit la préférence dans la réponse partagée de `useFetch` (même clé) : sans l'enregistrer puis la
  // relire avant de partir, elle verrait l'ancien choix et renverrait ici.
  async function switchSheetDesign(newSheet: boolean) {
    setPreference('newSheet', newSheet)
    await saveNow()
    const target = newSheet ? newSheetPath(charId.value) : `/characters/${charId.value}`
    if (route.path === target) return
    await refreshSheet()
    await navigateTo(target)
  }

  return { characterSheet, refreshSheet, autoSaveStatus, saveNow, retrySave, switchSheetDesign }
}

/**
 * Quand la file de synchro d'un perso vient d'être vidée, ou après un conflit résolu, on re-fetch pour
 * récupérer l'état serveur canonique (vrais ids des objets ajoutés, recalcul du repos…).
 */
export function useSheetReconciliation(charId: Ref<number>, refreshers: Array<() => Promise<unknown>>) {
  const reconcile = () => Promise.all(refreshers.map(refresh => refresh()))

  const { lastSynced } = useOfflineSync()
  watch(lastSynced, (synced) => {
    if (!synced || synced.characterId !== charId.value) return
    if (hasPending(charId.value)) return // de nouvelles modifs sont déjà en file → on attend
    void reconcile()
  })

  return { reconcile }
}

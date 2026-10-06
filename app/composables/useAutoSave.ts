import { ref, type InjectionKey, type Ref } from 'vue'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const autoSaveStatusKey: InjectionKey<Ref<AutoSaveStatus>> = Symbol('autoSaveStatus')

const SAVED_FLASH_MS = 2500

interface AutoSaveOptions {
  delay: number
  // Plafond d'attente en frappe continue : sans lui, le debounce ne sauverait jamais pendant une saisie.
  maxWait: number
  onError?: (err: unknown) => void
}

/**
 * Debounce d'une sauvegarde, avec un seul `save` en vol à la fois : un PUT de fiche entière lancé
 * pendant qu'un autre court encore pourrait arriver dans le désordre et écraser l'état le plus récent.
 */
export function useAutoSave(save: () => Promise<void>, { delay, maxWait, onError }: AutoSaveOptions) {
  const status = ref<AutoSaveStatus>('idle')
  let timer: ReturnType<typeof setTimeout> | null = null
  let flashTimer: ReturnType<typeof setTimeout> | null = null
  let firstScheduledAt = 0
  let inFlight = false
  let changedWhileInFlight = false

  function schedule() {
    if (flashTimer) clearTimeout(flashTimer)
    status.value = 'saving'
    if (inFlight) {
      changedWhileInFlight = true
      return
    }
    if (timer) clearTimeout(timer)
    else firstScheduledAt = Date.now()
    const remaining = maxWait - (Date.now() - firstScheduledAt)
    timer = setTimeout(run, Math.max(0, Math.min(delay, remaining)))
  }

  async function run() {
    timer = null
    inFlight = true
    changedWhileInFlight = false
    let failed = false
    try {
      await save()
    } catch (err) {
      failed = true
      onError?.(err)
    }
    inFlight = false
    if (changedWhileInFlight) {
      schedule()
      return
    }
    status.value = failed ? 'error' : 'saved'
    if (!failed) {
      flashTimer = setTimeout(() => {
        status.value = 'idle'
      }, SAVED_FLASH_MS)
    }
  }

  /** Envoie tout de suite une sauvegarde en attente (fermeture de l'onglet, changement de page). */
  async function flush() {
    if (!timer) return
    clearTimeout(timer)
    await run()
  }

  return { status, schedule, flush }
}

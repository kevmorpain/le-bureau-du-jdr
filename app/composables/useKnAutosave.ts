import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'

export type KnSaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const AUTOSAVE_DELAY_MS = 1000

export function useKnAutosave(character: Ref<KnCharacter | undefined | null>) {
  const state = ref<KnSaveState>('idle')
  let timer: ReturnType<typeof setTimeout> | null = null
  let version = 0
  let queue: Promise<void> = Promise.resolve()

  async function put() {
    const current = character.value
    if (!current) return
    const sent = version
    state.value = 'saving'
    try {
      await $fetch(`/api/ker-nethalas/characters/${current.id}`, { method: 'PUT', body: current })
      state.value = version === sent ? 'saved' : 'pending'
    } catch {
      state.value = 'error'
    }
  }

  function flush() {
    if (timer === null) return
    clearTimeout(timer)
    timer = null
    queue = queue.then(put)
  }

  watch(character, () => {
    version++
    state.value = 'pending'
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(flush, AUTOSAVE_DELAY_MS)
  }, { deep: true })

  onBeforeUnmount(flush)

  return { state }
}

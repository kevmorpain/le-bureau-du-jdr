import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'

export function useKnAutosave(character: Ref<KnCharacter | undefined | null>) {
  const { status, schedule, flush } = useAutoSave(async () => {
    const current = character.value
    if (!current) return
    await $fetch(`/api/ker-nethalas/characters/${current.id}`, { method: 'PUT', body: current })
  }, { delay: 1000, maxWait: 5000 })

  watch(character, schedule, { deep: true })
  onBeforeUnmount(flush)

  return { status }
}

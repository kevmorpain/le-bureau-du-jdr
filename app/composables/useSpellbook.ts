import { useStorage } from '@vueuse/core'

export const useSpellbook = () => {
  const spellBook = useStorage<Spell[]>('spellbook', [])

  return {
    spellBook,
  }
}

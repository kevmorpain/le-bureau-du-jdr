import { sheetTextField } from './sheetField'

const LEGACY_NOTES_KEY = 'cs-quick-notes'

export const useQuickNotes = (characterSheet: Ref<CharacterSheet>) => {
  const notes = sheetTextField(characterSheet, 'notes')

  // The legacy key was global, not per character: it is removed once read so another sheet never picks it up again.
  onMounted(() => {
    if (notes.value) return
    try {
      const legacy = localStorage.getItem(LEGACY_NOTES_KEY)
      if (legacy) {
        notes.value = legacy
        localStorage.removeItem(LEGACY_NOTES_KEY)
      }
    } catch { /* localStorage unavailable */ }
  })

  return { notes }
}

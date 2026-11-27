import { forgetCharacterStorage } from './storage'

// A deletion needs the network: queued offline, the queue would replay the sheet's own pending saves first.
export const deleteCharacterSheet = async (characterId: number): Promise<void> => {
  await $fetch(`/api/character_sheets/${characterId}`, { method: 'DELETE' })
  forgetCharacterStorage(characterId)
}

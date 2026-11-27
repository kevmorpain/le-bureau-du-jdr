export const characterStorageKey = (characterId: number | undefined, suffix: string): string =>
  characterId ? `char:${characterId}:${suffix}` : suffix

// Offline queue, snapshots and encounter state of a deleted character would otherwise be replayed or linger.
export const forgetCharacterStorage = (characterId: number): void => {
  if (import.meta.server) return
  const prefix = characterStorageKey(characterId, '')
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
  for (const key of keys) {
    if (key?.startsWith(prefix)) localStorage.removeItem(key)
  }
}

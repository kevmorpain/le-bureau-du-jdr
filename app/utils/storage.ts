export const characterStorageKey = (characterId: number | undefined, suffix: string): string =>
  characterId ? `char:${characterId}:${suffix}` : suffix

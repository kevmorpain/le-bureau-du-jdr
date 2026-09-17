// Critère partagé par le seed (effets de maîtrise fixes) et createCharacter (grants) : l'ensemble dérivé
// doit rester égal à l'ensemble stocké.

export function isChoiceProficiency(entry: string): boolean {
  return entry.toLowerCase().includes('choix') || entry.includes('×')
}

export function fixedProficiencies(entries: string[]): string[] {
  return entries.filter(e => !isChoiceProficiency(e))
}

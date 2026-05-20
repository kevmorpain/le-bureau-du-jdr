// Niveaux d'ASI (Amélioration de caractéristique) standards en D&D 5e 2014.
// Référence : 4, 8, 12, 16, 19 pour la plupart des classes.
// Exceptions :
//  - Guerrier : ajoute 6 et 14
//  - Roublard : ajoute 10
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

const CLASS_ASI_LEVELS: Record<string, number[]> = {
  Guerrier: [4, 6, 8, 12, 14, 16, 19],
  Roublard: [4, 8, 10, 12, 16, 19],
}

export function getASILevels(className: string): number[] {
  return CLASS_ASI_LEVELS[className] ?? DEFAULT_ASI_LEVELS
}

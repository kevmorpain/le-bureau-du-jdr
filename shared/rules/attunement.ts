// Un personnage ne peut pas être harmonisé à plus de trois objets magiques à la fois.
export const ATTUNEMENT_LIMIT = 3

export const canAttune = (attunedCount: number): boolean => attunedCount < ATTUNEMENT_LIMIT

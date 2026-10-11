// Les jets d'une entrée du chemin du Domaine, après la forme et les dés d'usage.
export type KnVisitTable = 'description' | 'encounter' | 'event' | 'door' | 'scavenge'

export const KN_SHAPE_DIE = 100

// Forme de la pièce : 1-25 un couloir, 26-100 une salle.
export const KN_CORRIDOR_MAX_ROLL = 25

export const knShapeKind = (roll: number): 'corridor' | 'room' => roll <= KN_CORRIDOR_MAX_ROLL ? 'corridor' : 'room'

export const KN_ENCOUNTER_DIE = 20

// Rencontre de combat : D20, 10 ou plus dans une salle, 15 ou plus dans un couloir.
export const KN_ENCOUNTER_THRESHOLD = { room: 10, corridor: 15 } as const

export const knEncounterTriggered = (kind: 'room' | 'corridor', roll: number) => roll >= KN_ENCOUNTER_THRESHOLD[kind]

export const KN_DOOR_DIE = 10

// Y a-t-il une porte ? D10 : 1-5 oui, 6-10 non.
export const knHasDoor = (roll: number) => roll <= 5

export const KN_OBSTACLE_KINDS = ['door', 'container'] as const

export type KnObstacleKind = (typeof KN_OBSTACLE_KINDS)[number]

export const KN_TRAP_DIE = 10

// Piégé : D10, 7 ou plus.
export const knIsTrapped = (roll: number) => roll >= 7

export const KN_LOCK_DIE = 20

// Verrouillé : D20, 12 ou plus pour une porte, 10 ou plus pour un contenant.
export const KN_LOCK_THRESHOLD: Record<KnObstacleKind, number> = { door: 12, container: 10 }

export const knIsLocked = (kind: KnObstacleKind, roll: number) => roll >= KN_LOCK_THRESHOLD[kind]

export const KN_DEEP_SEARCH_DIE = 10

export const KN_DEEP_SEARCH_EXHAUSTION = 2

// Fouille approfondie : D10, 1-5 le contenant est vide, 6-10 il contient du butin.
export const knDeepSearchEmpty = (roll: number) => roll <= 5

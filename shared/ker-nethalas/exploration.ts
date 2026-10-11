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

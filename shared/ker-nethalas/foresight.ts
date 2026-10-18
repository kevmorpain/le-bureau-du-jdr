import { KN_DOOR_DIE, KN_ENCOUNTER_DIE, KN_SHAPE_DIE, knShapeKind } from './exploration'
import {
  KN_FORESIGHT_MAX,
  knCurrentDomain,
  knLocationVisit,
  knRecordCreature,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRollDie,
  knStartVisit,
  knVisitCanHaveEncounter,
  knVisitCanHaveEvent,
  type KnRng,
  type KnRun,
  type KnVisit,
} from './run'
import { knRollDescription } from './entryRolls'
import { KN_EXPLORATION_TABLES } from './tables'

// Une pièce pressentie : on la tire comme une entrée nouvelle (forme, description, porte, rencontre et créature, événement), sans
// bouger ni entamer la lumière, puis on garde ce qu'elle a donné. Le Dé de Tension, le Lair et la Sortie se tirent à l'entrée réelle.
function foreseeRoom(run: KnRun, rng: KnRng): KnVisit | undefined {
  const shape = knRollDie(KN_SHAPE_DIE, rng)
  let next = knStartVisit({ ...run, domains: run.domains.map((domain, index) => index === run.current ? { ...domain, foresight: undefined } : domain) }, knShapeKind(shape), shape)
  next = knRollDescription(next, rng)
  next = knRecordDoor(next, knRollDie(KN_DOOR_DIE, rng))

  const visit = knLocationVisit(next)
  if (visit && knVisitCanHaveEncounter(visit)) next = knRecordEncounter(next, knRollDie(KN_ENCOUNTER_DIE, rng))
  if (knLocationVisit(next)?.encounter?.triggered) next = knRecordCreature(next, knRollDie(6, rng), knRollDie(20, rng))

  const eventful = knLocationVisit(next)
  if (eventful && knVisitCanHaveEvent(eventful)) next = knRecordEvent(next, knRollDie(KN_EXPLORATION_TABLES.events.die, rng))

  const room = knLocationVisit(next)
  if (!room) return undefined
  const { kind, shape: seenShape, description, door, encounter, event, creatures } = room
  return {
    kind,
    usageKind: null,
    ...(seenShape ? { shape: seenShape } : {}),
    ...(description ? { description } : {}),
    ...(door ? { door } : {}),
    ...(encounter ? { encounter } : {}),
    ...(event ? { event } : {}),
    ...(creatures?.length ? { creatures } : {}),
  }
}

// Projeter l'esprit : jusqu'à `count` pièces à venir (5 au plus) se pressentent, et remplacent les précédentes. Le Domaine
// d'introduction a une carte fixe : rien à pressentir.
export function knProjectRooms(run: KnRun, count: number, rng: KnRng = Math.random): KnRun {
  if (knCurrentDomain(run).intro) return run
  const rooms: KnVisit[] = []
  for (let i = 0; i < Math.min(KN_FORESIGHT_MAX, Math.max(0, Math.trunc(count))); i++) {
    const room = foreseeRoom(run, rng)
    if (room) rooms.push(room)
  }
  if (!rooms.length) return run
  return { ...run, domains: run.domains.map((domain, index) => index === run.current ? { ...domain, foresight: rooms } : domain) }
}

export const knForesight = (run: KnRun): KnVisit[] => knCurrentDomain(run).foresight ?? []

export function knClearForesight(run: KnRun): KnRun {
  return { ...run, domains: run.domains.map((domain, index) => {
    if (index !== run.current) return domain
    const { foresight: _gone, ...rest } = domain
    return rest
  }) }
}

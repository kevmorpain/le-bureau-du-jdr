import { KN_DOOR_DIE, KN_ENCOUNTER_DIE } from './exploration'
import {
  knCurrentDomain,
  knCurrentVisit,
  knForeseenRoll,
  knLocationVisit,
  knRecordCreature,
  knRecordDescription,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRecordTension,
  knRecordUsage,
  knRetracing,
  knRollDie,
  knVisitCanHaveEncounter,
  knVisitCanHaveEvent,
  type KnRng,
  type KnRun,
  type KnVisit,
} from './run'
import { KN_EXPLORATION_TABLES } from './tables'

// Tout ce qui se lance sans choix du joueur en entrant : le Dé de Tension, le Dé de Lair ou de Sortie, puis, dans la pièce, la porte,
// la rencontre de combat et l'événement. Faire un choix (engager, fouiller, tirer l'événement d'Obscurité) reste à lui.
export function knEntryPending(visit: KnVisit, intro: boolean, retracing: boolean): boolean {
  if (retracing) return false
  if (!visit.tension || (visit.usageKind && !visit.usage)) return true
  if (visit.kind === 'revisit') return false
  if (!intro && !visit.door) return true
  if (knVisitCanHaveEncounter(visit) && !visit.encounter) return true
  return knVisitCanHaveEvent(visit) && !visit.event
}

export function knRollEntry(run: KnRun, rng: KnRng = Math.random): KnRun {
  let next = run

  const last = knCurrentVisit(next)
  if (last && !last.tension) next = knRecordTension(next, knRollDie(next.tensionDie, rng), false)

  const entered = knCurrentVisit(next)
  if (entered?.usageKind && !entered.usage) {
    const domain = knCurrentDomain(next)
    next = knRecordUsage(next, knRollDie(entered.usageKind === 'lair' ? domain.lairDie : domain.exitDie, rng), false)
  }

  if (knRetracing(next)) return next

  const intro = !!knCurrentDomain(next).intro
  const door = knLocationVisit(next)
  if (door && door.kind !== 'revisit' && !intro && !door.door) next = knRecordDoor(next, knForeseenRoll(next, 'door') ?? knRollDie(KN_DOOR_DIE, rng))

  const encounter = knLocationVisit(next)
  if (encounter && !encounter.encounter && knVisitCanHaveEncounter(encounter)) {
    next = knRecordEncounter(next, knForeseenRoll(next, 'encounter') ?? knRollDie(KN_ENCOUNTER_DIE, rng))
    for (const { d6, d20 } of knLocationVisit(next)?.encounter?.triggered ? knLocationVisit(next)?.foreseen?.creatures ?? [] : []) next = knRecordCreature(next, d6, d20)
  }

  const event = knLocationVisit(next)
  if (event && !event.event && knVisitCanHaveEvent(event)) next = knRecordEvent(next, knForeseenRoll(next, 'event') ?? knRollDie(KN_EXPLORATION_TABLES.events.die, rng))

  return next
}

// La description d'une nouvelle salle ou d'un nouveau couloir ne demande aucun choix : elle se tire à l'entrée.
export function knRollDescription(run: KnRun, rng: KnRng = Math.random): KnRun {
  const visit = knCurrentVisit(run)
  if (!visit || visit.kind === 'revisit' || visit.description) return run
  const die = KN_EXPLORATION_TABLES[visit.kind === 'corridor' ? 'corridorDescriptions' : 'roomDescriptions'].die
  return knRecordDescription(run, knForeseenRoll(run, 'description') ?? knRollDie(die, rng))
}

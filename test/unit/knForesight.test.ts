import { describe, expect, it } from 'vitest'
import { knRollDescription, knRollEntry } from '../../shared/ker-nethalas/entryRolls'
import { knClearForesight, knForesight, knProjectRooms } from '../../shared/ker-nethalas/foresight'
import { knMasteryAbilitySchema } from '../../shared/ker-nethalas/masteries'
import { KN_FORESIGHT_MAX, emptyKnRun, knCurrentDomain, knCurrentVisit, knForeseenRoll, knRunSchema, knStartVisit } from '../../shared/ker-nethalas/run'
import { fakeMastery } from '../fixtures/knMasteries'

// Des tirages qui montent, pour que chaque pièce pressentie diffère de la précédente.
const climbing = () => {
  let i = 0
  return () => ((i++ * 0.137) % 1)
}

describe('projection de l\'esprit', () => {
  it('pressent jusqu\'à cinq pièces sans bouger ni entamer la lumière', () => {
    const run = emptyKnRun()
    const projected = knProjectRooms(run, 9, climbing())

    expect(knForesight(projected)).toHaveLength(KN_FORESIGHT_MAX)
    expect(knCurrentDomain(projected).visits).toEqual(knCurrentDomain(run).visits)
    expect(projected.lightRemaining).toBe(run.lightRemaining)
    expect(knRunSchema.safeParse(projected).success).toBe(true)
    expect(knForesight(knProjectRooms(run, 2, climbing()))).toHaveLength(2)
    expect(knForesight(knProjectRooms(run, 0, climbing()))).toEqual([])
  })

  it('chaque pièce pressentie a sa forme, sa description et sa porte, et les rencontres déclenchées ont leur créature', () => {
    const rooms = knForesight(knProjectRooms(emptyKnRun(), 5, climbing()))

    for (const room of rooms) {
      expect(['room', 'corridor']).toContain(room.kind)
      expect(room.shape).toBeDefined()
      expect(room.description).toBeDefined()
      expect(room.door).toBeDefined()
      if (room.encounter?.triggered) expect(room.creatures).toHaveLength(1)
      if (room.event) expect(room.kind).toBe('room')
    }
  })

  it('la prochaine entrée nouvelle est la première pièce pressentie, quoi qu\'on demande', () => {
    const projected = knProjectRooms(emptyKnRun(), 3, climbing())
    const [first, second] = knForesight(projected)
    const wrong = first!.kind === 'room' ? 'corridor' : 'room'

    const entered = knStartVisit(projected, wrong, 50)
    const visit = knCurrentVisit(entered)!

    expect(visit.kind).toBe(first!.kind)
    expect(visit.shape).toEqual(first!.shape)
    expect(visit.foreseen).toMatchObject({ description: first!.description?.roll, door: first!.door?.roll })
    expect(knForesight(entered)).toEqual([second, knForesight(projected)[2]])
  })

  it('un retour ou une entrée du Domaine d\'introduction ne consomme pas la projection', () => {
    const projected = knProjectRooms(emptyKnRun(), 2, climbing())

    expect(knForesight(knStartVisit(projected, 'room', 90, { room: 1 }))).toHaveLength(2)
  })

  it('l\'entrée reprend les tirages vus au lieu d\'en faire de nouveaux', () => {
    const projected = knProjectRooms(emptyKnRun(), 1, climbing())
    const room = knForesight(projected)[0]!
    const entered = knRollEntry(knRollDescription(knStartVisit(projected, 'room', 90), () => 0.99), () => 0.99)
    const visit = knCurrentVisit(entered)!

    expect(visit.description?.roll).toBe(room.description?.roll)
    expect(visit.door?.roll).toBe(room.door?.roll)
    expect(visit.encounter?.roll).toBe(room.encounter?.roll)
    expect(visit.event?.roll).toBe(room.event?.roll)
    expect(knForeseenRoll(entered, 'door')).toBe(room.door?.roll)
    expect(knForeseenRoll(emptyKnRun(), 'door')).toBeUndefined()
  })

  it('oublier la projection la retire, et une projection n\'a pas lieu dans le Domaine d\'introduction', () => {
    const projected = knProjectRooms(emptyKnRun(), 2, climbing())
    const intro = { ...projected, domains: projected.domains.map(domain => ({ ...domain, intro: { map: [] } as never })) }

    expect(knForesight(knClearForesight(projected))).toEqual([])
    expect(knClearForesight(projected).domains[0]).not.toHaveProperty('foresight')
    expect(knProjectRooms(intro as never, 3, climbing())).toBe(intro)
  })
})

describe('aptitude de projection', () => {
  it('se décrit par un nombre de pièces entre 1 et 5', () => {
    const ability = fakeMastery('alpha').abilities[0]!

    expect(knMasteryAbilitySchema.safeParse({ ...ability, project: 5 }).success).toBe(true)
    expect(knMasteryAbilitySchema.safeParse({ ...ability, project: 6 }).success).toBe(false)
    expect(knMasteryAbilitySchema.safeParse({ ...ability, project: 0 }).success).toBe(false)
  })
})

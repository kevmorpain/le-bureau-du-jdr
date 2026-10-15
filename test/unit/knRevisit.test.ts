import { describe, expect, it } from 'vitest'
import {
  emptyKnRun,
  knAddDoorObstacle,
  knCurrentDomain,
  knCurrentVisit,
  knFlee,
  knLocationVisit,
  knPreviousRoomIndex,
  knRecordDescription,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRecordScavenge,
  knRecordTension,
  knResumeCombat,
  knRetracing,
  knSetTrader,
  knStartCombat,
  knStartVisit,
  type KnRun,
} from '../../shared/ker-nethalas/run'

const visits = (run: KnRun) => knCurrentDomain(run).visits

// Un chemin : salle (0), couloir (1), salle (2).
const path = (): KnRun => ['room', 'corridor', 'room'].reduce((run, kind) => knStartVisit(run, kind as 'room' | 'corridor'), emptyKnRun())

const creature = (name: string, health: number) => ({ name, health, maxHealth: 8 })

describe('retour dans une pièce déjà explorée', () => {
  it('le retour désigne la pièce, qui reçoit un identifiant', () => {
    const back = knStartVisit(path(), 'revisit', undefined, undefined, 0)
    const [room] = visits(back)
    expect(room!.id).toBe(1)
    expect(visits(back).at(-1)).toMatchObject({ kind: 'revisit', of: 1 })
    expect(visits(knStartVisit(back, 'revisit', undefined, undefined, 0)).at(-1)!.of).toBe(1)
  })

  it('sans cible, un retour reste une entrée libre, comme avant', () => {
    const back = knStartVisit(path(), 'revisit')
    expect(visits(back).at(-1)!.of).toBeUndefined()
    expect(knRetracing(back)).toBe(false)
    expect(knLocationVisit(back)!.kind).toBe('revisit')
  })

  it('la pièce où l\'on se trouve est celle du retour', () => {
    const back = knStartVisit(path(), 'revisit', undefined, undefined, 0)
    expect(knRetracing(back)).toBe(true)
    expect(knLocationVisit(back)).toBe(visits(back)[0])
    expect(knRetracing(path())).toBe(false)
  })

  it('le Dé de Tension du retour se note sur le retour, pas sur la pièce', () => {
    const back = knRecordTension(knStartVisit(path(), 'revisit', undefined, undefined, 0), 5, false)
    expect(knCurrentVisit(back)!.tension).toBeDefined()
    expect(visits(back)[0]!.tension).toBeUndefined()
  })

  it('on peut fouiller, une seule fois, une pièce où l\'on retourne', () => {
    const back = knStartVisit(path(), 'revisit', undefined, undefined, 0)
    const searched = knRecordScavenge(back, 7)
    expect(visits(searched)[0]!.scavenge?.roll).toBe(7)
    expect(visits(searched).at(-1)!.scavenge).toBeUndefined()
    expect(knRecordScavenge(searched, 9)).toBe(searched)
  })

  it('une pièce déjà fouillée ne se fouille pas de nouveau', () => {
    const searched = knRecordScavenge(knStartVisit(emptyKnRun(), 'room'), 3)
    const back = knStartVisit(searched, 'revisit', undefined, undefined, 0)
    expect(knRecordScavenge(back, 8)).toBe(back)
  })

  it('pas de rencontre de combat, d\'événement ni de description en repassant par une pièce', () => {
    const back = knStartVisit(path(), 'revisit', undefined, undefined, 0)
    expect(knRecordEncounter(back, 12)).toBe(back)
    expect(knRecordEvent(back, 12)).toBe(back)
    expect(knRecordDescription(back, 4)).toBe(back)
  })

  it('un piège ou une porte de la pièce se règlent depuis le retour', () => {
    const marked = knRecordDoor(knStartVisit(emptyKnRun(), 'room'), 1)
    const back = knStartVisit(knStartVisit(marked, 'room'), 'revisit', undefined, undefined, 0)
    const added = knAddDoorObstacle(back)
    expect(visits(added)[0]!.obstacles).toHaveLength(1)
    expect(visits(added).at(-1)!.obstacles).toBeUndefined()
  })

  it('le marchand d\'une pièce se retrouve en y retournant', () => {
    const marked = knSetTrader(knStartVisit(emptyKnRun(), 'room'), true)
    const away = knStartVisit(marked, 'room')
    const back = knStartVisit(away, 'revisit', undefined, undefined, 0)
    expect(knLocationVisit(away)!.trader).toBeUndefined()
    expect(knLocationVisit(back)!.trader).toBe(true)
  })
})

describe('fuite et reprise du combat', () => {
  it('la pièce précédente est la dernière pièce ou le dernier couloir avant la pièce courante', () => {
    expect(knPreviousRoomIndex(path())).toBe(1)
    expect(knPreviousRoomIndex(knStartVisit(emptyKnRun(), 'room'))).toBeUndefined()
    const back = knStartVisit(path(), 'revisit', undefined, undefined, 2)
    expect(knPreviousRoomIndex(back)).toBe(1)
  })

  it('fuir arrête le combat et garde les créatures vivantes, à pleine Santé', () => {
    const fighting = knStartCombat(path(), [creature('Loup 1', 3), creature('Loup 2', 0), { ...creature('Loup 3', 5), temporary: 2 }])
    const fled = knFlee(fighting)
    expect(fled.combat).toBeUndefined()
    expect(visits(fled).at(-1)!.fled!.creatures).toEqual([creature('Loup 1', 8), creature('Loup 3', 8)])
  })

  it('reprendre le combat remet les créatures et efface la fuite', () => {
    const fled = knFlee(knStartCombat(path(), [creature('Loup', 2)], true))
    const resumed = knResumeCombat(fled)
    expect(resumed.combat!.creatures).toEqual([creature('Loup', 8)])
    expect(resumed.combat!.overseer).toBe(true)
    expect(visits(resumed).at(-1)!.fled).toBeUndefined()
    expect(knResumeCombat(resumed)).toBe(resumed)
  })

  it('rien ne se reprend sans avoir fui', () => {
    const run = path()
    expect(knResumeCombat(run)).toBe(run)
  })

  it('fuir sans combat ne change rien', () => {
    const run = path()
    expect(knFlee(run)).toBe(run)
  })
})

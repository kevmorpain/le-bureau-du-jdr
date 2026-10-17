import { describe, expect, it } from 'vitest'
import { knEntryPending, knRollDescription, knRollEntry } from '../../shared/ker-nethalas/entryRolls'
import { emptyKnRun, knCurrentDomain, knStartVisit, type KnRun } from '../../shared/ker-nethalas/run'

const visits = (run: KnRun) => knCurrentDomain(run).visits
const high = () => 0.999
const low = () => 0

describe('dés d\'entrée', () => {
  it('une nouvelle salle : Tension, Lair, porte, rencontre, puis événement si rien ne se déclenche', () => {
    const entered = knRollEntry(knStartVisit(emptyKnRun(), 'room'), low)
    const room = visits(entered)[0]!
    expect(room.tension?.roll).toBe(1)
    expect(room.usage?.roll).toBe(1)
    expect(room.door?.roll).toBe(1)
    expect(room.encounter).toEqual({ roll: 1, triggered: false })
    expect(room.event?.roll).toBe(1)
  })

  it('une rencontre déclenchée ne laisse pas d\'événement à tirer', () => {
    const room = visits(knRollEntry(knStartVisit(emptyKnRun(), 'room'), high))[0]!
    expect(room.encounter?.triggered).toBe(true)
    expect(room.event).toBeUndefined()
  })

  it('un couloir n\'a pas d\'événement', () => {
    const corridor = visits(knRollEntry(knStartVisit(emptyKnRun(), 'corridor'), low))[0]!
    expect(corridor.encounter).toBeDefined()
    expect(corridor.event).toBeUndefined()
  })

  it('ce qui est déjà tiré ne se retire pas', () => {
    const once = knRollEntry(knStartVisit(emptyKnRun(), 'room'), low)
    expect(knRollEntry(once, high)).toEqual(once)
  })

  it('un retour ne tire que son Dé de Tension', () => {
    const away = knStartVisit(knStartVisit(emptyKnRun(), 'room'), 'room')
    const back = knRollEntry(knStartVisit(away, 'revisit', undefined, undefined, 0), low)
    expect(visits(back).at(-1)!.tension?.roll).toBe(1)
    expect(visits(back)[0]!.door).toBeUndefined()
    expect(visits(back)[0]!.encounter).toBeUndefined()
  })

  it('une ancienne entrée de retour sans cible ne tire que sa Tension', () => {
    const back = visits(knRollEntry(knStartVisit(knStartVisit(emptyKnRun(), 'room'), 'revisit'), low)).at(-1)!
    expect(back.tension).toBeDefined()
    expect(back.door).toBeUndefined()
    expect(back.encounter).toBeUndefined()
  })

  it('sait ce qu\'il reste à tirer', () => {
    const fresh = visits(knStartVisit(emptyKnRun(), 'room'))[0]!
    expect(knEntryPending(fresh, false, false)).toBe(true)
    expect(knEntryPending(fresh, false, true)).toBe(false)
    expect(knEntryPending(visits(knRollEntry(knStartVisit(emptyKnRun(), 'room'), low))[0]!, false, false)).toBe(false)
  })

  it('tire la description d\'une salle ou d\'un couloir, une seule fois', () => {
    const room = knRollDescription(knStartVisit(emptyKnRun(), 'room'), low)
    expect(visits(room)[0]!.description?.roll).toBe(1)
    expect(knRollDescription(room, high)).toBe(room)
    const back = knStartVisit(room, 'revisit')
    expect(knRollDescription(back, low)).toBe(back)
  })
})

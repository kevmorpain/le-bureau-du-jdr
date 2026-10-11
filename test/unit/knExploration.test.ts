import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { knDeepSearchEmpty, knEncounterTriggered, knHasDoor, knIsLocked, knIsTrapped, knShapeKind } from '../../shared/ker-nethalas/exploration'
import {
  KN_RUN_BOUNDS,
  emptyKnRun,
  knAddDoorObstacle,
  knCurrentDomain,
  knCurrentVisit,
  knDrawGrowingDarkness,
  knMarkScavengeApplied,
  knObstacleState,
  knRecordDeepSearchContent,
  knRecordDescription,
  knRecordDoor,
  knRecordEncounter,
  knRecordEvent,
  knRecordExtraDarkness,
  knRecordExtraTension,
  knRecordLock,
  knRecordScavenge,
  knRecordTrap,
  knRecordTrapType,
  knSetPerception,
  knStartDeepSearch,
  knStartVisit,
  knUndoLastVisit,
  knVisitCanHaveEvent,
  knVisitCanSearch,
  knRunSchema,
  type KnRun,
} from '../../shared/ker-nethalas/run'
import {
  KN_EXPLORATION_TABLES,
  knApplyTableEffects,
  knRangeLabel,
  knRollTableSchema,
  knTableEntry,
  type KnRollTable,
  type KnTableEffect,
} from '../../shared/ker-nethalas/tables'
import { fakeTable } from '../fixtures/knTables'

describe('règles de l\'exploration', () => {
  it('la forme du D100 décide : 1-25 un couloir, 26-100 une salle', () => {
    expect(knShapeKind(1)).toBe('corridor')
    expect(knShapeKind(25)).toBe('corridor')
    expect(knShapeKind(26)).toBe('room')
    expect(knShapeKind(100)).toBe('room')
  })

  it('une rencontre de combat demande 10 ou plus en salle, 15 ou plus en couloir', () => {
    expect([9, 10].map(roll => knEncounterTriggered('room', roll))).toEqual([false, true])
    expect([14, 15].map(roll => knEncounterTriggered('corridor', roll))).toEqual([false, true])
  })

  it('il y a une porte sur 1-5 au D10', () => {
    expect([1, 5, 6, 10].map(knHasDoor)).toEqual([true, true, false, false])
  })
})

describe('tables de dés', () => {
  it('une table qui couvre le dé sans trou ni recouvrement est valide', () => {
    expect(knRollTableSchema(20).safeParse(fakeTable(20)).success).toBe(true)
    expect(knRollTableSchema(100).safeParse(fakeTable(100, [[1, 10], [11, 11], [12, 100]])).success).toBe(true)
  })

  it('refuse un trou, un recouvrement, un début hors 1, une fin avant le dé et un dé qui ne correspond pas', () => {
    expect(knRollTableSchema(20).safeParse(fakeTable(20, [[1, 5], [7, 20]])).success).toBe(false)
    expect(knRollTableSchema(20).safeParse(fakeTable(20, [[1, 10], [10, 20]])).success).toBe(false)
    expect(knRollTableSchema(20).safeParse(fakeTable(20, [[2, 20]])).success).toBe(false)
    expect(knRollTableSchema(20).safeParse(fakeTable(20, [[1, 19]])).success).toBe(false)
    expect(knRollTableSchema(20).safeParse(fakeTable(20, [[1, 21]])).success).toBe(false)
    expect(knRollTableSchema(100).safeParse(fakeTable(20)).success).toBe(false)
  })

  it('refuse une entrée vide ou à l\'envers', () => {
    expect(knRollTableSchema(20).safeParse({ die: 20, entries: [{ min: 1, max: 20, text: '' }] }).success).toBe(false)
    expect(knRollTableSchema(20).safeParse({ die: 20, entries: [{ min: 20, max: 1, text: 'x' }] }).success).toBe(false)
    expect(knRollTableSchema(20).safeParse({ die: 20, entries: [] }).success).toBe(false)
  })

  it('retrouve l\'entrée d\'un jet, et ne trouve rien sans table', () => {
    const table = fakeTable(20, [[1, 3], [4, 4], [5, 20]])

    expect(knTableEntry(table, 3)?.text).toBe('Résultat 1-3.')
    expect(knTableEntry(table, 4)?.text).toBe('Résultat 4.')
    expect(knTableEntry(table, 20)?.text).toBe('Résultat 5-20.')
    expect(knTableEntry(table, 21)).toBeUndefined()
    expect(knTableEntry(null, 3)).toBeUndefined()
    expect([knRangeLabel({ min: 1, max: 3 }), knRangeLabel({ min: 4, max: 4 })]).toEqual(['1-3', '4'])
  })

  it('refuse un effet inconnu et une provision inconnue', () => {
    const bad = (effects: unknown) => ({ die: 20, entries: [{ min: 1, max: 20, text: 'x', effects }] })

    expect(knRollTableSchema(20).safeParse(bad([{ kind: 'coins', dice: { count: 1, sides: 20, bonus: 0 } }])).success).toBe(true)
    expect(knRollTableSchema(20).safeParse(bad([{ kind: 'gold', dice: { count: 1, sides: 20, bonus: 0 } }])).success).toBe(false)
    expect(knRollTableSchema(20).safeParse(bad([{ kind: 'provision', key: 'gems', dice: { count: 1, sides: 4, bonus: 0 } }])).success).toBe(false)
  })

  it('les jeux de données d\'exploration sont enregistrés sous des noms valides', () => {
    for (const name of Object.keys(KN_EXPLORATION_TABLES)) {
      expect(Object.keys(KN_CONTENT_SCHEMAS), name).toContain(name)
      expect(KN_CONTENT_NAME_RE.test(name), name).toBe(true)
    }
    expect(KN_EXPLORATION_TABLES).toMatchObject({ corridorDescriptions: { die: 20 }, roomDescriptions: { die: 100 }, events: { die: 100 }, scavenging: { die: 20 }, traps: { die: 10 } })
  })

  it('une entrée peut porter la compétence qui évite le piège, pas une compétence inconnue', () => {
    const entry = (skill: string) => ({ die: 10, entries: [{ min: 1, max: 10, text: 'x', skill }] })

    expect(knRollTableSchema(10).safeParse(entry('dodge')).success).toBe(true)
    expect(knRollTableSchema(10).safeParse(entry('luck')).success).toBe(false)
  })
})

describe('verrous et pièges', () => {
  it('piégé à 7 ou plus au D10', () => {
    expect([6, 7].map(knIsTrapped)).toEqual([false, true])
  })

  it('verrouillé à 12 ou plus pour une porte, 10 ou plus pour un contenant', () => {
    expect([11, 12].map(roll => knIsLocked('door', roll))).toEqual([false, true])
    expect([9, 10].map(roll => knIsLocked('container', roll))).toEqual([false, true])
  })

  it('fouille approfondie : 1-5 vide, 6-10 du butin', () => {
    expect([5, 6].map(knDeepSearchEmpty)).toEqual([true, false])
  })
})

describe('obstacles d\'une entrée', () => {
  const room = (doorRoll?: number): KnRun => {
    const entered = knStartVisit(emptyKnRun(), 'room')
    return doorRoll === undefined ? entered : knRecordDoor(entered, doorRoll)
  }
  const visit = (run: KnRun) => knCurrentVisit(run)!

  it('une porte ne se vérifie que si le D10 en a trouvé une', () => {
    expect(visit(knAddDoorObstacle(room(3))).obstacles).toEqual([{ kind: 'door' }])
    expect(visit(knAddDoorObstacle(room(8)))).not.toHaveProperty('obstacles')
    expect(visit(knAddDoorObstacle(room()))).not.toHaveProperty('obstacles')
  })

  it('plusieurs portes, dans la limite', () => {
    let run = room(1)
    for (let i = 0; i < KN_RUN_BOUNDS.obstacles + 3; i++) run = knAddDoorObstacle(run)

    expect(visit(run).obstacles).toHaveLength(KN_RUN_BOUNDS.obstacles)
  })

  it('le jet de piège suit le test de Perception, le type suit un piège, une seule fois chacun', () => {
    const base = knAddDoorObstacle(room(1))
    const noPerception = knRecordTrap(base, 0, 9)

    expect(visit(noPerception).obstacles![0]).toEqual({ kind: 'door' })

    const spotted = knRecordTrap(knSetPerception(base, 0, 'passed'), 0, 9)
    expect(visit(spotted).obstacles![0]).toEqual({ kind: 'door', perception: 'passed', trap: { roll: 9 } })
    expect(visit(knRecordTrap(spotted, 0, 2)).obstacles![0]!.trap).toEqual({ roll: 9 })
    expect(visit(knSetPerception(spotted, 0, 'failed')).obstacles![0]!.perception).toBe('passed')
    expect(knObstacleState(visit(spotted).obstacles![0]!)).toEqual({ trapped: true, spotted: true, locked: undefined })

    const typed = knRecordTrapType(spotted, 0, 4)
    expect(visit(typed).obstacles![0]!.trapType).toEqual({ roll: 4 })
    expect(visit(knRecordTrapType(typed, 0, 7)).obstacles![0]!.trapType).toEqual({ roll: 4 })
  })

  it('pas de type de piège sans piège', () => {
    const clear = knRecordTrap(knSetPerception(knAddDoorObstacle(room(1)), 0, 'passed'), 0, 6)

    expect(knObstacleState(visit(clear).obstacles![0]!).trapped).toBe(false)
    expect(visit(knRecordTrapType(clear, 0, 4)).obstacles![0]).not.toHaveProperty('trapType')
  })

  it('un piège non repéré se déclenche : il n\'est pas « repéré »', () => {
    const hidden = knRecordTrap(knSetPerception(knAddDoorObstacle(room(1)), 0, 'failed'), 0, 7)

    expect(knObstacleState(visit(hidden).obstacles![0]!)).toMatchObject({ trapped: true, spotted: false })
  })

  it('le verrou se juge selon la sorte d\'obstacle, une seule fois', () => {
    const locked = knRecordLock(knAddDoorObstacle(room(1)), 0, 12)

    expect(knObstacleState(visit(locked).obstacles![0]!).locked).toBe(true)
    expect(knObstacleState(visit(knRecordLock(knAddDoorObstacle(room(1)), 0, 11)).obstacles![0]!).locked).toBe(false)
    expect(visit(knRecordLock(locked, 0, 1)).obstacles![0]!.lock).toEqual({ roll: 12 })
  })

  it('un indice d\'obstacle inexistant ne change rien', () => {
    const run = knAddDoorObstacle(room(1))

    expect(knSetPerception(run, 3, 'passed')).toEqual(run)
    expect(knRecordLock(run, 3, 12)).toEqual(run)
  })

  it('le schéma du run accepte les obstacles enregistrés et refuse un jet hors dé', () => {
    const run = knRecordLock(knRecordTrap(knSetPerception(knAddDoorObstacle(room(1)), 0, 'passed'), 0, 8), 0, 20)

    expect(knRunSchema.safeParse(run).success).toBe(true)
    expect(knRunSchema.safeParse(knRecordTrap(knSetPerception(knAddDoorObstacle(room(1)), 0, 'passed'), 0, 11)).success).toBe(false)
  })
})

describe('fouille approfondie et tests de Tension supplémentaires', () => {
  const room = () => knStartVisit(emptyKnRun(), 'room')
  const visit = (run: KnRun) => knCurrentVisit(run)!

  it('lance tout de suite un Dé de Tension et ouvre un contenant à vérifier', () => {
    const run = knStartDeepSearch(room(), 5, false)

    expect(visit(run).deepSearch).toEqual({})
    expect(visit(run).obstacles).toEqual([{ kind: 'container' }])
    expect(visit(run).extraTension).toEqual([{ die: 8, roll: 5, manual: false, next: 8, triggered: false, source: 'search' }])
    expect(run.tensionDie).toBe(8)
  })

  it('un 1 ou 2 fait descendre le dé de Tension, comme pour l\'entrée', () => {
    const run = knStartDeepSearch(room(), 2, false)

    expect(run.tensionDie).toBe(6)
    expect(visit(run).extraTension![0]).toMatchObject({ die: 8, next: 6, triggered: false })
  })

  it('une seule fouille approfondie par entrée, jamais dans une zone explorée', () => {
    const once = knStartDeepSearch(room(), 5, false)

    expect(knStartDeepSearch(once, 5, false)).toBe(once)
    expect(knVisitCanSearch(visit(once))).toBe(false)
    expect(knStartDeepSearch(knStartVisit(emptyKnRun(), 'revisit'), 5, false)).toEqual(knStartVisit(emptyKnRun(), 'revisit'))
  })

  it('retient le contenu du contenant, une fois', () => {
    const run = knRecordDeepSearchContent(knStartDeepSearch(room(), 5, false), 8)

    expect(visit(run).deepSearch).toEqual({ content: { roll: 8 } })
    expect(visit(knRecordDeepSearchContent(run, 2)).deepSearch).toEqual({ content: { roll: 8 } })
    expect(visit(knRecordDeepSearchContent(room(), 8))).not.toHaveProperty('deepSearch')
  })

  it('le vacarme ajoute un test, et un déclenchement fait tirer un événement, une seule fois', () => {
    const base = { ...room(), tensionDie: 4 as const }
    const noisy = knRecordExtraTension(base, 1, true, 'noise')

    expect(visit(noisy).extraTension![0]).toMatchObject({ die: 4, triggered: true, manual: true, source: 'noise' })
    expect(noisy.tensionDie).toBe(8)

    const draw = knDrawGrowingDarkness(() => 0.2)
    const drawn = knRecordExtraDarkness(noisy, 0, draw)

    expect(visit(drawn).extraTension![0]!.darkness).toEqual(draw)
    expect(knCurrentDomain(drawn).growingDarkness).toHaveLength(1)
    expect(knRecordExtraDarkness(drawn, 0, knDrawGrowingDarkness(() => 0.7))).toEqual(drawn)
    expect(knRecordExtraDarkness(knRecordExtraTension(room(), 5, true, 'noise'), 0, draw)).toEqual(knRecordExtraTension(room(), 5, true, 'noise'))
  })

  it('borne le nombre de tests supplémentaires et valide le schéma', () => {
    let run = room()
    for (let i = 0; i < KN_RUN_BOUNDS.extraTension + 2; i++) run = knRecordExtraTension(run, 8, false, 'noise')

    expect(visit(run).extraTension).toHaveLength(KN_RUN_BOUNDS.extraTension)
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('annuler l\'entrée retire aussi ses obstacles et ses tests', () => {
    const run = knAddDoorObstacle(knStartDeepSearch(room(), 5, false))

    expect(knCurrentVisit(knUndoLastVisit(run))).toBeUndefined()
  })
})

describe('chemin du Domaine', () => {
  const entered = (kind: 'room' | 'corridor' | 'revisit', shape?: number): KnRun => knStartVisit(emptyKnRun(), kind, shape)
  const visit = (run: KnRun) => knCurrentVisit(run)!

  it('garde le D100 de forme qui a décidé du type d\'entrée', () => {
    expect(visit(entered('corridor', 12))).toMatchObject({ kind: 'corridor', shape: { roll: 12 } })
    expect(visit(entered('room'))).not.toHaveProperty('shape')
    expect(knRunSchema.safeParse(entered('room', 80)).success).toBe(true)
  })

  it('enregistre la description, le numéro seulement', () => {
    const run = knRecordDescription(entered('room'), 42)

    expect(visit(run).description).toEqual({ roll: 42 })
    expect(knRecordDescription(entered('revisit'), 3)).toEqual(entered('revisit'))
  })

  it('la rencontre de combat se juge selon le type, une seule fois', () => {
    expect(visit(knRecordEncounter(entered('room'), 10)).encounter).toEqual({ roll: 10, triggered: true })
    expect(visit(knRecordEncounter(entered('room'), 9)).encounter).toEqual({ roll: 9, triggered: false })
    expect(visit(knRecordEncounter(entered('corridor'), 14)).encounter).toEqual({ roll: 14, triggered: false })
    expect(visit(knRecordEncounter(entered('corridor'), 15)).encounter).toEqual({ roll: 15, triggered: true })

    const once = knRecordEncounter(entered('room'), 3)
    expect(visit(knRecordEncounter(once, 20)).encounter).toEqual({ roll: 3, triggered: false })
  })

  it('pas de rencontre de combat dans une zone explorée ni dans le Lair de l\'Overseer', () => {
    expect(visit(knRecordEncounter(entered('revisit'), 20))).not.toHaveProperty('encounter')

    const lair = knStartVisit({ ...emptyKnRun(), domains: [{ ...emptyKnRun().domains[0]!, lairFound: false }] }, 'room')
    const found = { ...lair, domains: [{ ...lair.domains[0]!, visits: [{ ...visit(lair), usage: { die: 4 as const, roll: 1, manual: false, next: 4 as const, triggered: true } }] }] }
    expect(visit(knRecordEncounter(found, 20))).not.toHaveProperty('encounter')
  })

  it('l\'événement ne se tire qu\'en salle, après une rencontre de combat évitée', () => {
    const noFight = knRecordEncounter(entered('room'), 2)
    const fight = knRecordEncounter(entered('room'), 18)

    expect(knVisitCanHaveEvent(visit(entered('room')))).toBe(false)
    expect(knVisitCanHaveEvent(visit(noFight))).toBe(true)
    expect(visit(knRecordEvent(noFight, 55)).event).toEqual({ roll: 55 })
    expect(visit(knRecordEvent(fight, 55))).not.toHaveProperty('event')
    expect(visit(knRecordEvent(knRecordEncounter(entered('corridor'), 1), 55))).not.toHaveProperty('event')
  })

  it('la porte retient le jet et sa réponse', () => {
    expect(visit(knRecordDoor(entered('room'), 5)).door).toEqual({ roll: 5, present: true })
    expect(visit(knRecordDoor(entered('corridor'), 6)).door).toEqual({ roll: 6, present: false })
  })

  it('une fouille par salle, appliquée une seule fois', () => {
    const scavenged = knRecordScavenge(entered('room'), 7)

    expect(visit(scavenged).scavenge).toEqual({ roll: 7, applied: false })
    expect(visit(knRecordScavenge(scavenged, 12)).scavenge?.roll).toBe(7)
    expect(visit(knMarkScavengeApplied(scavenged)).scavenge).toEqual({ roll: 7, applied: true })
    expect(visit(knRecordScavenge(entered('revisit'), 7))).not.toHaveProperty('scavenge')
  })

  it('annuler l\'entrée retire aussi ses tirages', () => {
    const run = knRecordEvent(knRecordEncounter(entered('room', 60), 1), 50)

    expect(knCurrentVisit(knUndoLastVisit(run))).toBeUndefined()
  })
})

describe('gains et pertes d\'un résultat de table', () => {
  const state = () => ({ coins: 5, xp: 90, provisions: { ...emptyKnProvisions(), craftingSupplies: 2 }, health: 10, toughness: 12, sanity: 6, aether: 4 })
  const maxima = { health: 15, toughness: 25, sanity: 14, aether: 20 }
  const fixed = (bonus: number) => ({ count: 0, sides: 0, bonus })
  const rng = () => 0.5

  it('ajoute pièces, provisions et expérience', () => {
    const effects: KnTableEffect[] = [
      { kind: 'coins', dice: { count: 1, sides: 20, bonus: 0 } },
      { kind: 'provision', key: 'craftingSupplies', dice: { count: 1, sides: 4, bonus: 0 } },
      { kind: 'xp', amount: 10 },
    ]
    const { state: next, outcomes } = knApplyTableEffects(effects, state(), maxima, rng)

    expect(outcomes.map(o => o.roll.total)).toEqual([11, 3, 10])
    expect(next).toMatchObject({ coins: 16, xp: 100 })
    expect(next.provisions.craftingSupplies).toBe(5)
  })

  it('une jauge gagne jusqu\'à son maximum et perd jusqu\'à 0', () => {
    const { state: gain } = knApplyTableEffects([{ kind: 'vital', vital: 'sanity', dice: fixed(50), sign: 'gain' }], state(), maxima, rng)
    const { state: loss } = knApplyTableEffects([{ kind: 'vital', vital: 'sanity', dice: fixed(50), sign: 'loss' }], state(), maxima, rng)

    expect(gain.sanity).toBe(14)
    expect(loss.sanity).toBe(0)
  })

  it('borne les pièces et les provisions, et ne modifie pas l\'état d\'origine', () => {
    const original = { ...state(), coins: 999990 }
    const copy = JSON.parse(JSON.stringify(original))
    const { state: next } = knApplyTableEffects([{ kind: 'coins', dice: fixed(500) }, { kind: 'provision', key: 'rations', dice: fixed(5000) }], original, maxima, rng)

    expect(next.coins).toBe(999999)
    expect(next.provisions.rations).toBe(999)
    expect(original).toEqual(copy)
  })
})

describe('contenu factice', () => {
  it('le jeu de tables de test est une table valide du dé demandé', () => {
    const table: KnRollTable = fakeTable(100)

    expect(table.entries).toHaveLength(1)
    expect(knRollTableSchema(100).safeParse(table).success).toBe(true)
  })
})

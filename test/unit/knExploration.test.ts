import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { KN_CONTENT_NAME_RE, KN_CONTENT_SCHEMAS } from '../../shared/ker-nethalas/content'
import { knDeepSearchEmpty, knEncounterTriggered, knHasDoor, knIsLocked, knIsTrapped, knShapeKind } from '../../shared/ker-nethalas/exploration'
import { knEasierDifficulty } from '../../shared/ker-nethalas/roll'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { knSetTemporary, knTemporaryOf } from '../../shared/ker-nethalas/vitals'
import {
  KN_RUN_BOUNDS,
  emptyKnRun,
  knAddDoorObstacle,
  knAddRoomTrap,
  knCurrentDomain,
  knCurrentVisit,
  knDrawGrowingDarkness,
  knFinishTrap,
  knForceBonus,
  knMarkEventOutcome,
  knMarkScavengeApplied,
  knMarkScavengeOutcome,
  knObstacleState,
  knResolveForce,
  knResolvePick,
  knResolveTrapAction,
  knStartPick,
  knTriggerTrap,
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
  knCheckId,
  knOutcomeAvailable,
  knRangeLabel,
  knRollTableSchema,
  knTableEntry,
  type KnOutcome,
  type KnRollTable,
  type KnTableEffect,
  type KnTableEffectState,
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

  it('une entrée porte des tests (compétence ou résistance connues) et des résultats', () => {
    const entry = (extra: object) => ({ die: 10, entries: [{ min: 1, max: 10, text: 'x', ...extra }] })
    const outcome = { when: 'failure', effects: [{ kind: 'damage', dice: { count: 2, sides: 6, bonus: 0 } }] }

    expect(knRollTableSchema(10).safeParse(entry({ checks: [{ skill: 'dodge' }, { skill: 'resolve', group: 1 }], outcomes: [outcome] })).success).toBe(true)
    expect(knRollTableSchema(10).safeParse(entry({ checks: [{ skill: 'luck' }] })).success).toBe(false)
    expect(knRollTableSchema(10).safeParse(entry({ outcomes: [{ when: 'maybe', effects: outcome.effects }] })).success).toBe(false)
    expect(knRollTableSchema(10).safeParse(entry({ outcomes: [{ when: 'failure', effects: [] }] })).success).toBe(false)
    expect(knRollTableSchema(10).safeParse(entry({ outcomes: [{ when: 'failure', effects: [{ kind: 'condition', key: 'bleeding', value: 1 }] }] })).success).toBe(true)
    expect(knRollTableSchema(10).safeParse(entry({ outcomes: [{ when: 'failure', effects: [{ kind: 'condition', key: 'dizzy' }] }] })).success).toBe(false)
  })

  it('identifie un test par sa compétence ou sa résistance', () => {
    expect([knCheckId('dodge'), knCheckId('resolve')]).toEqual(['skill:dodge', 'resistance:resolve'])
  })

  it('une seule branche par groupe, hors « toujours » ; deux groupes sont indépendants', () => {
    const outcomes: KnOutcome[] = [
      { when: 'success', effects: [{ kind: 'xp', amount: 10 }] },
      { when: 'failure', effects: [{ kind: 'xp', amount: 10 }] },
      { when: 'always', effects: [{ kind: 'xp', amount: 10 }] },
      { when: 'failure', group: 1, effects: [{ kind: 'xp', amount: 10 }] },
    ]

    expect([0, 1, 2, 3].map(i => knOutcomeAvailable(outcomes, [], i))).toEqual([true, true, true, true])
    expect([0, 1, 2, 3].map(i => knOutcomeAvailable(outcomes, [0], i))).toEqual([false, false, true, true])
    expect([0, 1, 2, 3].map(i => knOutcomeAvailable(outcomes, [2], i))).toEqual([true, true, false, true])
    expect(knOutcomeAvailable(outcomes, [], 9)).toBe(false)
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
    expect(knObstacleState(visit(spotted).obstacles![0]!)).toMatchObject({ trapped: true, spotted: true, locked: undefined })

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
    const locked = knRecordLock(knSetPerception(knAddDoorObstacle(room(1)), 0, 'passed'), 0, 12)

    expect(knObstacleState(visit(locked).obstacles![0]!).locked).toBe(true)
    expect(knObstacleState(visit(knRecordLock(knSetPerception(knAddDoorObstacle(room(1)), 0, 'passed'), 0, 11)).obstacles![0]!).locked).toBe(false)
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

describe('actions sur un obstacle', () => {
  const visit = (run: KnRun) => knCurrentVisit(run)!
  const obstacle = (run: KnRun, index = 0) => visit(run).obstacles![index]!
  const doorRun = () => knAddDoorObstacle(knRecordDoor(knStartVisit(emptyKnRun(), 'room'), 1))
  const trapped = (perception: 'passed' | 'failed', run = doorRun()) =>
    knRecordTrapType(knRecordTrap(knSetPerception(run, 0, perception), 0, 9), 0, 5)
  const locked = (run: KnRun) => knRecordLock(knSetPerception(run, 0, 'passed'), 0, 15)
  const roomTrapRun = () => knAddRoomTrap(knRecordEvent(knRecordEncounter(knStartVisit(emptyKnRun(), 'room'), 1), 5))

  it('désamorcer un piège repéré le neutralise ; un échec le déclenche', () => {
    expect(obstacle(knResolveTrapAction(trapped('passed'), 0, 'disarm', true)).trapState).toBe('disarmed')
    expect(obstacle(knResolveTrapAction(trapped('passed'), 0, 'disarm', false)).trapState).toBe('triggering')
  })

  it('on ne désamorce pas un piège non repéré, ni deux fois', () => {
    expect(obstacle(knResolveTrapAction(trapped('failed'), 0, 'disarm', true)).trapState).toBe('triggering')

    const done = knResolveTrapAction(trapped('passed'), 0, 'disarm', true)
    expect(obstacle(knResolveTrapAction(done, 0, 'disarm', false)).trapState).toBe('disarmed')
    expect(obstacle(knResolveTrapAction(doorRun(), 0, 'disarm', true))).not.toHaveProperty('trapState')
  })

  it('contourner ne vaut que pour un piège de la pièce', () => {
    expect(obstacle(knResolveTrapAction(trapped('passed'), 0, 'bypass', true))).not.toHaveProperty('trapState')

    const room = knRecordTrapType(knSetPerception(roomTrapRun(), 0, 'passed'), 0, 5)
    expect(obstacle(knResolveTrapAction(room, 0, 'bypass', true)).trapState).toBe('bypassed')
    expect(obstacle(knResolveTrapAction(room, 0, 'bypass', false)).trapState).toBe('triggering')
  })

  it('un piège repéré se déclenche exprès, puis s\'évite ou se subit une seule fois', () => {
    const triggered = knTriggerTrap(trapped('passed'), 0)

    expect(obstacle(triggered).trapState).toBe('triggering')
    expect(obstacle(knFinishTrap(triggered, 0, true)).trapState).toBe('avoided')

    const suffered = knFinishTrap(triggered, 0, false, [0])
    expect(obstacle(suffered)).toMatchObject({ trapState: 'suffered', trapTaken: [0] })
    expect(obstacle(knFinishTrap(suffered, 0, true)).trapState).toBe('suffered')
    expect(obstacle(knFinishTrap(trapped('passed'), 0, true))).not.toHaveProperty('trapState')
  })

  it('on ne règle pas un piège dont le type n\'est pas tiré', () => {
    const untyped = knTriggerTrap(knRecordTrap(knSetPerception(doorRun(), 0, 'passed'), 0, 9), 0)

    expect(obstacle(knFinishTrap(untyped, 0, true)).trapState).toBe('triggering')
  })

  it('un piège non repéré se déclenche dès que le jet le trouve, pas s\'il n\'y en a pas', () => {
    expect(obstacle(trapped('failed')).trapState).toBe('triggering')
    expect(obstacle(knRecordTrap(knSetPerception(doorRun(), 0, 'failed'), 0, 3))).not.toHaveProperty('trapState')
  })

  it('le piège de la pièce vient d\'un événement, une seule fois, sans jet de piège ni de verrou', () => {
    expect(visit(roomTrapRun()).obstacles).toEqual([{ kind: 'room' }])
    expect(visit(knAddRoomTrap(roomTrapRun())).obstacles).toHaveLength(1)
    expect(visit(knAddRoomTrap(knStartVisit(emptyKnRun(), 'room'))).obstacles).toBeUndefined()

    const room = knSetPerception(roomTrapRun(), 0, 'passed')
    expect(obstacle(knRecordTrap(room, 0, 9))).not.toHaveProperty('trap')
    expect(obstacle(knRecordLock(room, 0, 20))).not.toHaveProperty('lock')
    expect(knObstacleState(obstacle(room))).toMatchObject({ trapped: true, spotted: true })
  })

  it('un piège de la pièce non repéré se déclenche aussitôt', () => {
    expect(obstacle(knSetPerception(roomTrapRun(), 0, 'failed')).trapState).toBe('triggering')
  })

  it('le verrou attend que le piège soit réglé', () => {
    const blocked = locked(trapped('passed'))

    expect(knObstacleState(obstacle(blocked)).canWorkLock).toBe(false)
    expect(obstacle(knResolveForce(blocked, 0, true))).not.toHaveProperty('lockOpen')
    expect(knObstacleState(obstacle(knResolveTrapAction(blocked, 0, 'disarm', true))).canWorkLock).toBe(true)
  })

  it('crocheter : la difficulté est retenue, un échec la garde et compte, une réussite ouvre', () => {
    const ready = locked(doorRun())
    const started = knStartPick(ready, 0, 'demanding')

    expect(obstacle(started).pick).toEqual({ difficulty: 'demanding', failures: 0 })
    expect(obstacle(knStartPick(started, 0, 'easy')).pick).toEqual({ difficulty: 'demanding', failures: 0 })

    const failed = knResolvePick(started, 0, false)
    expect(obstacle(failed).pick).toEqual({ difficulty: 'demanding', failures: 1 })
    expect(knObstacleState(obstacle(failed)).canWorkLock).toBe(true)

    const opened = knResolvePick(failed, 0, true)
    expect(obstacle(opened).lockOpen).toBe(true)
    expect(knObstacleState(obstacle(opened)).canWorkLock).toBe(false)
    expect(knResolvePick(ready, 0, true)).toEqual(ready)
  })

  it('pas de crochetage sans verrou', () => {
    const open = knRecordLock(doorRun(), 0, 3)
    const unset = knSetPerception(doorRun(), 0, 'passed')

    expect(obstacle(knStartPick(knRecordLock(unset, 0, 3), 0, 'normal'))).not.toHaveProperty('pick')
    expect(obstacle(knStartPick(open, 0, 'normal'))).not.toHaveProperty('pick')
  })

  it('forcer : chaque échec ajoute +20 aux tentatives suivantes, une réussite ouvre', () => {
    const ready = locked(doorRun())
    const once = knResolveForce(ready, 0, false)
    const twice = knResolveForce(once, 0, false)

    expect([knForceBonus(obstacle(ready)), knForceBonus(obstacle(once)), knForceBonus(obstacle(twice))]).toEqual([0, 20, 40])
    expect(obstacle(knResolveForce(twice, 0, true)).lockOpen).toBe(true)
  })

  it('le schéma du run accepte les états d\'obstacle', () => {
    const run = knResolveForce(knStartPick(locked(doorRun()), 0, 'hard'), 0, false)

    expect(knRunSchema.safeParse(run).success).toBe(true)
    expect(knRunSchema.safeParse(trapped('passed', knAddRoomTrap(roomTrapRun()))).success).toBe(true)
  })

  it('un résultat d\'événement ou de fouille se marque une fois', () => {
    const base = knRecordScavenge(knRecordEvent(knRecordEncounter(knStartVisit(emptyKnRun(), 'room'), 1), 5), 3)
    const marked = knMarkEventOutcome(knMarkEventOutcome(base, 1), 1)
    const scavenged = knMarkScavengeOutcome(knMarkScavengeOutcome(marked, 0), 2)

    expect(visit(marked).event).toEqual({ roll: 5, taken: [1] })
    expect(visit(scavenged).scavenge).toEqual({ roll: 3, applied: false, taken: [0, 2] })
    expect(knMarkEventOutcome(knStartVisit(emptyKnRun(), 'room'), 0)).toEqual(knStartVisit(emptyKnRun(), 'room'))
  })

  it('la difficulté baisse d\'un cran par échec, sans passer sous Enfantin', () => {
    expect([knEasierDifficulty('demanding', 0), knEasierDifficulty('demanding', 1), knEasierDifficulty('hard', 2), knEasierDifficulty('easy', 9)])
      .toEqual(['demanding', 'normal', 'normal', 'childsPlay'])
  })
})

describe('gains et pertes d\'un résultat de table', () => {
  const state = (): KnTableEffectState => ({
    coins: 5,
    xp: 90,
    provisions: { ...emptyKnProvisions(), craftingSupplies: 2 },
    health: 10,
    toughness: 12,
    sanity: 6,
    aether: 4,
    exhaustion: 3,
    status: emptyKnStatus(),
    run: emptyKnRun(),
  })
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

  it('les pertes de pièces et de provisions s\'arrêtent à 0', () => {
    const { state: next } = knApplyTableEffects([
      { kind: 'coins', dice: fixed(8), sign: 'loss' },
      { kind: 'coins', dice: fixed(50), sign: 'loss' },
      { kind: 'provision', key: 'craftingSupplies', dice: fixed(1), sign: 'loss' },
      { kind: 'provision', key: 'bandages', dice: fixed(1), sign: 'loss' },
    ], state(), maxima, rng)

    expect(next.coins).toBe(0)
    expect(next.provisions.craftingSupplies).toBe(1)
    expect(next.provisions.bandages).toBe(0)
  })

  it('les dégâts retirent la Robustesse temporaire, puis la Robustesse, puis la Santé', () => {
    const withTemporary = { ...state(), status: knSetTemporary(emptyKnStatus(), 'toughness', 3) }
    const { state: next } = knApplyTableEffects([{ kind: 'damage', dice: fixed(20) }], withTemporary, maxima, rng)

    expect(knTemporaryOf(next.status, 'toughness')).toBe(0)
    expect(next).toMatchObject({ toughness: 0, health: 5 })
  })

  it('des dégâts sans Robustesse temporaire ne créent pas de champ temporaire', () => {
    const { state: next } = knApplyTableEffects([{ kind: 'damage', dice: fixed(4) }], state(), maxima, rng)

    expect(next.toughness).toBe(8)
    expect(next.status).not.toHaveProperty('temporary')
  })

  it('l\'Épuisement monte et descend dans ses bornes', () => {
    const gain = knApplyTableEffects([{ kind: 'exhaustion', dice: fixed(2), sign: 'gain' }], state(), maxima, rng).state
    const loss = knApplyTableEffects([{ kind: 'exhaustion', dice: fixed(9), sign: 'loss' }], state(), maxima, rng).state
    const cap = knApplyTableEffects([{ kind: 'exhaustion', dice: fixed(90), sign: 'gain' }], { ...state(), exhaustion: 50 }, maxima, rng).state

    expect([gain.exhaustion, loss.exhaustion, cap.exhaustion]).toEqual([5, 0, 99])
  })

  it('une condition s\'ajoute, et une condition présente garde sa plus forte valeur', () => {
    const added = knApplyTableEffects([{ kind: 'condition', key: 'bleeding', value: 1 }], state(), maxima, rng).state
    const again = knApplyTableEffects([{ kind: 'condition', key: 'bleeding', value: 2 }], added, maxima, rng).state
    const lower = knApplyTableEffects([{ kind: 'condition', key: 'bleeding', value: 1 }], again, maxima, rng).state
    const plain = knApplyTableEffects([{ kind: 'condition', key: 'restrained' }], state(), maxima, rng).state

    expect(added.status.conditions).toEqual([{ key: 'bleeding', value: 1 }])
    expect(again.status.conditions).toEqual([{ key: 'bleeding', value: 2 }])
    expect(lower.status.conditions).toEqual([{ key: 'bleeding', value: 2 }])
    expect(plain.status.conditions).toEqual([{ key: 'restrained' }])
  })

  it('un gain temporaire s\'ajoute au temporaire déjà là', () => {
    const { state: next } = knApplyTableEffects([{ kind: 'temporary', vital: 'aether', dice: fixed(4) }, { kind: 'temporary', vital: 'aether', dice: fixed(3) }], state(), maxima, rng)

    expect(knTemporaryOf(next.status, 'aether')).toBe(7)
  })

  it('remet le Dé de Tension à D8 et baisse le Dé de Lair d\'un cran tant que le Lair n\'est pas trouvé', () => {
    const run = { ...emptyKnRun(), tensionDie: 4 as const }
    const { state: next } = knApplyTableEffects([{ kind: 'tensionReset' }, { kind: 'lairDown' }], { ...state(), run }, maxima, rng)
    const found = { ...emptyKnRun(), domains: [{ ...emptyKnRun().domains[0]!, lairFound: true }] }
    const { state: kept } = knApplyTableEffects([{ kind: 'lairDown' }], { ...state(), run: found }, maxima, rng)

    expect(next.run.tensionDie).toBe(8)
    expect(knCurrentDomain(next.run).lairDie).toBe(8)
    expect(knCurrentDomain(kept.run).lairDie).toBe(10)
  })

  it('un tirage d\'Obscurité Grandissante entre dans le Domaine et se dit dans le résultat', () => {
    const { state: next, outcomes } = knApplyTableEffects([{ kind: 'darkness' }], state(), maxima, rng)

    expect(outcomes[0]!.draw).toBeDefined()
    expect(knCurrentDomain(next.run).growingDarkness).toHaveLength(1)
  })
})

describe('contenu factice', () => {
  it('le jeu de tables de test est une table valide du dé demandé', () => {
    const table: KnRollTable = fakeTable(100)

    expect(table.entries).toHaveLength(1)
    expect(knRollTableSchema(100).safeParse(table).success).toBe(true)
  })
})

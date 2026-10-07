import { describe, it, expect } from 'vitest'
import { KN_GROWING_DARKNESS, KN_GROWING_DARKNESS_KEYS } from '../../shared/ker-nethalas/catalog/growingDarkness'
import { updateKnCharacterSchema } from '../../shared/ker-nethalas/character'
import {
  KN_RUN_BOUNDS,
  KN_USAGE_DICE,
  emptyKnDomain,
  emptyKnRun,
  knAddGrowingDarkness,
  knCurrentDomain,
  knCurrentVisit,
  knDrawGrowingDarkness,
  knEnterRoom,
  knExitCheck,
  knGrowingDarknessKeyForRoll,
  knLairCheck,
  knLightCost,
  knNewDomain,
  knRaiseUsageDie,
  knRecordDarkness,
  knRecordTension,
  knRecordUsage,
  knRollDie,
  knRunSchema,
  knStartVisit,
  knSwitchDomain,
  knTensionCheck,
  knUndoLastVisit,
  knUsageCheck,
  knUsageDieRaise,
  knVisitFoundLair,
  knVisitPending,
  type KnRun,
  type KnUsageDie,
} from '../../shared/ker-nethalas/run'

// Une séquence de tirages : chaque entrée est le résultat voulu d'un dé à `sides` faces.
const rolls = (...results: [sides: number, result: number][]) => {
  const queue = results.map(([sides, result]) => (result - 0.5) / sides)
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('plus de tirage prévu')
    return next
  }
}

const withGrowingDarkness = (run: KnRun, keys: string[]): KnRun => ({
  ...run,
  domains: run.domains.map((d, i) => i === run.current
    ? { ...d, growingDarkness: keys.map(key => ({ key })) as KnRun['domains'][number]['growingDarkness'] }
    : d),
})

describe('dés d\'usage', () => {
  it('descendent d\'un cran sur un 1 ou un 2, restent sur un 3 et plus', () => {
    const chain: [KnUsageDie, KnUsageDie][] = [[20, 12], [12, 10], [10, 8], [8, 6], [6, 4]]

    for (const [die, next] of chain) {
      expect(knUsageCheck(die, 1)).toEqual({ die: next, triggered: false })
      expect(knUsageCheck(die, 2)).toEqual({ die: next, triggered: false })
      expect(knUsageCheck(die, 3)).toEqual({ die, triggered: false })
      expect(knUsageCheck(die, die)).toEqual({ die, triggered: false })
    }
  })

  it('déclenchent la procédure sur un 1 ou un 2 au D4, et seulement là', () => {
    expect(knUsageCheck(4, 1)).toEqual({ die: 4, triggered: true })
    expect(knUsageCheck(4, 2)).toEqual({ die: 4, triggered: true })
    expect(knUsageCheck(4, 3)).toEqual({ die: 4, triggered: false })
    for (const die of KN_USAGE_DICE.filter(d => d !== 4)) expect(knUsageCheck(die, 1).triggered).toBe(false)
  })

  it('tirent entre 1 et le nombre de faces', () => {
    expect(knRollDie(10, () => 0)).toBe(1)
    expect(knRollDie(10, () => 0.999999)).toBe(10)
    expect(knRollDie(100, () => 0.5)).toBe(51)
  })
})

describe('Dé de Tension', () => {
  it('commence à D8, descend sur 1-2 et revient à D8 quand il se déclenche', () => {
    let run = emptyKnRun()
    expect(run.tensionDie).toBe(8)

    run = knTensionCheck(run, 5).run
    expect(run.tensionDie).toBe(8)

    run = knTensionCheck(run, 2).run
    expect(run.tensionDie).toBe(6)
    run = knTensionCheck(run, 1).run
    expect(run.tensionDie).toBe(4)

    const last = knTensionCheck(run, 2)
    expect(last.triggered).toBe(true)
    expect(last.run.tensionDie).toBe(8)
  })

  it('ne modifie pas l\'état d\'origine', () => {
    const run = emptyKnRun()
    knTensionCheck(run, 1)

    expect(run.tensionDie).toBe(8)
  })
})

describe('Lair et Sortie', () => {
  it('le dé de Lair part de D10 et trouve le Lair au D4', () => {
    let run = emptyKnRun()
    expect(knCurrentDomain(run).lairDie).toBe(10)

    for (const expected of [8, 6, 4]) {
      const result = knLairCheck(run, 1)
      run = result.run
      expect(knCurrentDomain(run).lairDie).toBe(expected)
      expect(result.found).toBe(false)
    }

    const found = knLairCheck(run, 2)
    expect(found.found).toBe(true)
    expect(knCurrentDomain(found.run).lairFound).toBe(true)
  })

  it('ne relance plus le dé de Lair une fois le Lair trouvé', () => {
    const found = knLairCheck({ ...emptyKnRun(), domains: [{ ...knCurrentDomain(emptyKnRun()), lairDie: 4 }] }, 1).run
    const again = knLairCheck(found, 1)

    expect(again.run).toBe(found)
    expect(again.found).toBe(false)
  })

  it('le dé de Sortie exige le Lair trouvé, part de D8 et trouve la sortie au D4', () => {
    const before = emptyKnRun()
    expect(knExitCheck(before, 1).run).toBe(before)

    const lairFound = knLairCheck({ ...before, domains: [{ ...knCurrentDomain(before), lairDie: 4 }] }, 1).run
    expect(knCurrentDomain(lairFound).exitDie).toBe(8)

    let run = lairFound
    for (const expected of [6, 4]) {
      run = knExitCheck(run, 2).run
      expect(knCurrentDomain(run).exitDie).toBe(expected)
    }
    const exit = knExitCheck(run, 1)
    expect(exit.found).toBe(true)
    expect(knCurrentDomain(exit.run).exitFound).toBe(true)
    expect(knExitCheck(exit.run, 1).run).toBe(exit.run)
  })
})

describe('entrer dans une salle', () => {
  it('une salle nouvelle compte dans le Domaine et retire 1 de lumière', () => {
    const run = knEnterRoom(emptyKnRun(), { isNew: true })

    expect(knCurrentDomain(run).rooms).toBe(1)
    expect(run.lightRemaining).toBe(19)
  })

  it('revisiter une salle ne compte pas, mais consomme la lumière', () => {
    const run = knEnterRoom(emptyKnRun(), { isNew: false })

    expect(knCurrentDomain(run).rooms).toBe(0)
    expect(run.lightRemaining).toBe(19)
  })

  it('l\'événement 69-70 double la consommation, sans la cumuler s\'il est tiré deux fois', () => {
    const once = withGrowingDarkness(emptyKnRun(), ['gd_69_70'])
    const twice = withGrowingDarkness(emptyKnRun(), ['gd_69_70', 'gd_69_70'])

    expect(knLightCost(knCurrentDomain(emptyKnRun()))).toBe(1)
    expect(knLightCost(knCurrentDomain(once))).toBe(2)
    expect(knLightCost(knCurrentDomain(twice))).toBe(2)
    expect(knEnterRoom(once, { isNew: true }).lightRemaining).toBe(18)
  })

  it('la lumière ne descend jamais sous 0 et l\'état d\'origine est intact', () => {
    const run = { ...emptyKnRun(), lightRemaining: 1 }
    const next = knEnterRoom(withGrowingDarkness(run, ['gd_69_70']), { isNew: true })

    expect(next.lightRemaining).toBe(0)
    expect(run.lightRemaining).toBe(1)
    expect(knCurrentDomain(run).rooms).toBe(0)
  })
})

describe('Domaines', () => {
  it('un nouveau Domaine est ajouté, devient courant et remet le Dé de Tension à D8', () => {
    const start = { ...emptyKnRun(), tensionDie: 4 as const }
    const run = knNewDomain(withGrowingDarkness(start, ['gd_01_02']))

    expect(run.domains.map(d => d.name)).toEqual(['Domaine 1', 'Domaine 2'])
    expect(run.current).toBe(1)
    expect(run.tensionDie).toBe(8)
    expect(knCurrentDomain(run)).toMatchObject({ rooms: 0, lairDie: 10, lairFound: false, exitDie: 8, growingDarkness: [] })
    expect(run.domains[0]!.growingDarkness).toEqual([{ key: 'gd_01_02' }])
  })

  it('revenir dans un ancien Domaine retrouve ses événements et ses influences', () => {
    const first = knAddGrowingDarkness(emptyKnRun(), {
      roll: 90,
      entry: { key: 'gd_81_100' },
      influence: { roll: 4, key: 'skilled' },
    })
    const second = knNewDomain(first)
    expect(knCurrentDomain(second).overseerInfluences).toEqual([])

    const back = knSwitchDomain(second, 0)
    expect(knCurrentDomain(back).overseerInfluences).toEqual(['skilled'])
    expect(knCurrentDomain(back).growingDarkness).toEqual([{ key: 'gd_81_100' }])
  })

  it('refuse un Domaine inexistant et plafonne le nombre de Domaines', () => {
    const run = knNewDomain(emptyKnRun())

    for (const index of [-1, 2, 1.5, Number.NaN]) expect(knSwitchDomain(run, index)).toBe(run)

    let many = emptyKnRun()
    for (let i = 0; i < KN_RUN_BOUNDS.domains + 5; i++) many = knNewDomain(many)
    expect(many.domains).toHaveLength(KN_RUN_BOUNDS.domains)
  })
})

describe('table de l\'Obscurité Grandissante', () => {
  it('trouve l\'événement par sa plage', () => {
    expect(knGrowingDarknessKeyForRoll(1)).toBe('gd_01_02')
    expect(knGrowingDarknessKeyForRoll(2)).toBe('gd_01_02')
    expect(knGrowingDarknessKeyForRoll(3)).toBe('gd_03_04')
    expect(knGrowingDarknessKeyForRoll(37)).toBe('gd_37_50')
    expect(knGrowingDarknessKeyForRoll(50)).toBe('gd_37_50')
    expect(knGrowingDarknessKeyForRoll(51)).toBe('gd_51_52')
    expect(knGrowingDarknessKeyForRoll(81)).toBe('gd_81_100')
    expect(knGrowingDarknessKeyForRoll(100)).toBe('gd_81_100')
  })

  it('couvre chaque résultat de 1 à 100 exactement une fois', () => {
    const counts = new Map<string, number>()
    for (let roll = 1; roll <= 100; roll++) {
      const key = knGrowingDarknessKeyForRoll(roll)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    for (const key of KN_GROWING_DARKNESS_KEYS) {
      const [from, to] = KN_GROWING_DARKNESS[key].range
      expect(counts.get(key), key).toBe(to - from + 1)
    }
  })

  it('refuse un résultat hors de la table', () => {
    expect(() => knGrowingDarknessKeyForRoll(0)).toThrow(RangeError)
    expect(() => knGrowingDarknessKeyForRoll(101)).toThrow(RangeError)
  })

  it('tire le D4 d\'Éther (09-10) et le D6 de Robustesse (11-12)', () => {
    expect(knDrawGrowingDarkness(rolls([100, 9], [4, 3])).entry).toEqual({ key: 'gd_09_10', value: 3 })
    expect(knDrawGrowingDarkness(rolls([100, 12], [6, 5])).entry).toEqual({ key: 'gd_11_12', value: 5 })
  })

  it('ne tire rien de plus pour un événement simple ou à compétence à choisir', () => {
    expect(knDrawGrowingDarkness(rolls([100, 17]))).toEqual({ roll: 17, entry: { key: 'gd_17_18' } })
    expect(knDrawGrowingDarkness(rolls([100, 58])).entry).toEqual({ key: 'gd_57_58' })
  })

  it('un 81-100 fait aussi tirer une influence d\'Overseer, dans l\'ordre de sa table', () => {
    const draw = knDrawGrowingDarkness(rolls([100, 95], [10, 4]))

    expect(draw.entry).toEqual({ key: 'gd_81_100' })
    expect(draw.influence).toEqual({ roll: 4, key: 'skilled' })
    expect(knDrawGrowingDarkness(rolls([100, 81], [10, 10])).influence?.key).toBe('piercing')
    expect(knDrawGrowingDarkness(rolls([100, 81], [10, 1])).influence?.key).toBe('tough')
  })

  it('ajoute l\'événement et l\'influence au Domaine courant seulement', () => {
    const two = knNewDomain(emptyKnRun())
    const run = knAddGrowingDarkness(two, knDrawGrowingDarkness(rolls([100, 90], [10, 2])))

    expect(knCurrentDomain(run)).toMatchObject({ growingDarkness: [{ key: 'gd_81_100' }], overseerInfluences: ['vital'] })
    expect(run.domains[0]).toMatchObject({ growingDarkness: [], overseerInfluences: [] })
  })
})

describe('chemin du Domaine', () => {
  const lastVisit = (run: KnRun) => knCurrentVisit(run)!

  it('une nouvelle salle ouvre une visite avec le dé de Lair attendu et applique lumière et salles', () => {
    const run = knStartVisit(emptyKnRun(), 'room')

    expect(knCurrentDomain(run).visits).toEqual([{ kind: 'room', usageKind: 'lair' }])
    expect(knCurrentDomain(run).rooms).toBe(1)
    expect(run.lightRemaining).toBe(19)
  })

  it('attend le dé de Sortie une fois le Lair trouvé, et plus de dé une fois la sortie trouvée', () => {
    const base = emptyKnRun()
    const lair = { ...base, domains: [{ ...knCurrentDomain(base), lairFound: true }] }
    const exit = { ...base, domains: [{ ...knCurrentDomain(base), lairFound: true, exitFound: true }] }

    expect(lastVisit(knStartVisit(lair, 'corridor')).usageKind).toBe('exit')
    expect(lastVisit(knStartVisit(exit, 'room')).usageKind).toBeNull()
  })

  it('un retour en zone explorée ne compte pas de salle et n\'attend aucun dé de Lair', () => {
    const run = knStartVisit(emptyKnRun(), 'revisit')

    expect(lastVisit(run)).toEqual({ kind: 'revisit', usageKind: null })
    expect(knCurrentDomain(run).rooms).toBe(0)
    expect(run.lightRemaining).toBe(19)
  })

  it('enregistre le dé de Tension avec le dé avant, le jet, le dé après et le déclenchement', () => {
    const run = knRecordTension(knStartVisit(emptyKnRun(), 'room'), 2, false)

    expect(lastVisit(run).tension).toEqual({ die: 8, roll: 2, manual: false, next: 6, triggered: false })
    expect(run.tensionDie).toBe(6)
  })

  it('ne rejoue pas un dé déjà enregistré dans la visite, ni sans visite', () => {
    const once = knRecordTension(knStartVisit(emptyKnRun(), 'room'), 1, true)

    expect(knRecordTension(once, 1, true)).toBe(once)
    const bare = emptyKnRun()
    expect(knRecordTension(bare, 1, true)).toBe(bare)
    expect(knRecordUsage(bare, 1, true)).toBe(bare)
  })

  it('un déclenchement de Tension attend l\'événement, puis le range dans la visite et dans le Domaine', () => {
    let run = knStartVisit({ ...emptyKnRun(), tensionDie: 4 }, 'room')
    run = knRecordTension(run, 1, true)

    expect(lastVisit(run).tension).toMatchObject({ die: 4, next: 8, triggered: true, manual: true })
    expect(knVisitPending(lastVisit(run)).darkness).toBe(true)

    const draw = knDrawGrowingDarkness(rolls([100, 95], [10, 4]))
    run = knRecordDarkness(run, draw)

    expect(lastVisit(run).darkness).toEqual(draw)
    expect(knVisitPending(lastVisit(run)).darkness).toBe(false)
    expect(knCurrentDomain(run)).toMatchObject({ growingDarkness: [{ key: 'gd_81_100' }], overseerInfluences: ['skilled'] })
    expect(knRecordDarkness(run, draw)).toBe(run)
  })

  it('refuse un événement quand la Tension ne s\'est pas déclenchée', () => {
    const run = knRecordTension(knStartVisit(emptyKnRun(), 'room'), 5, false)

    expect(knRecordDarkness(run, knDrawGrowingDarkness(rolls([100, 17])))).toBe(run)
  })

  it('enregistre le dé de Lair puis marque le Lair trouvé dans la visite et le Domaine', () => {
    const start = knStartVisit({ ...emptyKnRun(), domains: [{ ...emptyKnDomain(1), lairDie: 4 }] }, 'room')
    const run = knRecordUsage(start, 2, false)

    expect(lastVisit(run).usage).toEqual({ die: 4, roll: 2, manual: false, next: 4, triggered: true })
    expect(knVisitFoundLair(lastVisit(run))).toBe(true)
    expect(knCurrentDomain(run).lairFound).toBe(true)
  })

  it('enregistre le dé de Sortie à sa propre chaîne', () => {
    const base = emptyKnRun()
    const lairFound = { ...base, domains: [{ ...knCurrentDomain(base), lairFound: true }] }
    const run = knRecordUsage(knStartVisit(lairFound, 'room'), 1, true)

    expect(lastVisit(run).usage).toEqual({ die: 8, roll: 1, manual: true, next: 6, triggered: false })
    expect(knCurrentDomain(run).exitDie).toBe(6)
    expect(knVisitFoundLair(lastVisit(run))).toBe(false)
  })

  it('liste ce qu\'il reste à faire dans la visite', () => {
    const start = knStartVisit(emptyKnRun(), 'room')

    expect(knVisitPending(lastVisit(start))).toEqual({ tension: true, usage: true, darkness: false })
    const done = knRecordUsage(knRecordTension(start, 5, false), 5, false)
    expect(knVisitPending(lastVisit(done))).toEqual({ tension: false, usage: false, darkness: false })
    expect(knVisitPending(lastVisit(knStartVisit(emptyKnRun(), 'revisit')))).toMatchObject({ usage: false })
  })

  it('annuler retire la dernière visite et rend le compte de salles, pas la lumière ni les dés', () => {
    const run = knRecordTension(knStartVisit(emptyKnRun(), 'room'), 1, true)
    const undone = knUndoLastVisit(run)

    expect(knCurrentDomain(undone).visits).toEqual([])
    expect(knCurrentDomain(undone).rooms).toBe(0)
    expect(undone.lightRemaining).toBe(19)
    expect(undone.tensionDie).toBe(6)

    const revisit = knStartVisit(knStartVisit(emptyKnRun(), 'room'), 'revisit')
    expect(knCurrentDomain(knUndoLastVisit(revisit)).rooms).toBe(1)
    expect(knUndoLastVisit(emptyKnRun())).toEqual(emptyKnRun())
  })

  it('garde le chemin de chaque Domaine à part et plafonne sa longueur en gardant les dernières entrées', () => {
    let run = knStartVisit(emptyKnRun(), 'room')
    run = knNewDomain(run)
    expect(knCurrentDomain(run).visits).toEqual([])
    expect(knCurrentDomain(knSwitchDomain(run, 0)).visits).toHaveLength(1)

    let long = emptyKnRun()
    for (let i = 0; i < KN_RUN_BOUNDS.visits + 3; i++) long = knStartVisit(long, i % 2 ? 'corridor' : 'room')
    expect(knCurrentDomain(long).visits).toHaveLength(KN_RUN_BOUNDS.visits)
    expect(knCurrentDomain(long).rooms).toBe(KN_RUN_BOUNDS.visits + 3)
    expect(knRunSchema.safeParse(long).success).toBe(true)
  })

  it('le schéma accepte un chemin complet et refuse un dé ou un type de visite inconnu', () => {
    let run = knStartVisit({ ...emptyKnRun(), tensionDie: 4 }, 'room')
    run = knRecordDarkness(knRecordUsage(knRecordTension(run, 2, false), 5, false), knDrawGrowingDarkness(rolls([100, 9], [4, 3])))
    expect(knRunSchema.safeParse(run).success).toBe(true)

    const bad = (visit: unknown) => ({ ...emptyKnRun(), domains: [{ ...emptyKnDomain(1), visits: [visit] }] })
    expect(knRunSchema.safeParse(bad({ kind: 'cave', usageKind: null })).success).toBe(false)
    expect(knRunSchema.safeParse(bad({ kind: 'room', usageKind: 'lair', tension: { die: 7, roll: 1, manual: false, next: 6, triggered: false } })).success).toBe(false)
  })
})

describe('hausse du dé de Lair ou de Sortie', () => {
  const withDomain = (patch: Partial<ReturnType<typeof emptyKnDomain>>): KnRun => ({ ...emptyKnRun(), domains: [{ ...emptyKnDomain(1), ...patch }] })

  it('monte le dé de Lair au dé plus grand tant que le Lair n\'est pas trouvé', () => {
    const run = withDomain({ lairDie: 8 })

    expect(knUsageDieRaise(run)).toEqual({ which: 'lair', from: 8, to: 10 })
    expect(knCurrentDomain(knRaiseUsageDie(run)).lairDie).toBe(10)
    expect(run.domains[0]!.lairDie).toBe(8)
  })

  it('passe au dé de Sortie une fois le Lair trouvé', () => {
    const run = withDomain({ lairFound: true, lairDie: 4, exitDie: 6 })

    expect(knUsageDieRaise(run)).toEqual({ which: 'exit', from: 6, to: 8 })
    expect(knCurrentDomain(knRaiseUsageDie(run))).toMatchObject({ lairDie: 4, exitDie: 8 })
  })

  it('ne fait rien au D20 ni une fois la Sortie trouvée', () => {
    const maxed = withDomain({ lairDie: 20 })
    const done = withDomain({ lairFound: true, exitFound: true })

    expect(knUsageDieRaise(maxed)).toBeNull()
    expect(knRaiseUsageDie(maxed)).toBe(maxed)
    expect(knUsageDieRaise(done)).toBeNull()
    expect(knRaiseUsageDie(done)).toBe(done)
  })
})

describe('schéma du run', () => {
  it('accepte l\'état vide', () => {
    expect(knRunSchema.safeParse(emptyKnRun()).success).toBe(true)
  })

  it('refuse un Domaine courant inexistant, une liste vide et un dé qui n\'existe pas', () => {
    const run = emptyKnRun()

    expect(knRunSchema.safeParse({ ...run, current: 1 }).success).toBe(false)
    expect(knRunSchema.safeParse({ ...run, domains: [] }).success).toBe(false)
    expect(knRunSchema.safeParse({ ...run, tensionDie: 7 }).success).toBe(false)
    expect(knRunSchema.safeParse({ ...run, lightRemaining: -1 }).success).toBe(false)
  })

  it('est accepté par la mise à jour d\'un survivant', () => {
    expect(updateKnCharacterSchema.safeParse({ run: emptyKnRun() }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ run: { ...emptyKnRun(), current: 3 } }).success).toBe(false)
  })
})

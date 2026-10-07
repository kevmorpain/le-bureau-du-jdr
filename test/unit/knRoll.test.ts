import { describe, it, expect } from 'vitest'
import fr from '../../i18n/locales/fr.json'
import {
  KN_DIFFICULTIES,
  KN_DIFFICULTY_KEYS,
  KN_FUMBLE_COUNT,
  knApplyCriticalEffects,
  knCriticalEffects,
  knCriticalKind,
  knD100Check,
  knD100Digits,
  knReadD100,
  knRollDifficulty,
  knRollFumble,
} from '../../shared/ker-nethalas/roll'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS, KN_WEAPON_SKILL_KEYS } from '../../shared/ker-nethalas/skills'

const labels = fr.ker_nethalas as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const check = (roll: number, score: number, over: { difficulty?: number, mode?: 'normal' | 'advantage' | 'disadvantage' | 'both' } = {}) =>
  knD100Check({ roll, score, difficulty: over.difficulty ?? 0, mode: over.mode ?? 'normal' })

describe('lecture du D100', () => {
  it('sépare les dizaines et les unités, 100 étant le « 00 » du dé', () => {
    expect(knD100Digits(62)).toEqual({ tens: 6, ones: 2 })
    expect(knD100Digits(5)).toEqual({ tens: 0, ones: 5 })
    expect(knD100Digits(60)).toEqual({ tens: 6, ones: 0 })
    expect(knD100Digits(100)).toEqual({ tens: 0, ones: 0 })
  })

  it('Avantage : le plus petit chiffre en dizaines, si cela aide', () => {
    expect(knReadD100(62, 'advantage')).toEqual({ value: 26, swapped: true })
    expect(knReadD100(26, 'advantage')).toEqual({ value: 26, swapped: false })
    expect(knReadD100(60, 'advantage')).toEqual({ value: 6, swapped: true })
    expect(knReadD100(44, 'advantage')).toEqual({ value: 44, swapped: false })
  })

  it('Désavantage : le plus grand chiffre en dizaines, si cela gêne', () => {
    expect(knReadD100(26, 'disadvantage')).toEqual({ value: 62, swapped: true })
    expect(knReadD100(62, 'disadvantage')).toEqual({ value: 62, swapped: false })
    expect(knReadD100(5, 'disadvantage')).toEqual({ value: 50, swapped: true })
  })

  it('ne change rien en lecture normale, ni sur un double, ni sur 100', () => {
    expect(knReadD100(62, 'normal')).toEqual({ value: 62, swapped: false })
    expect(knReadD100(77, 'disadvantage')).toEqual({ value: 77, swapped: false })
    expect(knReadD100(100, 'advantage')).toEqual({ value: 100, swapped: false })
    expect(knReadD100(100, 'disadvantage')).toEqual({ value: 100, swapped: false })
  })
})

describe('test de compétence', () => {
  it('réussit à égalité avec la cible, échoue au-dessus', () => {
    expect(check(54, 54).success).toBe(true)
    expect(check(55, 54).success).toBe(false)
    expect(check(1, 54).success).toBe(true)
  })

  it('exemple du livre : 62 avec 50 en Armes tranchantes devient un 26 réussi grâce à l\'Avantage', () => {
    expect(check(62, 50).success).toBe(false)
    expect(check(62, 50, { mode: 'advantage' })).toMatchObject({ value: 26, swapped: true, success: true, mode: 'advantage' })
  })

  it('applique la difficulté à la cible, sans la faire descendre sous 0', () => {
    expect(check(30, 54, { difficulty: KN_DIFFICULTIES.hard })).toMatchObject({ target: 34, success: true })
    expect(check(40, 54, { difficulty: KN_DIFFICULTIES.hard })).toMatchObject({ target: 34, success: false })
    expect(check(1, 10, { difficulty: KN_DIFFICULTIES.impossible })).toMatchObject({ target: 0, success: false })
    expect(check(80, 60, { difficulty: KN_DIFFICULTIES.childsPlay }).target).toBe(90)
  })

  it('Avantage et Désavantage ensemble : le dé est lu normalement', () => {
    expect(check(62, 50, { mode: 'both' })).toMatchObject({ value: 62, swapped: false, mode: 'normal', success: false })
  })

  it('un double sous la cible est une réussite critique, au-dessus un échec critique', () => {
    expect(check(33, 54)).toMatchObject({ doubles: true, critical: 'success' })
    expect(check(44, 44)).toMatchObject({ doubles: true, critical: 'success' })
    expect(check(55, 54)).toMatchObject({ doubles: true, critical: 'failure' })
    expect(check(77, 54).critical).toBe('failure')
    expect(check(34, 54)).toMatchObject({ doubles: false, critical: null })
  })

  it('100 se lit « 00 » : un double, échec critique sauf score d\'au moins 100', () => {
    expect(check(100, 80)).toMatchObject({ doubles: true, success: false, critical: 'failure' })
    expect(check(100, 120)).toMatchObject({ doubles: true, success: true, critical: 'success' })
  })

  it('les doubles se jugent sur le dé lu, après l\'Avantage', () => {
    expect(check(60, 54, { mode: 'advantage' })).toMatchObject({ value: 6, doubles: false, success: true, critical: null })
  })
})

describe('difficulté', () => {
  it('la table du D8 couvre sept niveaux, Normal sur 4 et 5', () => {
    const rolls = [1, 2, 3, 4, 5, 6, 7, 8].map(face => knRollDifficulty(() => (face - 0.5) / 8))

    expect(rolls).toEqual(['childsPlay', 'effortless', 'easy', 'normal', 'normal', 'demanding', 'hard', 'impossible'])
    expect(KN_DIFFICULTY_KEYS.map(key => KN_DIFFICULTIES[key])).toEqual([30, 20, 10, 0, -10, -20, -30])
  })
})

describe('effets des critiques', () => {
  it('distingue armes, tests à effet et compétences ajoutées à la main', () => {
    for (const key of KN_WEAPON_SKILL_KEYS) expect(knCriticalKind(key), key).toBe('weapon')
    for (const key of [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS].filter(k => !(KN_WEAPON_SKILL_KEYS as readonly string[]).includes(k))) {
      expect(knCriticalKind(key), key).toBe('table')
    }
    expect(knCriticalKind(undefined)).toBeNull()
    expect(knCriticalKind('luck')).toBeNull()
  })

  it('chaque test à effet, les armes, les maladresses et les difficultés ont leur texte français', () => {
    for (const key of [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS]) {
      if (knCriticalKind(key) !== 'table') continue
      expect(labels.criticals[key].success, `${key} réussite`).toBeTruthy()
      expect(labels.criticals[key].failure, `${key} échec`).toBeTruthy()
    }
    expect(labels.criticals.weapon.success).toBeTruthy()
    expect(labels.criticals.weapon.failure).toBeTruthy()
    for (let face = 1; face <= KN_FUMBLE_COUNT; face++) expect(labels.fumbles[`f${face}`], `maladresse ${face}`).toBeTruthy()
    for (const key of KN_DIFFICULTY_KEYS) expect(labels.difficulties[key], key).toBeTruthy()
  })

  it('n\'a pas d\'effet orphelin', () => {
    const expected = [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS].filter(key => knCriticalKind(key) === 'table')
    expect(Object.keys(labels.criticals).filter(key => key !== 'weapon').sort()).toEqual([...expected].sort())
    expect(Object.keys(labels.fumbles)).toHaveLength(KN_FUMBLE_COUNT)
  })

  it('tire la maladresse au D10', () => {
    expect(knRollFumble(() => 0)).toBe(1)
    expect(knRollFumble(() => 0.999)).toBe(10)
  })
})

// Une séquence de tirages : chaque entrée est le résultat voulu d'un dé à `sides` faces.
const rolls = (...results: [sides: number, result: number][]) => {
  const queue = results.map(([sides, result]) => (result - 0.5) / sides)
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('plus de tirage prévu')
    return next
  }
}

describe('effets chiffrés des critiques', () => {
  it('Endurance : +1 Santé et −D4 Épuisement en réussite, +D4 Épuisement en échec', () => {
    expect(knCriticalEffects('endurance', 'success', rolls([4, 3]))).toEqual([
      { type: 'health', amount: 1 },
      { type: 'exhaustion', amount: -3, dice: 'D4 : 3' },
    ])
    expect(knCriticalEffects('endurance', 'failure', rolls([4, 2]))).toEqual([{ type: 'exhaustion', amount: 2, dice: 'D4 : 2' }])
    expect(knCriticalEffects('athletics', 'failure', rolls([4, 4]))).toEqual([{ type: 'exhaustion', amount: 4, dice: 'D4 : 4' }])
  })

  it('Résolution : +D4+1 Santé mentale en réussite, −D4 en échec', () => {
    expect(knCriticalEffects('resolve', 'success', rolls([4, 4]))).toEqual([{ type: 'sanity', amount: 5, dice: 'D4+1 : 4+1' }])
    expect(knCriticalEffects('resolve', 'failure', rolls([4, 3]))).toEqual([{ type: 'sanity', amount: -3, dice: 'D4 : 3' }])
  })

  it('Médecine : +D10 Robustesse en réussite, 2D6 dégâts en échec ; Acrobatie : D6 dégâts en échec', () => {
    expect(knCriticalEffects('medicine', 'success', rolls([10, 7]))).toEqual([{ type: 'toughness', amount: 7, dice: 'D10 : 7' }])
    expect(knCriticalEffects('medicine', 'failure', rolls([6, 3], [6, 5]))).toEqual([{ type: 'damage', amount: 8, dice: '2D6 : 3 + 5' }])
    expect(knCriticalEffects('acrobatics', 'failure', rolls([6, 4]))).toEqual([{ type: 'damage', amount: 4, dice: 'D6 : 4' }])
  })

  it('Raison : un échec fait monter le dé de Lair ou de Sortie', () => {
    expect(knCriticalEffects('reason', 'failure')).toEqual([{ type: 'usageDieUp' }])
  })

  it('n\'a pas d\'effet chiffré pour les autres tests, les armes et les compétences ajoutées', () => {
    for (const key of ['perception', 'stealth', 'thievery', 'dodge', 'scavenge', 'spellward', 'bladedWeapons', undefined]) {
      expect(knCriticalEffects(key, 'success'), `${key} réussite`).toEqual([])
      expect(knCriticalEffects(key, 'failure'), `${key} échec`).toEqual([])
    }
    expect(knCriticalEffects('endurance', 'failure', rolls([4, 1]))).toHaveLength(1)
  })
})

describe('application des effets', () => {
  const vitals = { toughness: 5, toughnessMax: 20, health: 8, healthMax: 10, sanity: 6, sanityMax: 12, exhaustion: 4, exhaustionMax: 99 }

  it('applique les gains sans dépasser les maximums et les pertes sans descendre sous 0', () => {
    const gain = knApplyCriticalEffects([
      { type: 'health', amount: 5 },
      { type: 'toughness', amount: 9 },
      { type: 'sanity', amount: 5 },
      { type: 'exhaustion', amount: -9 },
    ], vitals)

    expect(gain).toMatchObject({ health: 10, toughness: 14, sanity: 11, exhaustion: 0 })
    expect(knApplyCriticalEffects([{ type: 'sanity', amount: -9 }], vitals).sanity).toBe(0)
    expect(knApplyCriticalEffects([{ type: 'exhaustion', amount: 4 }], { ...vitals, exhaustion: 98, exhaustionMax: 99 }).exhaustion).toBe(99)
  })

  it('garde une jauge déjà au-dessus de son maximum quand elle gagne', () => {
    expect(knApplyCriticalEffects([{ type: 'toughness', amount: 3 }], { ...vitals, toughness: 25 }).toughness).toBe(25)
  })

  it('retire les dégâts à la Robustesse d\'abord, puis à la Santé', () => {
    const small = knApplyCriticalEffects([{ type: 'damage', amount: 3, dice: 'D6 : 3' }], vitals)
    const overflow = knApplyCriticalEffects([{ type: 'damage', amount: 8, dice: '2D6 : 3 + 5' }], vitals)
    const lethal = knApplyCriticalEffects([{ type: 'damage', amount: 20, dice: '2D6 : 6 + 6' }], vitals)

    expect(small).toMatchObject({ toughness: 2, health: 8 })
    expect(overflow).toMatchObject({ toughness: 0, health: 5 })
    expect(lethal).toMatchObject({ toughness: 0, health: 0 })
  })

  it('ne touche pas à la valeur d\'origine et ignore la hausse de dé, qui concerne le run', () => {
    const copy = { ...vitals }
    const result = knApplyCriticalEffects([{ type: 'usageDieUp' }, { type: 'exhaustion', amount: 1 }], vitals)

    expect(vitals).toEqual(copy)
    expect(result).toMatchObject({ exhaustion: 5, health: 8 })
  })
})

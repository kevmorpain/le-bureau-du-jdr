import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { KN_PERK_KEYS, knHasPerk, knPerkKeysSchema, knPerkSources } from '../../shared/ker-nethalas/perks'
import { resolveKnSheet } from '../../shared/ker-nethalas/resolve'
import { emptyKnRun, knAdjustScavenge, knCurrentVisit, knMarkScavengeApplied, knMarkScavengeOutcome, knRecordScavenge, knStartVisit, knRunSchema } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'

const resolve = (perks: Parameters<typeof knPerkSources>[0]) => resolveKnSheet({
  skills: defaultKnSkills(),
  extraSkills: [],
  resistances: { endurance: 40, resolve: 20, spellward: 20 },
  exhaustion: 0,
  maxVitals: { health: 15, toughness: 25, aether: 12, sanity: 14 },
  status: emptyKnStatus(),
  run: emptyKnRun(),
  extraSources: knPerkSources(perks),
})

describe('Atouts', () => {
  it('le schéma accepte les six Atouts, une seule fois chacun', () => {
    expect(KN_PERK_KEYS).toHaveLength(6)
    expect(knPerkKeysSchema.safeParse([...KN_PERK_KEYS]).success).toBe(true)
    expect(knPerkKeysSchema.safeParse(['scholar', 'scholar']).success).toBe(false)
    expect(knPerkKeysSchema.safeParse(['inconnu']).success).toBe(false)
    expect(knHasPerk(['scavenger'], 'scavenger')).toBe(true)
    expect(knHasPerk([], 'scavenger')).toBe(false)
  })

  it('l\'Atout d\'Avantage en Raison la donne à Raison, et à elle seule', () => {
    const sheet = resolve(['scholar'])

    expect(sheet.skills.reason.rollMode).toBe('advantage')
    expect(sheet.skills.perception.rollMode).toBe('normal')
    expect(resolve([]).skills.reason.rollMode).toBe('normal')
  })

  it('les autres Atouts agissent dans le test ou la salle concernés, pas sur la fiche', () => {
    const others = KN_PERK_KEYS.filter(key => key !== 'scholar')

    expect(knPerkSources(others)).toEqual([])
  })
})

describe('Fouille ajustable : ajuster le tirage de Fouille', () => {
  const scavenged = (roll: number) => knRecordScavenge(knStartVisit(emptyKnRun(), 'room'), roll)
  const rollOf = (run: ReturnType<typeof scavenged>) => knCurrentVisit(run)!.scavenge!

  it('ajoute ou retranche le D4, dans les bornes de la table', () => {
    expect(rollOf(knAdjustScavenge(scavenged(10), 3, 20))).toMatchObject({ roll: 13, adjusted: true })
    expect(rollOf(knAdjustScavenge(scavenged(10), -3, 20))).toMatchObject({ roll: 7, adjusted: true })
    expect(rollOf(knAdjustScavenge(scavenged(19), 4, 20)).roll).toBe(20)
    expect(rollOf(knAdjustScavenge(scavenged(2), -4, 20)).roll).toBe(1)
  })

  it('une seule fois, et plus rien une fois le résultat pris ou appliqué', () => {
    const once = knAdjustScavenge(scavenged(10), 2, 20)

    expect(knAdjustScavenge(once, 1, 20)).toBe(once)
    const applied = knMarkScavengeApplied(scavenged(10))
    expect(knAdjustScavenge(applied, 1, 20)).toBe(applied)
    const taken = knMarkScavengeOutcome(scavenged(10), 0)
    expect(knAdjustScavenge(taken, 1, 20)).toBe(taken)
  })

  it('ne fait rien sans tirage de Fouille', () => {
    const run = knStartVisit(emptyKnRun(), 'room')

    expect(knAdjustScavenge(run, 2, 20)).toBe(run)
    expect(knRunSchema.safeParse(knAdjustScavenge(scavenged(5), 2, 20)).success).toBe(true)
  })
})

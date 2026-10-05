import { describe, it, expect } from 'vitest'
import { spells } from '../../server/db/seeds/data/spells'
import {
  armSpell, castDuration, durationLabel, durationRounds, durationText, elapseConditionRounds, elapseRound, endConcentrationEntries,
  MAX_COUNTED_ROUNDS, type SpellDuration, type SpellDurationRow,
} from '../../shared/rules/durations'
import { spellSchema } from '../../shared/utils/spell'
import { temporaryEffectSchema, type TemporaryEffect } from '../../shared/utils/temporary_effects'

const entry = (over: Partial<TemporaryEffect> = {}): TemporaryEffect => ({ id: 1, name: 'Effet', active: true, effects: [], ...over })

const row = (over: Partial<SpellDurationRow> = {}): SpellDurationRow =>
  ({ durationUnit: 'minute', durationValue: 1, duration: '1 minute', concentration: false, ...over })

describe('durée structurée d\'un sort', () => {
  it('un sort instantané n\'est pas suivi', () => {
    expect(castDuration(row({ durationUnit: 'instant', durationValue: null, duration: 'Instantanée' }))).toBeNull()
  })

  it('1 minute = 10 rounds (un round ≈ six secondes)', () => {
    expect(durationRounds({ durationUnit: 'round', durationValue: 1 })).toBe(1)
    expect(durationRounds({ durationUnit: 'minute', durationValue: 1 })).toBe(10)
    expect(durationRounds({ durationUnit: 'minute', durationValue: 10 })).toBe(100)
  })

  it('au-delà de 10 minutes ou sans quantité : suivi sans décompte', () => {
    expect(durationRounds({ durationUnit: 'minute', durationValue: 11 })).toBeNull()
    expect(durationRounds({ durationUnit: 'hour', durationValue: 1 })).toBeNull()
    expect(durationRounds({ durationUnit: 'until_dispelled', durationValue: null })).toBeNull()
    expect(durationRounds({ durationUnit: 'special', durationValue: null })).toBeNull()
    expect(castDuration(row({ durationUnit: 'hour', durationValue: 8, duration: '8 heures' }))).toEqual({ label: '8 heures', rounds: null })
  })

  it('le libellé suit le nombre, et le texte d\'un sort concentré reprend la formulation des sorts à concentration', () => {
    expect(durationLabel({ durationUnit: 'minute', durationValue: 1 })).toBe('1 minute')
    expect(durationLabel({ durationUnit: 'minute', durationValue: 10 })).toBe('10 minutes')
    expect(durationText({ durationUnit: 'minute', durationValue: 1 }, true)).toBe('Concentration, jusqu\'à 1 minute')
    expect(durationText({ durationUnit: 'until_dispelled', durationValue: null }, false)).toBe('Jusqu\'à dissipation')
  })

  it('la durée spéciale est le texte saisi, tel quel, sans décompte', () => {
    const special = row({ durationUnit: 'special', durationValue: null, duration: 'Instantanée ou 1 heure' })
    expect(castDuration(special)).toEqual({ label: 'Instantanée ou 1 heure', rounds: null })
  })
})

// Les formulations seedées et la structure qui les décrit : la migration 0129 en pose la même table.
const SEEDED_FORMS: Record<string, SpellDuration> = {
  'Instantanée': { durationUnit: 'instant', durationValue: null },
  '1 round': { durationUnit: 'round', durationValue: 1 },
  '1 minute': { durationUnit: 'minute', durationValue: 1 },
  'Concentration, jusqu\'à 1 minute': { durationUnit: 'minute', durationValue: 1 },
  '10 minutes': { durationUnit: 'minute', durationValue: 10 },
  'Concentration, jusqu\'à 10 minutes': { durationUnit: 'minute', durationValue: 10 },
  '1 heure': { durationUnit: 'hour', durationValue: 1 },
  'Concentration, jusqu\'à 1 heure': { durationUnit: 'hour', durationValue: 1 },
  '8 heures': { durationUnit: 'hour', durationValue: 8 },
  'Concentration, jusqu\'à 8 heures': { durationUnit: 'hour', durationValue: 8 },
  'Jusqu\'à 8 heures': { durationUnit: 'hour', durationValue: 8 },
  'Jusqu\'à dissipation ou déclenchement': { durationUnit: 'until_dispelled', durationValue: null },
  'Instantanée ou 1 heure': { durationUnit: 'special', durationValue: null },
}

// Formulations que le texte dérivé de la structure ne reproduit pas mot pour mot : le seed garde sa formulation d'origine.
const VERBATIM = ['Jusqu\'à 8 heures', 'Jusqu\'à dissipation ou déclenchement', 'Instantanée ou 1 heure']

describe('seed sorts — durées structurées', () => {
  it('chaque sort déclare la structure de son texte, et la concentration suit le texte', () => {
    for (const spell of spells) {
      const expected = SEEDED_FORMS[spell.duration]
      expect(expected, `forme inconnue : ${spell.duration}`).toBeDefined()
      expect({ durationUnit: spell.durationUnit, durationValue: spell.durationValue ?? null }, spell.name).toEqual(expected)
      expect(!!spell.concentration, spell.name).toBe(spell.duration.startsWith('Concentration'))
    }
  })

  it('le texte dérivé de la structure est celui du seed, hors formulations conservées', () => {
    for (const spell of spells.filter(s => !VERBATIM.includes(s.duration))) {
      expect(durationText({ durationUnit: spell.durationUnit!, durationValue: spell.durationValue ?? null }, !!spell.concentration), spell.name).toBe(spell.duration)
    }
  })
})

describe('création d\'un sort — durée', () => {
  const base = {
    name: 'Test', level: 1, schoolId: 1, castingTime: '1 action', range: 9, components: ['V'], ritual: false,
    concentration: false, description: 'x', durationUnit: 'minute', durationValue: 1,
  }

  it('le texte affiché est dérivé de la structure', () => {
    expect(spellSchema.parse(base)).toMatchObject({ duration: '1 minute', durationUnit: 'minute', durationValue: 1 })
    expect(spellSchema.parse({ ...base, concentration: true, durationValue: 10 })).toMatchObject({ duration: 'Concentration, jusqu\'à 10 minutes' })
  })

  it('une unité chiffrée exige une quantité ; les autres l\'écartent', () => {
    expect(spellSchema.safeParse({ ...base, durationValue: undefined }).success).toBe(false)
    expect(spellSchema.safeParse({ ...base, durationValue: 0 }).success).toBe(false)
    expect(spellSchema.parse({ ...base, durationUnit: 'until_dispelled', durationValue: 3 })).toMatchObject({ durationValue: null, duration: 'Jusqu\'à dissipation' })
  })

  it('le cas spécial garde le texte saisi et l\'exige', () => {
    const special = { ...base, durationUnit: 'special', durationValue: undefined }
    expect(spellSchema.parse({ ...special, duration: 'Jusqu\'au prochain lever du soleil' })).toMatchObject({ duration: 'Jusqu\'au prochain lever du soleil', durationValue: null })
    expect(spellSchema.safeParse({ ...special, duration: '  ' }).success).toBe(false)
    expect(spellSchema.safeParse(special).success).toBe(false)
  })

  it('un sort instantané ne se concentre pas', () => {
    expect(spellSchema.safeParse({ ...base, durationUnit: 'instant', durationValue: undefined, concentration: true }).success).toBe(false)
  })
})

describe('décompte des rounds', () => {
  const tracked = (over: Partial<TemporaryEffect> = {}) => entry({ spellId: 5, countdown: { rounds: 2, remaining: 2 }, ...over })

  it('un round fait perdre un round aux entrées actives qui comptent', () => {
    const { entries, ended } = elapseRound([tracked()])
    expect(entries[0]!.countdown).toEqual({ rounds: 2, remaining: 1 })
    expect(ended).toEqual([])
  })

  it('une entrée sans décompte ou désactivée n\'est pas touchée', () => {
    const list = [entry({ id: 1 }), tracked({ id: 2, active: false })]
    expect(elapseRound(list).entries).toEqual(list)
  })

  it('à zéro, une entrée de pur suivi est retirée', () => {
    const { entries, ended } = elapseRound([tracked({ countdown: { rounds: 2, remaining: 1 } })])
    expect(entries).toEqual([])
    expect(ended).toEqual([{ id: 1, name: 'Effet', spellId: 5, concentration: undefined }])
  })

  it('à zéro, ce que le joueur a saisi est conservé, désactivé', () => {
    const withEffect = tracked({ countdown: { rounds: 2, remaining: 1 }, effects: [{ type: 'armor_class_bonus', value: { amount: 2 } }] })
    const withNote = tracked({ id: 2, countdown: { rounds: 2, remaining: 1 }, description: 'Note' })
    const { entries, ended } = elapseRound([withEffect, withNote])
    expect(entries.map(e => [e.id, e.active, e.countdown?.remaining])).toEqual([[1, false, 0], [2, false, 0]])
    expect(ended).toHaveLength(2)
  })

  it('une entrée déjà expirée ne « prend pas fin » une seconde fois', () => {
    const expired = tracked({ active: false, effects: [{ type: 'armor_class_bonus', value: { amount: 2 } }], countdown: { rounds: 2, remaining: 0 } })
    expect(elapseRound([expired]).ended).toEqual([])
  })

  it('le schéma refuse un reste supérieur à la durée et une durée au-delà du plafond', () => {
    expect(temporaryEffectSchema.safeParse(entry({ countdown: { rounds: 2, remaining: 3 } })).success).toBe(false)
    expect(temporaryEffectSchema.safeParse(entry({ countdown: { rounds: MAX_COUNTED_ROUNDS + 1, remaining: 1 } })).success).toBe(false)
    expect(temporaryEffectSchema.safeParse(entry({ countdown: { rounds: 2, remaining: 0 }, active: false })).success).toBe(true)
  })
})

describe('sorts suivis', () => {
  const cast = { spellId: 7, name: 'Bénédiction', label: '1 minute', concentration: true, rounds: 10 }

  it('lancer un sort crée une entrée active avec son décompte', () => {
    const [created] = armSpell([], cast)
    expect(created).toMatchObject({ id: 1, name: 'Bénédiction', spellId: 7, active: true, concentration: true, durationLabel: '1 minute', countdown: { rounds: 10, remaining: 10 } })
    expect(temporaryEffectSchema.safeParse(created).success).toBe(true)
  })

  it('le relancer réarme la même entrée et garde ce que le joueur y a saisi', () => {
    const existing = entry({ id: 3, spellId: 7, name: 'Bénédiction', active: false, effects: [{ type: 'armor_class_bonus', value: { amount: 1 } }], countdown: { rounds: 10, remaining: 0 } })
    const next = armSpell([entry({ id: 1 }), existing], cast)
    expect(next).toHaveLength(2)
    expect(next[1]).toMatchObject({ id: 3, active: true, effects: existing.effects, countdown: { rounds: 10, remaining: 10 } })
  })

  it('une durée qui ne se compte pas retire un décompte périmé', () => {
    const [refreshed] = armSpell([entry({ spellId: 7, countdown: { rounds: 10, remaining: 4 } })], { ...cast, label: '1 heure', concentration: false, rounds: null })
    expect(refreshed!.countdown).toBeUndefined()
    expect(refreshed!.durationLabel).toBe('1 heure')
  })

  it('perdre la concentration retire les sorts suivis qui en dépendaient, pas les autres', () => {
    const list = [
      entry({ id: 1, spellId: 7, concentration: true }),
      entry({ id: 2, spellId: 8, concentration: true }),
      entry({ id: 3, spellId: 9 }),
      entry({ id: 4 }),
    ]
    expect(endConcentrationEntries(list, 8).entries.map(e => e.id)).toEqual([2, 3, 4])
    expect(endConcentrationEntries(list, null).entries.map(e => e.id)).toEqual([3, 4])
  })
})

describe('durée des états', () => {
  it('décompte les états actifs et signale ceux qui prennent fin', () => {
    const { rounds, ended } = elapseConditionRounds({ poisoned: 3, prone: 1, stunned: 4 }, ['poisoned', 'prone'])
    expect(rounds).toEqual({ poisoned: 2 })
    expect(ended).toEqual(['prone'])
  })

  it('un état sans durée reste jusqu\'à ce qu\'on le retire', () => {
    expect(elapseConditionRounds({}, ['poisoned'])).toEqual({ rounds: {}, ended: [] })
  })
})

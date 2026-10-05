import { describe, it, expect } from 'vitest'
import { spells } from '../../server/db/seeds/data/spells'
import {
  armSpell, elapseConditionRounds, elapseRound, endConcentrationEntries, MAX_COUNTED_ROUNDS, parseSpellDuration,
} from '../../shared/rules/durations'
import { temporaryEffectSchema, type TemporaryEffect } from '../../shared/utils/temporary_effects'

const entry = (over: Partial<TemporaryEffect> = {}): TemporaryEffect => ({ id: 1, name: 'Effet', active: true, effects: [], ...over })

describe('durées de sort — lecture du texte seedé', () => {
  it('un sort instantané n\'est pas suivi', () => {
    expect(parseSpellDuration('Instantanée')).toBeNull()
    expect(parseSpellDuration('Instantanée ou 1 heure')).toBeNull()
  })

  it('1 minute = 10 rounds (un round ≈ six secondes, AideDD)', () => {
    expect(parseSpellDuration('1 round')).toEqual({ label: '1 round', concentration: false, rounds: 1 })
    expect(parseSpellDuration('1 minute')).toMatchObject({ rounds: 10, concentration: false })
    expect(parseSpellDuration('10 minutes')).toMatchObject({ rounds: 100 })
  })

  it('la concentration est reconnue et son préfixe retiré du libellé', () => {
    expect(parseSpellDuration('Concentration, jusqu\'à 1 minute')).toEqual({ label: '1 minute', concentration: true, rounds: 10 })
    expect(parseSpellDuration('Concentration, jusqu\'à 1 heure')).toEqual({ label: '1 heure', concentration: true, rounds: null })
  })

  it('au-delà de 10 minutes ou sans durée chiffrée : suivi sans décompte', () => {
    expect(parseSpellDuration('1 heure')).toMatchObject({ rounds: null })
    expect(parseSpellDuration('8 heures')).toMatchObject({ rounds: null })
    expect(parseSpellDuration('Jusqu\'à 8 heures')).toEqual({ label: '8 heures', concentration: false, rounds: null })
    expect(parseSpellDuration('Jusqu\'à dissipation ou déclenchement')).toMatchObject({ concentration: false, rounds: null })
  })

  it('toute durée du seed est classée, et aucune ne dépasse le plafond de décompte', () => {
    const durations = [...new Set(spells.map(s => s.duration))]
    for (const text of durations) {
      const parsed = parseSpellDuration(text)
      if (parsed === null) expect(text).toMatch(/^Instantanée/)
      else expect(parsed.rounds === null || parsed.rounds <= MAX_COUNTED_ROUNDS, text).toBe(true)
    }
    const countable = durations.filter(t => /\b(round|minute)s?\b/.test(t))
    for (const text of countable) expect(parseSpellDuration(text)?.rounds, text).not.toBeNull()
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

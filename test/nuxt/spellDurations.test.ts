import { describe, it, expect } from 'vitest'
import { baseScores, mountSheet } from './fixtures/mountSheet'

const bless = { id: 1, name: 'Bénédiction', duration: 'Concentration, jusqu\'à 1 minute', durationUnit: 'minute', durationValue: 1, concentration: true } as const
const shield = { id: 2, name: 'Bouclier', duration: '1 round', durationUnit: 'round', durationValue: 1, concentration: false } as const
const mageArmor = { id: 3, name: 'Armure du mage', duration: '8 heures', durationUnit: 'hour', durationValue: 8, concentration: false } as const
const fireBolt = { id: 4, name: 'Trait de feu', duration: 'Instantanée', durationUnit: 'instant', durationValue: null, concentration: false } as const
const haste = { id: 5, name: 'Hâte', duration: 'Concentration, jusqu\'à 1 minute', durationUnit: 'minute', durationValue: 1, concentration: true } as const

const mount = () => mountSheet({ scores: baseScores(10, 10, 10, 10) })

describe('sorts actifs — lancement et décompte', () => {
  it('un sort à concentration lancé devient un effet suivi, décompté round par round', async () => {
    const s = await mount()
    s.activateSpell(bless)
    expect(s.concentratingSpellId.value).toBe(1)
    expect(s.temporaryEffects.value).toMatchObject([{ name: 'Bénédiction', spellId: 1, concentration: true, countdown: { rounds: 10, remaining: 10 } }])

    for (let i = 0; i < 9; i++) s.elapseDurations()
    expect(s.temporaryEffects.value[0]!.countdown!.remaining).toBe(1)
    expect(s.isConcentrating.value).toBe(true)

    s.elapseDurations()
    expect(s.temporaryEffects.value).toEqual([])
    expect(s.isConcentrating.value).toBe(false)
  })

  it('un sort instantané n\'est pas suivi ; une durée en heures l\'est, sans décompte', async () => {
    const s = await mount()
    s.activateSpell(fireBolt)
    expect(s.temporaryEffects.value).toEqual([])

    s.activateSpell(mageArmor)
    s.elapseDurations()
    expect(s.temporaryEffects.value).toMatchObject([{ name: 'Armure du mage', durationLabel: '8 heures', active: true }])
    expect(s.temporaryEffects.value[0]!.countdown).toBeUndefined()
  })

  it('un sort sans concentration expire sans toucher à la concentration en cours', async () => {
    const s = await mount()
    s.activateSpell(bless)
    s.activateSpell(shield)
    s.elapseDurations()
    expect(s.temporaryEffects.value.map(e => e.name)).toEqual(['Bénédiction'])
    expect(s.concentratingSpellId.value).toBe(1)
  })

  it('lancer un autre sort à concentration retire le suivi du premier', async () => {
    const s = await mount()
    s.activateSpell(bless)
    s.activateSpell(shield)
    s.activateSpell(haste)
    expect(s.temporaryEffects.value.map(e => e.name)).toEqual(['Bouclier', 'Hâte'])
  })

  it('rompre la concentration retire le suivi ; ce que le joueur a saisi est seulement désactivé', async () => {
    const s = await mount()
    s.activateSpell(bless)
    s.saveTemporaryEffect({ ...s.temporaryEffects.value[0]!, effects: [{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }] })
    s.activateSpell(haste)
    s.setConcentration(null)
    expect(s.temporaryEffects.value.map(e => [e.name, e.active])).toEqual([['Bénédiction', false]])
  })

  it('relancer un sort réarme son décompte', async () => {
    const s = await mount()
    s.activateSpell(bless)
    s.elapseDurations()
    s.elapseDurations()
    s.activateSpell(bless)
    expect(s.temporaryEffects.value).toHaveLength(1)
    expect(s.temporaryEffects.value[0]!.countdown).toEqual({ rounds: 10, remaining: 10 })
  })

  it('un effet saisi à la main avec une durée se décompte aussi, et réactivé il repart de zéro', async () => {
    const s = await mount()
    s.saveTemporaryEffect({
      name: 'Bénédiction reçue', active: true, countdown: { rounds: 1, remaining: 1 },
      effects: [{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }],
    })
    s.elapseDurations()
    expect(s.temporaryEffects.value).toMatchObject([{ active: false, countdown: { rounds: 1, remaining: 0 } }])
    s.toggleTemporaryEffect(s.temporaryEffects.value[0]!.id)
    expect(s.temporaryEffects.value).toMatchObject([{ active: true, countdown: { rounds: 1, remaining: 1 } }])
  })
})

describe('états — durée en rounds', () => {
  it('un état avec une durée prend fin quand elle est écoulée, un état sans durée reste', async () => {
    const s = await mount()
    s.toggleCondition('poisoned', 2)
    s.toggleCondition('prone')
    s.elapseDurations()
    expect(s.activeConditions.value).toEqual(['poisoned', 'prone'])
    s.elapseDurations()
    expect(s.activeConditions.value).toEqual(['prone'])
    expect(s.conditionRounds.value.poisoned).toBeUndefined()
  })

  it('retirer l\'état à la main efface sa durée', async () => {
    const s = await mount()
    s.toggleCondition('poisoned', 5)
    s.toggleCondition('poisoned')
    expect(s.conditionRounds.value).toEqual({})
  })
})

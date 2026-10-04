import { describe, it, expect, afterEach, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { Effect } from '../../server/db/schema/effects'
import { useCharacterRolls } from '../../app/composables/character/useCharacterRolls'
import { useCombatTracker } from '../../app/composables/character/useCombatTracker'
import { useDiceRoller } from '../../app/composables/useDiceRoller'

// Le lanceur de dés : un tirage scripté (Math.random) pour vérifier ce que `roll()` fait des politiques de la fiche —
// avantage choisi, relance, critique et doublement des dés, initiative conservée, historique.

// Chaque face demandée est rendue dans l'ordre : `(face - 1) / côtés` retombe sur la bonne face avec `floor(x * côtés) + 1`.
const script = (...rolls: [face: number, sides: number][]) => {
  const queue = [...rolls]
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const [face, sides] = queue.shift()!
    return (face - 1) / sides + 0.001
  })
}
const d20 = (...faces: number[]) => script(...faces.map(f => [f, 20] as [number, number]))
const d8 = (...faces: number[]) => script(...faces.map(f => [f, 8] as [number, number]))

let nextId = 9700

const mountRoller = async (options: { effects?: Effect[], extraDice?: number } = {}) => {
  const characterId = nextId++
  const engine = useCharacterRolls({
    characterId,
    activeConditions: ref([]),
    exhaustionLevel: ref(0),
    armorNonProficient: computed(() => false),
    stealthArmor: computed(() => false),
    effectSources: computed(() => []),
    allEffects: computed(() => options.effects ?? []),
    getEffectiveProficiency: () => 'none',
    criticalExtraDice: computed(() => options.extraDice ?? 0),
  })
  let api!: ReturnType<typeof useDiceRoller>
  await mountSuspended(defineComponent({
    setup() {
      api = useDiceRoller(engine)
      return () => h('div')
    },
  }))
  api.toasts.value = []
  return { ...api, engine, characterId }
}

afterEach(() => vi.restoreAllMocks())

describe('useDiceRoller — jets de d20', () => {
  it('rend le résultat, l\'affiche et le garde dans l\'historique', async () => {
    const r = await mountRoller()
    d20(12)
    const result = r.roll('Sagesse', 3, 20, 1, { d20: { type: 'check', ability: 'wis' } })
    expect(result).toBe(15)
    expect(r.toasts.value).toHaveLength(1)
    expect(r.history.entries.value[0]).toMatchObject({ label: 'Sagesse', rolls: [12], natural: 12, modifier: 3, result: 15, mode: 'normal' })
  })

  it('l\'avantage choisi lance deux dés, garde le plus haut puis retombe sur Auto', async () => {
    const r = await mountRoller()
    r.engine.pending.value = { override: 'advantage', situations: [], crit: false }
    d20(4, 17)
    expect(r.roll('Attaque', 5, 20, 1, { d20: { type: 'attack', weapon: true } })).toBe(22)
    expect(r.history.entries.value[0]).toMatchObject({ rolls: [4, 17], keptIndex: 1, mode: 'advantage', advantage: ['Choix du joueur'] })
    expect(r.engine.pending.value.override).toBe('auto')
  })

  it('le désavantage choisi garde le plus bas', async () => {
    const r = await mountRoller()
    r.engine.pending.value = { override: 'disadvantage', situations: [], crit: false }
    d20(17, 4)
    expect(r.roll('JS', 0, 20, 1, { d20: { type: 'save', ability: 'dex' } })).toBe(4)
  })

  it('Chanceux : le 1 est relancé et le second résultat compte', async () => {
    const r = await mountRoller({ effects: [{ type: 'reroll', value: { rollType: 'd20', trigger: 1 } }] })
    d20(1, 14)
    expect(r.roll('Attaque', 2, 20, 1, { d20: { type: 'attack', weapon: true } })).toBe(16)
    expect(r.history.entries.value[0]).toMatchObject({ rerolled: { from: 1, to: 14 }, isFumble: false })
  })

  it('un d20 sans type de jet reste un d20 nu : pas de relance, 20 naturel marqué', async () => {
    const r = await mountRoller({ effects: [{ type: 'reroll', value: { rollType: 'd20', trigger: 1 } }] })
    d20(1)
    r.roll('Jet de mort', 0)
    expect(r.history.entries.value[0]).toMatchObject({ rolls: [1], isFumble: true })
    d20(20)
    r.roll('Jet de mort', 0)
    expect(r.history.entries.value[0]!.isCrit).toBe(true)
  })

  it('l\'initiative est conservée, jusqu\'à son prochain jet', async () => {
    const r = await mountRoller()
    const tracker = useCombatTracker(r.characterId)
    d20(14)
    r.roll('Initiative', 2, 20, 1, { d20: { type: 'initiative' } })
    await nextTick()
    expect(tracker.initiative.value).toEqual({ total: 16, natural: 14 })
    d20(3)
    r.roll('Initiative', 2, 20, 1, { d20: { type: 'initiative' } })
    await nextTick()
    expect(tracker.initiative.value).toEqual({ total: 5, natural: 3 })
  })

  it('garde de quoi rejouer le jet à l\'identique', async () => {
    const r = await mountRoller()
    d20(10)
    r.roll('Discrétion', 4, 20, 1, { d20: { type: 'check', ability: 'dex', skill: 'stealth' } })
    expect(r.history.entries.value[0]!.replay).toEqual({
      label: 'Discrétion', modifier: 4, sides: 20, count: 1, options: { d20: { type: 'check', ability: 'dex', skill: 'stealth' } },
    })
  })
})

describe('useDiceRoller — coups critiques', () => {
  const attack = (r: Awaited<ReturnType<typeof mountRoller>>, face: number) => {
    d20(face)
    r.roll('Attaque', 5, 20, 1, { d20: { type: 'attack', weapon: true } })
  }

  it('un 20 naturel à l\'attaque double les dés des dégâts, jamais le modificateur', async () => {
    const r = await mountRoller()
    attack(r, 20)
    expect(r.engine.pending.value.crit).toBe(true)
    d8(2, 3)
    expect(r.roll('Dégâts', 3, 8, 1, { damage: { weaponDie: { melee: true } } })).toBe(2 + 3 + 3)
    expect(r.history.entries.value[0]).toMatchObject({ rolls: [2, 3], critDamage: true })
  })

  it('les dés d\'Attaque sournoise doublent aussi, sans dé de Critique brutal', async () => {
    const r = await mountRoller({ extraDice: 2 })
    attack(r, 20)
    script(...[1, 2, 3, 4].map(f => [f, 6] as [number, number]))
    r.roll('Attaque sournoise', 0, 6, 2, { damage: {} })
    expect(r.history.entries.value[0]!.rolls).toHaveLength(4)
  })

  it('Critique brutal : dés de l\'arme en plus, en mêlée seulement', async () => {
    const r = await mountRoller({ extraDice: 2 })
    attack(r, 20)
    d8(1, 2, 3, 4)
    r.roll('Dégâts', 0, 8, 1, { damage: { weaponDie: { melee: true } } })
    expect(r.history.entries.value[0]!.rolls).toHaveLength(4)

    d8(1, 2)
    r.roll('Dégâts à distance', 0, 8, 1, { damage: { weaponDie: { melee: false } } })
    expect(r.history.entries.value[0]!.rolls).toHaveLength(2)
  })

  it('la plage de critique élargie du Champion déclenche le critique', async () => {
    const r = await mountRoller({ effects: [{ type: 'critical_range', value: { from: 19 } }] })
    attack(r, 19)
    expect(r.engine.pending.value.crit).toBe(true)
    expect(r.history.entries.value[0]!.isCrit).toBe(true)
  })

  it('une attaque non critique retire le critique en cours', async () => {
    const r = await mountRoller()
    attack(r, 20)
    attack(r, 9)
    expect(r.engine.pending.value.crit).toBe(false)
    d8(5)
    r.roll('Dégâts', 0, 8, 1, { damage: { weaponDie: { melee: true } } })
    expect(r.history.entries.value[0]!.rolls).toHaveLength(1)
  })

  it('un jet sans option de dégâts (dé de vie, soins) n\'est jamais doublé', async () => {
    const r = await mountRoller()
    attack(r, 20)
    d8(6)
    r.roll('Dé de vie d8', 2, 8, 1)
    expect(r.history.entries.value[0]).toMatchObject({ rolls: [6] })
    expect(r.history.entries.value[0]!.critDamage).toBeUndefined()
  })

  it('le critique choisi à la main (cible paralysée) double les dégâts sans attaque', async () => {
    const r = await mountRoller()
    r.engine.pending.value = { override: 'auto', situations: [], crit: true }
    d8(4, 5)
    r.roll('Dégâts', 0, 8, 1, { damage: { weaponDie: { melee: true } } })
    expect(r.history.entries.value[0]!.rolls).toEqual([4, 5])
  })

  it('un jet de caractéristique ne touche pas au critique en cours', async () => {
    const r = await mountRoller()
    attack(r, 20)
    d20(8)
    r.roll('Force', 3, 20, 1, { d20: { type: 'check', ability: 'str' } })
    expect(r.engine.pending.value.crit).toBe(true)
  })
})

describe('useDiceRoller — historique', () => {
  it('garde les jets les plus récents en tête, bornés à cent', async () => {
    const r = await mountRoller()
    for (let i = 0; i < 105; i++) {
      d8(1)
      r.roll(`Jet ${i}`, 0, 8, 1)
    }
    expect(r.history.entries.value).toHaveLength(100)
    expect(r.history.entries.value[0]!.label).toBe('Jet 104')
  })

  it('s\'efface à la demande', async () => {
    const r = await mountRoller()
    d8(1)
    r.roll('Jet', 0, 8, 1)
    r.history.clear()
    expect(r.history.entries.value).toEqual([])
  })
})

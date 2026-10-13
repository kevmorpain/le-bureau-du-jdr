import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { knAdvanceRooms } from '../../shared/ker-nethalas/combatEffects'
import {
  KN_POTION_EXPLOSION,
  knAgedEffects,
  knAgingAt,
  knIdentifyPotion,
  knPlanConsumable,
  knPotionAgingSchema,
  knSpendConsumable,
  type KnAgingEntry,
  type KnPotionAging,
} from '../../shared/ker-nethalas/consumables'
import { knItemSchema, type KnItem } from '../../shared/ker-nethalas/inventory'
import { knApplyLoot, knConsumableEntry, knLootContentSchema, knRollLoot, type KnLootContent } from '../../shared/ker-nethalas/loot'
import { emptyKnRun } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { knApplyTableEffects, type KnTableEffect, type KnTableEffectState } from '../../shared/ker-nethalas/tables'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
const sequence = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]!
}

const state = (patch: Partial<KnTableEffectState> = {}): KnTableEffectState => ({
  coins: 0,
  xp: 0,
  provisions: emptyKnProvisions(),
  health: 8,
  toughness: 4,
  sanity: 10,
  aether: 3,
  exhaustion: 0,
  status: emptyKnStatus(),
  run: emptyKnRun(),
  ...patch,
})
const maxima = { health: 12, toughness: 10, sanity: 10, aether: 10 }

const aging: KnPotionAging = {
  die: 20,
  entries: [
    { min: 1, max: 2, text: 'tourné', outcome: 'poison' },
    { min: 3, max: 4, text: 'explose', outcome: 'explosion' },
    { min: 5, max: 6, text: 'éventé', outcome: 'inert' },
    { min: 7, max: 10, text: 'faible', outcome: 'weak' },
    { min: 11, max: 17, text: 'normal', outcome: 'normal' },
    { min: 18, max: 19, text: 'raffiné', outcome: 'refined' },
    { min: 20, max: 20, text: 'parfait', outcome: 'permanent' },
  ],
}
const at = (roll: number) => knAgingAt(aging, roll) as KnAgingEntry

describe('effets de consommable sur la fiche', () => {
  it('soigner des Blessures remplit la Robustesse avant la Santé', () => {
    const { state: next } = knApplyTableEffects([{ kind: 'woundsHeal', dice: d(0, 0, 9) }], state(), maxima)

    expect(next.toughness).toBe(10)
    expect(next.health).toBe(11)
  })

  it('retirer un état ne touche pas aux autres', () => {
    const status = { ...emptyKnStatus(), conditions: [{ key: 'poisoned' as const, value: 1 }, { key: 'cursed' as const }, { key: 'sickened' as const }] }
    const { state: next } = knApplyTableEffects([{ kind: 'conditionRemove', keys: ['cursed', 'sickened'] }], state({ status }), maxima)

    expect(next.status.conditions).toEqual([{ key: 'poisoned', value: 1 }])
  })

  const stoneskin: KnTableEffect = {
    kind: 'timed',
    label: 'Peau de pierre',
    rooms: d(1, 10),
    entries: [{ kind: 'modifier', target: 'dodge', amount: -10 }],
  }

  it('un effet à durée en salles se pose sans l\'étiquette de combat', () => {
    const { state: next } = knApplyTableEffects([stoneskin], state(), maxima, sequence(0.5))

    expect(next.status.custom).toEqual([{ id: 'room:Peau de pierre', name: 'Peau de pierre', active: true, entries: [{ kind: 'modifier', target: 'dodge', amount: -10 }], rooms: 6 }])
  })

  it('le vieillissement change montants et durées, ou rend l\'effet permanent', () => {
    const roll = sequence(0.5)
    const weak = knApplyTableEffects([stoneskin], state(), maxima, roll, { scale: { amount: 0.5, duration: 0.5 } }).state.status.custom[0]!
    const refined = knApplyTableEffects([stoneskin], state(), maxima, roll, { scale: { amount: 2, duration: 1.5 } }).state.status.custom[0]!
    const permanent = knApplyTableEffects([stoneskin], state(), maxima, roll, { scale: { amount: 1, duration: 1, permanent: true } }).state.status.custom[0]!

    expect(weak).toMatchObject({ rooms: 3, entries: [{ amount: -5 }] })
    expect(refined).toMatchObject({ rooms: 9, entries: [{ amount: -20 }] })
    expect(permanent.rooms).toBeUndefined()
    expect(permanent.combat).toBeUndefined()
  })

  it('le vieillissement change aussi un gain chiffré', () => {
    const heal: KnTableEffect[] = [{ kind: 'temporary', vital: 'toughness', dice: d(0, 0, 8) }]

    expect(knApplyTableEffects(heal, state(), maxima, Math.random, { scale: { amount: 2, duration: 1.5 } }).state.status.temporary?.toughness).toBe(16)
    expect(knApplyTableEffects(heal, state(), maxima, Math.random, { scale: { amount: 0.5, duration: 0.5 } }).state.status.temporary?.toughness).toBe(4)
  })
})

describe('durée en salles', () => {
  const posed = (rooms: number) => ({ ...emptyKnStatus(), custom: [{ id: 'room:x', name: 'x', active: true, entries: [], rooms }, { id: 'a', name: 'a', active: true, entries: [] }] })

  it('l\'effet tient dans les salles annoncées, et cesse à l\'entrée de la suivante', () => {
    let status = posed(2)
    const seen: (number | undefined)[] = []
    for (let room = 1; room <= 4; room++) {
      status = knAdvanceRooms(status).status
      seen.push(status.custom.find(modifier => modifier.id === 'room:x')?.rooms)
    }

    expect(seen).toEqual([1, 0, undefined, undefined])
  })

  it('rapporte ce qui cesse, et laisse intacts les effets sans durée en salles', () => {
    const result = knAdvanceRooms(posed(0))

    expect(result.expired).toEqual(['x'])
    expect(result.status.custom.map(modifier => modifier.id)).toEqual(['a'])
    expect(knAdvanceRooms(emptyKnStatus()).status).toEqual(emptyKnStatus())
  })
})

describe('vieillissement des potions', () => {
  it('une table couvre le D20 sans trou', () => {
    expect(knPotionAgingSchema.safeParse(aging).success).toBe(true)
    expect(knPotionAgingSchema.safeParse({ die: 20, entries: aging.entries.slice(1) }).success).toBe(false)
  })

  it('une potion tournée ne fait rien, une qui explose blesse, une éventée est inerte', () => {
    const effects: KnTableEffect[] = [{ kind: 'vital', vital: 'aether', dice: d(0, 0, 5), sign: 'gain' }]

    expect(knAgedEffects('poison', effects)).toEqual([])
    expect(knAgedEffects('explosion', effects)).toEqual(KN_POTION_EXPLOSION)
    expect(knAgedEffects('inert', effects)).toEqual([])
    expect(knAgedEffects('weak', effects)).toEqual(effects)
  })

  it('le plan d\'emploi porte l\'échelle, le test d\'Endurance du poison et le jet de l\'objet', () => {
    const entry = { text: 'x', use: { effects: [], roll: { dice: d(1, 10, 5), label: 'Blessures à soigner' } } }

    expect(knPlanConsumable(entry, at(1))).toMatchObject({ enduranceCheck: true, effects: [] })
    expect(knPlanConsumable(entry, at(1)).roll).toBeUndefined()
    expect(knPlanConsumable(entry, at(8))).toMatchObject({ scale: { amount: 0.5, duration: 0.5 }, enduranceCheck: false })
    expect(knPlanConsumable(entry, at(12)).scale).toBeUndefined()
    expect(knPlanConsumable(entry, at(12)).roll).toBeDefined()
    expect(knPlanConsumable(entry, at(20)).scale?.permanent).toBe(true)
    expect(knPlanConsumable(entry).roll).toBeDefined()
  })
})

describe('butin utilisable', () => {
  const content: KnLootContent = {
    valuable: { die: 20, entries: [{ min: 1, max: 20, text: 'Potion aléatoire', drop: { kind: 'table', table: 'potions' } }] },
    potions: {
      die: 20,
      entries: [
        { min: 1, max: 10, title: 'Soin', text: 'Soigne aussitôt D6+2 Blessures.', drop: { kind: 'potion' }, use: { effects: [{ kind: 'woundsHeal', dice: d(1, 6, 2) }] } },
        { min: 11, max: 20, title: 'Antidote', text: 'Retire aussitôt Empoisonné.', drop: { kind: 'potion' }, use: { effects: [{ kind: 'conditionRemove', keys: ['poisoned'] }] } },
      ],
    },
    fragments: { die: 20, entries: [{ min: 1, max: 20, title: 'Chaîne', text: 'Donne +10 Santé mentale temporaire.', drop: { kind: 'fragment' }, use: { effects: [{ kind: 'temporary', vital: 'sanity', dice: d(0, 0, 10) }] } }] },
  }
  const start = { inventory: [] as KnItem[], provisions: emptyKnProvisions() }

  it('le jeu de données accepte les effets d\'un résultat', () => {
    expect(knLootContentSchema.safeParse(content).success).toBe(true)
  })

  it('une potion trouvée est inconnue : ni son nom ni sa description ne se lisent', () => {
    const rolled = knRollLoot(content, 'valuable', sequence(0, 0.99))
    const { state: next } = knApplyLoot(start, rolled as Exclude<typeof rolled, { missing: unknown }>, [])
    const potion = next.inventory[0]!

    expect(potion).toMatchObject({ name: 'Potion non identifiée', kind: 'potion', consumable: { table: 'potions', roll: 20, identified: false } })
    expect(potion.note).not.toContain('Antidote')
    expect(knItemSchema.safeParse(potion).success).toBe(true)
    expect(knConsumableEntry(content, potion)?.title).toBe('Antidote')
  })

  it('identifier révèle la potion et fige son vieillissement ; un fragment se connaît d\'emblée', () => {
    const rolled = knRollLoot(content, 'potions', sequence(0))
    const potion = knApplyLoot(start, rolled as Exclude<typeof rolled, { missing: unknown }>, []).state.inventory[0]!
    const known = knIdentifyPotion(potion, knConsumableEntry(content, potion)!, 14)
    const fragment = knApplyLoot(start, knRollLoot(content, 'fragments', sequence(0)) as Exclude<ReturnType<typeof knRollLoot>, { missing: unknown }>, []).state.inventory[0]!

    expect(known).toMatchObject({ name: 'Potion : Soin', note: 'Soigne aussitôt D6+2 Blessures.', consumable: { identified: true, aging: 14 } })
    expect(fragment).toMatchObject({ name: 'Fragment : Chaîne', consumable: { table: 'fragments', roll: 1 } })
    expect(fragment.consumable?.identified).toBeUndefined()
  })

  it('le dernier exemplaire employé quitte l\'inventaire', () => {
    const items: KnItem[] = [
      { id: 'i1', name: 'Fragment', kind: 'fragment', weight: 'light', quantity: 2, place: 'bag' },
      { id: 'i2', name: 'Autre', kind: 'gear', weight: 'normal', quantity: 1, place: 'bag' },
    ]
    const once = knSpendConsumable(items, 'i1')

    expect(once[0]).toMatchObject({ id: 'i1', quantity: 1 })
    expect(knSpendConsumable(once, 'i1').map(item => item.id)).toEqual(['i2'])
  })
})

import { describe, it, expect } from 'vitest'
import { warlockInvocations } from '../../server/db/seeds/data/warlock_invocations'
import { fixed } from '../../shared/utils/formula'
import { baseScores, classFeature, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Les manifestations du Pacte de la lame ne valent que pour l'arme de pacte (`character_inventory.is_pact_weapon`).

const WARLOCK = 7
const FIGHTER = 3

const invocation = (id: number, name: string) => {
  const def = warlockInvocations.find(i => i.name === name)!
  return classFeature(id, name, WARLOCK, def.levelRequired, def.effects, 'eldritch_invocation')
}

const sword = { weapon_category: 'martial_melee', weapon_properties: ['versatile'], damage_dice: '1d8', versatile_damage: '1d10', damage_type: 'slashing' }
const dagger = { weapon_category: 'simple_melee', weapon_properties: ['finesse', 'light'], damage_dice: '1d4', damage_type: 'piercing' }

const weapons = (id: number) => [
  entry(id, 1, 'Épée de pacte', 'weapon', sword, [], { pactWeapon: true }),
  entry(id, 2, 'Dague', 'weapon', dagger),
]

const statsOf = (s: Awaited<ReturnType<typeof mount>>, name: string) => s.equippedWeaponStats.value.find(w => w.name === name)!

describe('fiche — arme de pacte', () => {
  const scores = baseScores(10, 10, 10, 10, 16)
  const scenario = { scores, classes: [{ classId: WARLOCK, level: 12 }], worn: weapons }

  it('sans manifestation, l\'arme de pacte ne change rien', async () => {
    const s = await mount(scenario)
    expect(statsOf(s, 'Épée de pacte')).toMatchObject({ attacksPerAction: 1, extraDamageFixed: [] })
  })

  it('Lame assoiffée : deux attaques avec l\'arme de pacte, une avec les autres', async () => {
    const s = await mount({ ...scenario, features: [invocation(1, 'Lame assoiffée')] })
    expect(statsOf(s, 'Épée de pacte').attacksPerAction).toBe(2)
    expect(statsOf(s, 'Dague').attacksPerAction).toBe(1)
  })

  it('Buveuse de vie : le modificateur de Charisme en nécrotique sur l\'arme de pacte seulement', async () => {
    const s = await mount({ ...scenario, features: [invocation(1, 'Buveuse de vie')] })
    expect(statsOf(s, 'Épée de pacte').extraDamageFixed).toEqual([{ name: 'Buveuse de vie', amount: 3, damageType: 'necrotic' }])
    expect(statsOf(s, 'Dague').extraDamageFixed).toEqual([])
  })

  it('Buveuse de vie vaut 1 au minimum quand le modificateur de Charisme est négatif', async () => {
    const s = await mount({ ...scenario, scores: baseScores(10, 10, 10, 10, 8), features: [invocation(1, 'Buveuse de vie')] })
    expect(statsOf(s, 'Épée de pacte').extraDamageFixed[0]!.amount).toBe(1)
  })

  it('une arme qui n\'est pas l\'arme de pacte n\'en reçoit rien, même quand les deux manifestations sont prises', async () => {
    const s = await mount({
      ...scenario,
      worn: id => [entry(id, 2, 'Dague', 'weapon', dagger)],
      features: [invocation(1, 'Lame assoiffée'), invocation(2, 'Buveuse de vie')],
    })
    expect(statsOf(s, 'Dague')).toMatchObject({ attacksPerAction: 1, extraDamageFixed: [] })
  })

  it('Lame assoiffée ne se cumule pas avec Attaque supplémentaire : le plus grand nombre l\'emporte', async () => {
    const extraAttack = classFeature(3, 'Attaque supplémentaire', FIGHTER, 5, [{ type: 'extra_attack', value: { attacks: fixed(3) } }])
    const s = await mount({
      scores,
      classes: [{ classId: WARLOCK, level: 12 }, { classId: FIGHTER, level: 11 }],
      worn: weapons,
      features: [invocation(1, 'Lame assoiffée'), extraAttack],
    })
    expect(statsOf(s, 'Épée de pacte').attacksPerAction).toBe(3)
    expect(statsOf(s, 'Dague').attacksPerAction).toBe(3)
  })
})

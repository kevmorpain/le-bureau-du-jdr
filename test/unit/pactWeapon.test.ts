import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { warlockInvocations } from '../../server/db/seeds/data/warlock_invocations'
import { pactWeaponBonus } from '../../shared/rules/pactWeapon'

// Les effets viennent des manifestations seedées, pour garder le test et la donnée solidaires.
const effectsOf = (name: string): Effect[] => warlockInvocations.find(i => i.name === name)!.effects

describe('arme de pacte', () => {
  it('sans manifestation, ni attaque en plus ni dégâts en plus', () => {
    expect(pactWeaponBonus([], 3)).toEqual({ attacksPerAction: 1, extraDamage: [] })
  })

  it('Lame assoiffée : deux attaques par action Attaquer', () => {
    expect(pactWeaponBonus(effectsOf('Lame assoiffée'), 3).attacksPerAction).toBe(2)
  })

  it('Buveuse de vie : dégâts nécrotiques égaux au modificateur de Charisme, 1 au minimum', () => {
    const lifedrinker = effectsOf('Buveuse de vie')
    const amount = (cha: number) => pactWeaponBonus(lifedrinker, cha).extraDamage
    expect(amount(3)).toEqual([{ name: 'Buveuse de vie', amount: 3, damageType: 'necrotic' }])
    expect(amount(1)[0]!.amount).toBe(1)
    expect(amount(0)[0]!.amount).toBe(1)
    expect(amount(-1)[0]!.amount).toBe(1)
  })

  it('les deux manifestations se cumulent, et un autre effet ne compte pas', () => {
    const effects = [...effectsOf('Lame assoiffée'), ...effectsOf('Buveuse de vie'), { type: 'armor_class_bonus', value: { amount: 1 } } as Effect]
    const bonus = pactWeaponBonus(effects, 2)
    expect(bonus.attacksPerAction).toBe(2)
    expect(bonus.extraDamage).toHaveLength(1)
  })
})

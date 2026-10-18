import type { Effect } from '~~/server/db/schema/effects'

export const PACT_WEAPON_ATTACKS = 2
export const LIFEDRINKER_NAME = 'Buveuse de vie'

export interface PactWeaponBonus {
  attacksPerAction: number
  extraDamage: { name: string, amount: number, damageType: 'necrotic' }[]
}

// Manifestations du Pacte de la lame, qui ne valent que pour l'arme de pacte : Lame assoiffée (deux attaques par action
// Attaquer) et Buveuse de vie (dégâts nécrotiques égaux au modificateur de Charisme, 1 au minimum).
export const pactWeaponBonus = (effects: readonly Effect[], charismaModifier: number): PactWeaponBonus => {
  const kinds = new Set(effects.flatMap(e => e.type === 'pact_weapon_modifier' ? [e.value.kind] : []))
  return {
    attacksPerAction: kinds.has('extra_attack') ? PACT_WEAPON_ATTACKS : 1,
    extraDamage: kinds.has('lifedrinker') ? [{ name: LIFEDRINKER_NAME, amount: Math.max(1, charismaModifier), damageType: 'necrotic' }] : [],
  }
}

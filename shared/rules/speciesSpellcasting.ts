import type { Effect } from '../../server/db/schema/effects'
import { ABILITY_KEYS, type AbilityKey } from './abilities'

// Caractéristique d'incantation des sorts octroyés par l'espèce (`spell_grant`), qui n'ont pas de classe : celle des
// effets de l'espèce, déjà remplacée par le choix du joueur quand le trait en propose un (Fadette).
export function speciesSpellcastingAbility(speciesEffects: Effect[]): AbilityKey | null {
  const grant = speciesEffects.find(e => e.type === 'spell_grant')
  const ability = grant?.type === 'spell_grant' ? grant.value.spellcastingAbility : undefined
  return ABILITY_KEYS.find(k => k === ability) ?? null
}

import { KN_BOUNDS } from './character'
import type { KnActiveSource, KnEffect } from './effects'
import type { KnMasteryAbility, KnMastery } from './masteries'
import { knCustomEntryEffect } from './resolve'
import type { KnMasteryEntry } from './amulets'

export const knSustainedKey = (masteryKey: string, tier: number) => `${masteryKey}:${tier}`

export const knAbilityIsPassive = (ability: Pick<KnMasteryAbility, 'action'>) => ability.action.startsWith('Passif')

const unlockedAbilities = (mastery: KnMastery, entry: KnMasteryEntry) =>
  mastery.abilities.filter(ability => ability.tier <= entry.tiers)

// Ce que les Maîtrises ajoutent à la fiche : le trait de chaque Maîtrise possédée, les effets des aptitudes débloquées, et,
// pour une aptitude Maintenue, son coût retranché de l'Éther maximum tant qu'elle est allumée.
export function knMasterySources(
  masteries: readonly KnMastery[],
  entries: readonly KnMasteryEntry[],
  sustained: readonly string[],
): KnActiveSource[] {
  const sources: KnActiveSource[] = []

  for (const entry of entries) {
    const mastery = masteries.find(candidate => candidate.key === entry.key)
    if (!mastery) continue

    if (mastery.feature.effects?.length) {
      sources.push({
        id: `mastery:${entry.key}:feature`,
        label: { text: mastery.feature.name },
        effects: mastery.feature.effects.map(knCustomEntryEffect),
        reminders: [],
      })
    }

    for (const ability of unlockedAbilities(mastery, entry)) {
      if (ability.sustained && !sustained.includes(knSustainedKey(entry.key, ability.tier))) continue

      const effects: KnEffect[] = []
      if (ability.sustained && ability.aether) effects.push({ type: 'maxVitalDelta', vital: 'aether', amount: -ability.aether })
      effects.push(...(ability.effects ?? []).map(knCustomEntryEffect))
      if (effects.length) {
        sources.push({ id: `mastery:${entry.key}:${ability.tier}`, label: { text: ability.name }, effects, reminders: [] })
      }
    }
  }

  return sources
}

// Une aptitude de lumière allumée dispense de source de lumière.
export function knMasteryProvidesLight(
  masteries: readonly KnMastery[],
  entries: readonly KnMasteryEntry[],
  sustained: readonly string[],
): boolean {
  return entries.some((entry) => {
    const mastery = masteries.find(candidate => candidate.key === entry.key)
    return mastery !== undefined && unlockedAbilities(mastery, entry).some(ability =>
      ability.light && (!ability.sustained || sustained.includes(knSustainedKey(entry.key, ability.tier))))
  })
}

export function knToggleSustained(sustained: readonly string[], key: string): string[] {
  return sustained.includes(key) ? sustained.filter(other => other !== key) : [...sustained, key]
}

export interface KnAbilityPurse {
  aetherCurrent: number
  healthCurrent: number
  exhaustion: number
}

export function knAbilityBlockers(ability: KnMasteryAbility, purse: KnAbilityPurse): string[] {
  return ability.aether !== null && purse.aetherCurrent < ability.aether ? ['Éther insuffisant'] : []
}

// Une aptitude Maintenue ne se paie pas : elle réduit l'Éther maximum, qui doit pouvoir absorber son coût.
export function knSustainBlockers(ability: KnMasteryAbility, effectiveAetherMax: number): string[] {
  return ability.aether !== null && effectiveAetherMax < ability.aether ? ['Éther maximum insuffisant'] : []
}

export function knPayAbility(ability: KnMasteryAbility, purse: KnAbilityPurse): KnAbilityPurse {
  return {
    aetherCurrent: Math.max(0, purse.aetherCurrent - (ability.aether ?? 0)),
    healthCurrent: Math.max(0, purse.healthCurrent - (ability.health ?? 0)),
    exhaustion: Math.min(KN_BOUNDS.exhaustion.max, purse.exhaustion + (ability.exhaustion ?? 0)),
  }
}

export function knCostSummary(ability: Pick<KnMasteryAbility, 'aether' | 'exhaustion' | 'health'>): string {
  return [
    ability.aether ? `−${ability.aether} Éther` : '',
    ability.health ? `−${ability.health} Santé` : '',
    ability.exhaustion ? `+${ability.exhaustion} Épuisement` : '',
  ].filter(Boolean).join(', ')
}

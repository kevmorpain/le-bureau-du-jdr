import type { KnMasteryEntry } from './amulets'
import type { KnCampTraitActivity } from './camp'
import { KN_BOUNDS } from './character'
import { knDiceLabel, knRollDice, type KnDiceRoll } from './dice'
import type { KnActiveSource, KnEffect, KnVitalKey } from './effects'
import type { KnMastery, KnMasteryAbility, KnSelfEffect } from './masteries'
import { knCustomEntryEffect } from './resolve'
import type { KnRng } from './run'
import type { KnStatus, KnUseLimit } from './status'
import { knGainTemporary, knHealWounds, knTemporaryOf } from './vitals'

export const knSustainedKey = (masteryKey: string, tier: number) => `${masteryKey}:${tier}`

export const knAbilityIsPassive = (ability: Pick<KnMasteryAbility, 'action'>) => ability.action.startsWith('Passif')

// Un passif n'a un bouton que s'il fait quelque chose de mesurable : un effet sur soi, ou un usage limité à marquer. Une
// aptitude qui change l'attaque se choisit dans l'attaque, sauf si elle est Maintenue : celle-là s'allume.
export const knAbilityIsUsable = (ability: Pick<KnMasteryAbility, 'action' | 'self' | 'limit'> & Partial<Pick<KnMasteryAbility, 'attack' | 'sustained'>>) =>
  (!knAbilityIsPassive(ability) || !!ability.self?.length || !!ability.limit) && (!ability.attack || !!ability.sustained)

export const knUseLimitLabel: Record<KnUseLimit, string> = {
  combat: 'une fois par combat',
  room: 'une fois par pièce',
  rest: 'une fois par repos',
  campRest: 'une fois par camp',
  domain: 'une fois par Domaine',
}

export const knIsUsedUp = (status: Pick<KnStatus, 'used'>, key: string) => !!status.used?.some(use => use.key === key)

export function knMarkUsed(status: KnStatus, key: string, limit: KnUseLimit): KnStatus {
  return knIsUsedUp(status, key) ? status : { ...status, used: [...(status.used ?? []), { key, limit }] }
}

export const knUnmarkUsed = (status: KnStatus, key: string): KnStatus =>
  status.used ? { ...status, used: status.used.filter(use => use.key !== key) } : status

export interface KnSelfState {
  toughness: number
  toughnessMax: number
  health: number
  healthMax: number
  sanity: number
  sanityMax: number
  aether: number
  aetherMax: number
  status: KnStatus
}

export interface KnSelfOutcome {
  effect: KnSelfEffect
  label: string
  roll: KnDiceRoll
}

const raise = (current: number, amount: number, max: number) => Math.max(current, Math.min(max, current + amount))

// Chaque effet jette ses dés. Un gain ne ramène pas sous sa valeur une jauge déjà au-dessus de son maximum.
export function knApplySelfEffects(
  effects: readonly KnSelfEffect[],
  state: KnSelfState,
  rng: KnRng = Math.random,
): { state: KnSelfState, outcomes: KnSelfOutcome[] } {
  let next = { ...state }
  const outcomes: KnSelfOutcome[] = []

  for (const effect of effects) {
    const roll = knRollDice(effect.dice, rng)
    outcomes.push({ effect, label: knDiceLabel(effect.dice), roll })

    if (effect.kind === 'woundsHeal') {
      const healed = knHealWounds({ ...next, temporaryToughness: knTemporaryOf(next.status, 'toughness') }, roll.total)
      next = { ...next, toughness: healed.toughness, health: healed.health }
    } else if (effect.kind === 'temporary') {
      next = { ...next, status: knGainTemporary(next.status, effect.vital, roll.total) }
    } else {
      next = recover(next, effect.vital, roll.total)
    }
  }

  return { state: next, outcomes }
}

function recover(state: KnSelfState, vital: KnVitalKey, amount: number): KnSelfState {
  if (vital === 'toughness') return { ...state, toughness: raise(state.toughness, amount, state.toughnessMax) }
  if (vital === 'health') return { ...state, health: raise(state.health, amount, state.healthMax) }
  if (vital === 'sanity') return { ...state, sanity: raise(state.sanity, amount, state.sanityMax) }
  return { ...state, aether: raise(state.aether, amount, state.aetherMax) }
}

// Ce que les Maîtrises ajoutent au camp : les activités de leurs traits, et le modificateur du test de Camp de leurs aptitudes
// débloquées.
export function knCampTraits(
  masteries: readonly KnMastery[],
  entries: readonly KnMasteryEntry[],
): { activities: KnCampTraitActivity[], checkBonus: number } {
  const activities: KnCampTraitActivity[] = []
  let checkBonus = 0

  for (const entry of entries) {
    const mastery = masteries.find(candidate => candidate.key === entry.key)
    if (!mastery) continue
    if (mastery.feature.campActivity) activities.push({ key: entry.key, activity: mastery.feature.campActivity })
    checkBonus += unlockedAbilities(mastery, entry).reduce((sum, ability) => sum + (ability.campCheck ?? 0), 0)
  }

  return { activities, checkBonus }
}

// Les effets sur soi des activités de trait réellement faites pendant ce camp.
export function knCampRecoverEffects(
  traitActivities: readonly KnCampTraitActivity[],
  counts: Readonly<Record<string, number>>,
): KnSelfEffect[] {
  return traitActivities.flatMap(({ key, activity }) => (counts[key] ?? 0) > 0 ? activity.recover ?? [] : [])
}

// Ce que chaque Maîtrise possédée donne quand un combat est remporté.
export function knCombatWonEffects(masteries: readonly KnMastery[], entries: readonly KnMasteryEntry[]): KnSelfEffect[] {
  return entries.flatMap(entry => masteries.find(mastery => mastery.key === entry.key)?.feature.onCombatWon ?? [])
}

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

// Une ressource qui ne couvre pas son coût bloque l'utilisation ; la payer jusqu'à 0 reste permis.
export function knAbilityBlockers(ability: KnMasteryAbility, purse: KnAbilityPurse): string[] {
  const blockers: string[] = []
  if (ability.aether !== null && purse.aetherCurrent < ability.aether) blockers.push('Éther insuffisant')
  if (ability.health && purse.healthCurrent < ability.health) blockers.push('Santé insuffisante')
  return blockers
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

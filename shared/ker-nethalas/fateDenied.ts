import { knRollDice } from './dice'
import type { KnDice } from './diceSchema'
import { knMasteryEntries, type KnAmulets, type KnMasteryEntry } from './amulets'
import type { KnMasteryPick } from './masteries'
import type { KnRng } from './run'

export const KN_FATE_DENIED = {
  sanity: { count: 2, sides: 6, bonus: 0 } satisfies KnDice,
  health: { count: 2, sides: 6, bonus: 0 } satisfies KnDice,
  abilitiesLost: 2,
  minimumPerMastery: 1,
} as const

export interface KnFateDeniedSheet {
  healthCurrent: number
  healthMax: number
  sanityCurrent: number
  sanityMax: number
  toughnessCurrent: number
  toughnessMax: number
  masteryPicks: KnMasteryPick[]
  amulets: KnAmulets
}

// Les Aptitudes qu'on peut encore perdre dans chaque Maîtrise : jamais moins d'une par Maîtrise.
export const knLossableAbilities = (entry: Pick<KnMasteryEntry, 'tiers'>): number =>
  Math.max(0, entry.tiers - KN_FATE_DENIED.minimumPerMastery)

// Combien d'Aptitudes il faut perdre : deux, ou ce qu'il en reste à perdre.
export function knAbilitiesToLose(entries: readonly KnMasteryEntry[]): number {
  return Math.min(KN_FATE_DENIED.abilitiesLost, entries.reduce((total, entry) => total + knLossableAbilities(entry), 0))
}

// `choice` : la Maîtrise dont on retire une Aptitude, une fois par Aptitude perdue.
export function knFateDeniedIssues(entries: readonly KnMasteryEntry[], choice: readonly string[]): string[] {
  const issues: string[] = []
  const expected = knAbilitiesToLose(entries)
  if (choice.length !== expected) issues.push(expected === 1 ? 'il faut choisir 1 Aptitude à perdre' : `il faut choisir ${expected} Aptitudes à perdre`)
  for (const entry of entries) {
    if (choice.filter(key => key === entry.key).length > knLossableAbilities(entry)) issues.push('une Maîtrise ne peut pas descendre sous une Aptitude')
  }
  if (choice.some(key => !entries.some(entry => entry.key === key))) issues.push('Maîtrise inconnue')
  return issues
}

export type KnFateDeniedResult = { patch: Partial<KnFateDeniedSheet>, lines: string[] } | { error: 'choice' }

// Règle optionnelle : au lieu de repartir avec un nouveau survivant, 2D6 Santé mentale, 2D6 Santé et toute la Robustesse, au prix
// de deux Aptitudes de Maîtrise (jamais en dessous d'une par Maîtrise). Chaque Aptitude perdue est la plus haute de sa Maîtrise.
export function knApplyFateDenied(sheet: KnFateDeniedSheet, choice: readonly string[], rng: KnRng = Math.random): KnFateDeniedResult {
  const entries = knMasteryEntries(sheet.masteryPicks, sheet.amulets)
  if (knFateDeniedIssues(entries, choice).length) return { error: 'choice' }

  const sanity = knRollDice(KN_FATE_DENIED.sanity, rng).total
  const health = knRollDice(KN_FATE_DENIED.health, rng).total
  const lost = (key: string) => choice.filter(other => other === key).length
  const amuletEntry = entries.find(entry => entry.amulet)

  return {
    patch: {
      sanityCurrent: Math.max(sheet.sanityCurrent, Math.min(sheet.sanityMax, sheet.sanityCurrent + sanity)),
      healthCurrent: Math.max(sheet.healthCurrent, Math.min(sheet.healthMax, sheet.healthCurrent + health)),
      toughnessCurrent: Math.max(sheet.toughnessCurrent, sheet.toughnessMax),
      masteryPicks: sheet.masteryPicks.map(pick => ({ ...pick, tiers: pick.tiers - lost(pick.key) })),
      amulets: amuletEntry ? { ...sheet.amulets, tiers: sheet.amulets.tiers - lost(amuletEntry.key) } : sheet.amulets,
    },
    lines: [`Santé mentale +${sanity}`, `Santé +${health}`, 'Robustesse au maximum', ...(choice.length ? [`${choice.length} Aptitude${choice.length > 1 ? 's' : ''} perdue${choice.length > 1 ? 's' : ''}`] : [])],
  }
}

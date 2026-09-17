import type { AbilityKey } from '~~/shared/rules/abilities'

/**
 * Bonus d'espèce au choix du joueur : à replier dans les scores envoyés à la création, aucun effet
 * ne les portant. Les bonus FIXES, eux, sont des effets `ability_increase` que la fiche ajoute live
 * aux scores stockés — les replier ici les compterait deux fois.
 */
export interface ChosenRaceBonusesInput {
  raceId: string | null
  isVariantHuman: boolean
  halfElfBonuses: AbilityKey[]
  variantHumanBonuses: AbilityKey[]
  fairyAsiBonuses: Partial<Record<AbilityKey, number>>
}

export function chosenRaceAbilityBonuses(input: ChosenRaceBonusesInput): Partial<Record<AbilityKey, number>> {
  const bonuses: Partial<Record<AbilityKey, number>> = {}
  const add = (ability: AbilityKey, amount: number) => {
    if (amount > 0) bonuses[ability] = (bonuses[ability] ?? 0) + amount
  }

  if (input.raceId === 'half-elf') {
    for (const ability of input.halfElfBonuses) add(ability, 1)
  }
  if (input.raceId === 'human' && input.isVariantHuman) {
    for (const ability of input.variantHumanBonuses) add(ability, 1)
  }
  if (input.raceId === 'fairy') {
    for (const [ability, amount] of Object.entries(input.fairyAsiBonuses) as [AbilityKey, number][]) {
      add(ability, amount ?? 0)
    }
  }

  return bonuses
}

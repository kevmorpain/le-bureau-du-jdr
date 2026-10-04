import type { DiceRoll } from '~/composables/useDiceRoller'
import { formatModifier } from './format'

// Les dés écartés (avantage, désavantage) apparaissent entre parenthèses ; le dé retenu n'a pas de marque.
export const rollDiceText = (roll: DiceRoll): string => {
  const dice = roll.keptIndex !== undefined
    ? roll.rolls.map((die, i) => (i === roll.keptIndex ? `${die}` : `(${die})`)).join(' ')
    : roll.rolls.length > 1 ? roll.rolls.join('+') : `${roll.natural}`
  return roll.modifier !== 0 ? `${dice} ${formatModifier(roll.modifier)}` : dice
}

export const rollNotes = (roll: DiceRoll): string[] => {
  const notes: string[] = []
  const advantage = roll.advantage ?? []
  const disadvantage = roll.disadvantage ?? []
  if (roll.mode === 'advantage') notes.push(`Avantage (${advantage.join(', ')})`)
  else if (roll.mode === 'disadvantage') notes.push(`Désavantage (${disadvantage.join(', ')})`)
  else if (advantage.length && disadvantage.length) notes.push('Avantage et désavantage s\'annulent')
  if (roll.rerolled) notes.push(`Relance : ${roll.rerolled.from} → ${roll.rerolled.to}`)
  if (roll.floored !== undefined) notes.push(`${roll.floored} compte pour ${roll.natural}`)
  if (roll.autoFail?.length) notes.push(`Échec automatique (${roll.autoFail.join(', ')})`)
  if (roll.critDamage) notes.push('Coup critique : dés doublés')
  return notes
}

export const rollText = (roll: DiceRoll): string =>
  [`${roll.label} : ${roll.result} (${rollDiceText(roll)})`, ...rollNotes(roll)].join(' — ')

import type { DamageTypeKey } from '~~/server/db/schema/effects'

export type DragonbornAncestry
  = | 'black' | 'blue' | 'brass' | 'bronze' | 'copper'
    | 'gold' | 'green' | 'red' | 'silver' | 'white'

export const dragonbornAncestryLabels: Record<DragonbornAncestry, string> = {
  black: 'Noir (Acide)',
  blue: 'Bleu (Foudre)',
  brass: 'Laiton (Feu)',
  bronze: 'Bronze (Foudre)',
  copper: 'Cuivre (Acide)',
  gold: 'Or (Feu)',
  green: 'Vert (Poison)',
  red: 'Rouge (Feu)',
  silver: 'Argent (Froid)',
  white: 'Blanc (Froid)',
}

export const dragonbornAncestryDamageType: Record<DragonbornAncestry, DamageTypeKey> = {
  black: 'acid',
  blue: 'lightning',
  brass: 'fire',
  bronze: 'lightning',
  copper: 'acid',
  gold: 'fire',
  green: 'poison',
  red: 'fire',
  silver: 'cold',
  white: 'cold',
}

export const allDragonbornAncestries = Object.keys(dragonbornAncestryLabels) as DragonbornAncestry[]

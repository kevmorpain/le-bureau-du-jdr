import type { AreaOfEffect, MaterialCost, SpellAttackType } from '~~/server/db/schema/spells'
import type { AbilityKey } from '~~/shared/rules/abilities'
import { formatModifier } from './format'

export type SpellFact = {
  key: string
  label: string
  hint?: string
  color: 'neutral' | 'warning' | 'primary'
}

type FactsSpell = {
  attackType?: SpellAttackType | null
  dc?: { ability: AbilityKey } | null
  areaOfEffect?: AreaOfEffect | null
  materialCost?: MaterialCost | null
  concentration: boolean
  ritual: boolean
}

type FactsContext = {
  abilityLabel: (ability: AbilityKey) => string
  saveDc?: number | null
  attackBonus?: number | null
}

const SHAPE_LABELS: Record<AreaOfEffect['shape'], string> = {
  cone: 'Cône',
  sphere: 'Sphère',
  cube: 'Cube',
  square: 'Carré',
  cylinder: 'Cylindre',
  emanation: 'Émanation',
}

const meters = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} m`

export const areaLabel = ({ shape, size, height }: AreaOfEffect): string => {
  const dimension = shape === 'cone'
    ? meters(size)
    : shape === 'cube' || shape === 'square'
      ? `${meters(size)} d'arête`
      : `${meters(size)} de rayon`
  return `${SHAPE_LABELS[shape]} de ${dimension}${height === undefined ? '' : `, ${meters(height)} de haut`}`
}

const costLabel = ({ amount, unit, consumed }: MaterialCost): string => {
  const parts = ['Composante']
  if (amount !== undefined) parts.push(`${new Intl.NumberFormat('fr-FR').format(amount)} ${unit} min.`)
  if (consumed) parts.push('consommée')
  return parts.join(' · ')
}

// Règles de la magie : un focaliseur d'incantation ne remplace pas une composante chiffrée, et une composante
// consommée doit être fournie à chaque lancement ; l'attaque à distance a le désavantage à 1,50 m d'une créature hostile.
const COST_HINT = 'Ni un focaliseur d\'incantation ni une sacoche à composantes ne la remplace.'
const RANGED_HINT = 'Désavantage au jet d\'attaque si une créature hostile qui vous voit et n\'est pas incapable d\'agir se trouve à 1,50 m ou moins.'

export function spellFacts(spell: FactsSpell, { abilityLabel, saveDc, attackBonus }: FactsContext): SpellFact[] {
  const facts: SpellFact[] = []

  if (spell.attackType) {
    const bonus = attackBonus == null ? '' : ` (${formatModifier(attackBonus)})`
    facts.push(spell.attackType === 'ranged'
      ? { key: 'attack', label: `Attaque de sort à distance${bonus}`, hint: RANGED_HINT, color: 'warning' }
      : { key: 'attack', label: `Attaque de sort au corps à corps${bonus}`, color: 'warning' })
  }
  if (spell.dc) {
    const dc = saveDc == null ? '' : `DD ${saveDc} · `
    facts.push({ key: 'dc', label: `${dc}JdS de ${abilityLabel(spell.dc.ability)}`, color: 'warning' })
  }
  if (spell.areaOfEffect) facts.push({ key: 'area', label: areaLabel(spell.areaOfEffect), color: 'neutral' })
  if (spell.materialCost) facts.push({ key: 'cost', label: costLabel(spell.materialCost), hint: COST_HINT, color: 'primary' })
  if (spell.concentration) facts.push({ key: 'concentration', label: 'Concentration', color: 'neutral' })
  if (spell.ritual) facts.push({ key: 'ritual', label: 'Rituel', color: 'neutral' })

  return facts
}

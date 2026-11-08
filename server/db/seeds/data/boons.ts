import type { AbilityScoreKey, Effect } from '../../schema/effects'
import type { Source } from '~~/shared/rules/source'

// Faveurs permanentes : l'effet définitif d'un objet consommé (manuels et tomes). Elles se portent comme un don, pas comme un objet
// équipé, et restent hors des choix de dons (ASI, builder, montée de niveau). Données sans import de valeur : le script qui écrit la
// migration 0160 les charge telles quelles.

export interface BoonSeed {
  name: string
  description: string
  source?: Source
  effects: Effect[]
}

interface BookDef {
  name: string
  ability: AbilityScoreKey
  label: string
}

const BOOKS: BookDef[] = [
  { name: 'Manuel de vitalité', ability: 'con', label: 'Constitution' },
  { name: 'Manuel d\'exercices physiques', ability: 'str', label: 'Force' },
  { name: 'Manuel de vivacité', ability: 'dex', label: 'Dextérité' },
  { name: 'Traité de perspicacité', ability: 'int', label: 'Intelligence' },
  { name: 'Traité d\'autorité et d\'influence', ability: 'cha', label: 'Charisme' },
  { name: 'Traité de compréhension', ability: 'wis', label: 'Sagesse' },
]

export const boonsData: BoonSeed[] = BOOKS.map(({ name, ability, label }) => ({
  name,
  description: `Votre ${label} augmente de 2, ainsi que son maximum. Il a fallu 48 heures d'étude, réparties sur 6 jours ou moins, pour en tirer cet effet ; le livre a ensuite perdu sa magie et ne la retrouvera que dans un siècle.`,
  effects: [
    { type: 'ability_increase', value: { ability, amount: 2 } },
    { type: 'ability_max_increase', value: { ability, amount: 2 } },
  ],
}))

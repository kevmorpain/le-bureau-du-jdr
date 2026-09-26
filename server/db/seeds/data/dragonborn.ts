import { CreatureSize } from '../../schema/character_species'
import type { LineageData, LineageSpeciesData, SpeciesTraitData } from '../lib/seedLineages'
import type { AbilityScoreKey, DamageTypeKey, Effect } from '../../schema/effects'

/**
 * Cas PARTICULIER : en 2014 l'ascendance draconique était une COLONNE
 * (`character_sheets.dragonbornAncestry`) résolue à l'affichage ; elle est matérialisée ici en 10
 * lignées portant chacune son type de dégâts concret. Conséquence voulue : l'ascendance est FIXÉE à la
 * création et le sélecteur de la fiche se masque de lui-même.
 */

const DRAGONS = [
  { key: 'black', name: 'Dragon noir', damage: 'acid', area: 'line', save: 'dex' },
  { key: 'blue', name: 'Dragon bleu', damage: 'lightning', area: 'line', save: 'dex' },
  { key: 'brass', name: 'Dragon d\'airain', damage: 'fire', area: 'line', save: 'dex' },
  { key: 'bronze', name: 'Dragon de bronze', damage: 'lightning', area: 'line', save: 'dex' },
  { key: 'copper', name: 'Dragon de cuivre', damage: 'acid', area: 'line', save: 'dex' },
  { key: 'gold', name: 'Dragon d\'or', damage: 'fire', area: 'cone', save: 'dex' },
  { key: 'green', name: 'Dragon vert', damage: 'poison', area: 'cone', save: 'con' },
  { key: 'red', name: 'Dragon rouge', damage: 'fire', area: 'cone', save: 'dex' },
  { key: 'silver', name: 'Dragon d\'argent', damage: 'cold', area: 'cone', save: 'con' },
  { key: 'white', name: 'Dragon blanc', damage: 'cold', area: 'cone', save: 'con' },
] as const

/** Clé d'ascendance (colonne legacy) → nom de lignée. */
export const DRAGONBORN_LINEAGE_BY_ANCESTRY: Record<string, string> = Object.fromEntries(
  DRAGONS.map(d => [d.key, d.name]),
)

function breathEffect(damage: DamageTypeKey, area: 'line' | 'cone', save: AbilityScoreKey): Effect {
  return {
    type: 'action',
    value: {
      type: 'breathe_weapon',
      countPerRest: 1,
      damage: {
        damageType: damage,
        areaOfEffect: area,
        damageAtCharacterLevel: { 1: '2d6', 6: '3d6', 11: '4d6', 16: '5d6' },
        savingThrowAbility: save,
        saveDcBase: 8,
        saveDcModifiers: ['con', 'proficiency'],
        halfOnSave: true,
      },
    },
  }
}

const baseTraits: SpeciesTraitData[] = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur de Force augmente de 2 et votre valeur de Charisme augmente de 1.`,
    effects: [
      { type: 'ability_increase', value: { ability: 'str', amount: 2 } },
      { type: 'ability_increase', value: { ability: 'cha', amount: 1 } },
    ],
  },
  {
    name: 'Vitesse',
    description: `Votre vitesse de base au sol est de 9 m.`,
    effects: [{ type: 'walking_speed', value: 9 }],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et le draconique.`,
    effects: [
      { type: 'language_proficiency', value: 'draconic' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

const lineages = DRAGONS.map((d): LineageData => ({
  name: d.name,
  description: `Votre ascendance remonte à un ${d.name.toLowerCase()} : votre souffle et votre résistance en découlent.`,
  traits: [
    {
      name: 'Résistance aux dégâts',
      description: `Vous bénéficiez de la résistance au type de dégâts associé à votre ascendance draconique.`,
      effects: [{ type: 'damage_resistance', value: { damageType: d.damage } }],
    },
    {
      name: 'Souffle',
      description: `Vous pouvez consacrer votre action à exhaler une vague d'énergie destructrice. Votre ascendance draconique détermine la forme et le type de dégâts. Chaque créature dans la zone d'effet effectue un jet de sauvegarde (DD 8 + votre modificateur de Constitution + votre bonus de maîtrise). Une créature subit 2d6 dégâts en cas d'échec, la moitié en cas de réussite ; les dégâts passent à 3d6 au niveau 6, 4d6 au niveau 11, 5d6 au niveau 16. Une fois utilisé, vous devez terminer un repos court ou long pour y recourir de nouveau.`,
      effects: [breathEffect(d.damage, d.area, d.save)],
    },
  ],
}))

export const dragonborn: LineageSpeciesData = {
  name: 'Drakéide',
  ruleset: '5',
  size: CreatureSize.Medium,
  speed: 9,
  baseTraits,
  lineageChoice: {
    name: 'Ascendance draconique',
    description: `Vous avez des ancêtres draconiques. Choisissez un type de dragon : ce choix détermine votre souffle et votre résistance aux dégâts.`,
  },
  lineages,
}

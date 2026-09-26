import { CreatureSize } from '../../schema/character_species'
import type { LineageData, LineageSpeciesData, SpeciesTraitData } from '../lib/seedLineages'

// ⚠️ Effets copiés à l'identique de l'ancienne espèce (équivalence D12) : base = traits communs à tout
// héritage infernal, lignée Asmodée = ce qui lui est propre. Les 8 autres bloodlines (MToF) restent à ajouter.

const baseTraits: SpeciesTraitData[] = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur de Charisme augmente de 2.`,
    effects: [{ type: 'ability_increase', value: { ability: 'cha', amount: 2 } }],
  },
  {
    name: 'Vitesse',
    description: `Votre vitesse de base au sol est de 9 m.`,
    effects: [{ type: 'walking_speed', value: 9 }],
  },
  {
    name: 'Vision dans le noir',
    description: `Grâce à votre ascendance infernale, vous possédez une excellente vision dans le noir et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
    effects: [{ type: 'darkvision', value: { range: 18 } }],
  },
  {
    name: 'Résistance infernale',
    description: `Vous bénéficiez de la résistance aux dégâts de feu.`,
    effects: [{ type: 'damage_resistance', value: { damageType: 'fire' } }],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et l'infernal.`,
    effects: [
      { type: 'language_proficiency', value: 'infernal' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

const asmodeusLineage: LineageData = {
  name: 'Asmodée',
  description: `Héritiers du sang d'Asmodée, seigneur des Neuf Enfers, ces tieffelins portent une magie infernale tournée vers le feu et les ténèbres.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur d'Intelligence augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'int', amount: 1 } }],
    },
    {
      name: 'Ascendance infernale',
      description: `Vous connaissez le sort mineur Thaumaturgie. Lorsque vous atteignez le niveau 3, vous pouvez lancer une fois le sort Représailles infernales en tant que sort de 2e niveau par l'intermédiaire de ce trait et vous récupérez cette faculté en terminant un repos long. Lorsque vous atteignez le niveau 5, vous pouvez lancer le sort Ténèbres une fois par l'intermédiaire de ce trait et récupérez cette faculté en terminant un repos long. Le Charisme est la caractéristique d'incantation pour ces sorts.`,
      effects: [
        { type: 'spell_grant', value: { level: 0, spellcastingAbility: 'cha', spellName: 'thaumaturgy', countPerLongRest: Infinity } },
        { type: 'spell_grant', value: { level: 2, spellcastingAbility: 'cha', spellName: 'hellish_rebuke', countPerLongRest: 1, unlockLevel: 3 } },
        { type: 'spell_grant', value: { level: 2, spellcastingAbility: 'cha', spellName: 'darkness', countPerLongRest: 1, unlockLevel: 5 } },
      ],
    },
  ],
}

export const tiefling: LineageSpeciesData = {
  name: 'Tieffelin',
  ruleset: '5',
  size: CreatureSize.Medium,
  speed: 9,
  baseTraits,
  lineageChoice: {
    name: 'Héritage infernal',
    description: `Vous descendez d'une lignée infernale qui vous confère une magie particulière. Dans les règles de base, cette lignée est celle d'Asmodée.`,
  },
  lineages: [asmodeusLineage],
}

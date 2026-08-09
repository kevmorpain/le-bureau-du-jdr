import { CreatureSize } from '../../schema/character_species'
import type { LineageSpeciesData } from '../lib/seedLineages'

/**
 * Nain 2014 restructuré en **base + lignées** (chantier lignée, D17 — rollout lot 6). Remplace à
 * terme les deux espèces séparées `hillDwarf`/`mountainDwarf` de `character_species.ts` : la base
 * porte les traits communs, chaque lignée porte SES traits propres (le +1/+2 de carac. spécifique,
 * et l'exclusif : Ténacité naine pour les collines, armures pour les montagnes).
 *
 * ⚠️ Effets **copiés à l'identique** des anciennes données → l'équivalence (D12) tient : base ⊕
 * lignée dérive exactement les mêmes effets que l'ancienne espèce. Nommage des lignées == anciennes
 * espèces (« Nain des collines/montagnes ») → migration des fiches sans alias, vitesse commune (7,5)
 * → aucun speedOverride.
 */

// ─── Traits COMMUNS aux deux lignées (base) ──────────────────────────────────────────────
const baseTraits = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur de Constitution augmente de 2.`,
    effects: [{ type: 'ability_increase', value: { ability: 'con', amount: 2 } }],
  },
  {
    name: 'Vitesse',
    description: `Votre vitesse de base au sol est de 7,50 m. Votre vitesse n'est pas réduite par le port d'une armure lourde.`,
    effects: [
      { type: 'walking_speed', value: 7.5 },
      { type: 'equipment_penalty', value: { penalty: 'speed', armor_type: 'heavy', modifier: 'none', override: true } },
    ],
  },
  {
    name: 'Vision dans le noir',
    description: `Habitué à vivre sous terre, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
    effects: [{ type: 'darkvision', value: { range: 18 } }],
  },
  {
    name: 'Résistance naine',
    description: `Vous êtes avantagé aux jets de sauvegarde contre le poison et bénéficiez de la résistance aux dégâts de poison.`,
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'poison' } },
      { type: 'damage_resistance', value: { damageType: 'poison' } },
    ],
  },
  {
    name: 'Entraînement aux armes naines',
    description: `Vous avez la maîtrise de la hache d'armes, de la hachette, du marteau léger et du marteau de guerre.`,
    effects: [
      { type: 'weapon_proficiency', value: 'Hache d\'armes' },
      { type: 'weapon_proficiency', value: 'Hachette' },
      { type: 'weapon_proficiency', value: 'Marteau léger' },
      { type: 'weapon_proficiency', value: 'Marteau de guerre' },
    ],
  },
  {
    name: `Maîtrise des outils`,
    description: `Vous recevez la maîtrise des outils d'artisan de votre choix parmi : outils de forgeron, matériel de brasseur, outils de maçon.`,
    effects: [{ type: 'tool_proficiency_choice', value: ['artisan_tools', 'brewer_tools', 'mason_tools'] }],
  },
  {
    name: 'Connaissance de la pierre',
    description: `Chaque fois que vous effectuez un test d'Intelligence (Histoire) lié aux origines d'un travail de maçonnerie, on considère que vous avez la maîtrise de la compétence Histoire et vous appliquez le double de votre bonus de maîtrise au test, au lieu du simple bonus.`,
    effects: [{ type: 'skill_bonus', value: { skill: 'history', bonusType: 'proficiency', multiplier: 2, condition: 'masonry_origins' } }],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et le nain. Le nain est une langue gutturale et percussive, ce qui se retrouve dans l'accent des nains, quel que soit l'idiome parlé.`,
    effects: [
      { type: 'language_proficiency', value: 'dwarvish' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

// ─── Traits PROPRES à chaque lignée ──────────────────────────────────────────────────────
const hillDwarfLineage = {
  name: 'Nain des collines',
  description: `Sagaces et endurants, les nains des collines ont des sens affûtés, une intuition profonde et une résistance remarquable aux blessures.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Sagesse augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'wis', amount: 1 } }],
    },
    {
      name: 'Ténacité naine',
      description: `Votre maximum de points de vie augmente de 1, et il augmente encore de 1 chaque fois que vous gagnez un niveau.`,
      effects: [],
    },
  ],
}

const mountainDwarfLineage = {
  name: 'Nain des montagnes',
  description: `Robustes et aguerris, les nains des montagnes sont accoutumés à une vie rude en altitude et à manier armes et armures.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Force augmente de 2.`,
      effects: [{ type: 'ability_increase', value: { ability: 'str', amount: 2 } }],
    },
    {
      name: 'Formation au port des armures naines',
      description: `Vous avez la maîtrise des armures légères et intermédiaires.`,
      effects: [
        { type: 'proficiency', value: 'light_armor' },
        { type: 'proficiency', value: 'medium_armor' },
      ],
    },
  ],
}

export const dwarf: LineageSpeciesData = {
  name: 'Nain',
  ruleset: '5',
  size: CreatureSize.Medium,
  speed: 7.5,
  baseTraits,
  lineageChoice: {
    name: 'Lignage nain',
    description: `Vous faites partie d'un lignage nain qui vous confère des traits particuliers. Choisissez Nain des collines ou Nain des montagnes.`,
  },
  lineages: [hillDwarfLineage, mountainDwarfLineage],
}

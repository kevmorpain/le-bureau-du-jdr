import { CreatureSize } from '../../schema/character_species'
import type { LineageSpeciesData } from '../lib/seedLineages'

/**
 * Gnome 2014 restructuré en **base + lignées** (chantier lignée, D17 — rollout lot 6). Remplace à
 * terme `rockGnome`/`forestGnome` de `character_species.ts` : base = traits communs, lignées = le
 * +1 propre + les exclusifs (Ingénierie/Bricoleur pour les roches, Illusionniste-né/Communication
 * pour les forêts).
 *
 * ⚠️ Effets **copiés à l'identique** → équivalence (D12). Noms de lignée == anciennes espèces
 * (« Gnome des roches/forêts ») → migration sans alias ; vitesse commune (7,5) → pas de
 * speedOverride.
 */

// ─── Traits COMMUNS aux deux lignées (base) ──────────────────────────────────────────────
const baseTraits = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur d'Intelligence augmente de 2.`,
    effects: [{ type: 'ability_increase', value: { ability: 'int', amount: 2 } }],
  },
  {
    name: 'Vitesse',
    description: `Votre vitesse de base au sol est de 7,50 m.`,
    effects: [{ type: 'walking_speed', value: 7.5 }],
  },
  {
    name: 'Vision dans le noir',
    description: `Habitué à vivre sous terre, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible. Vous ne discernez pas les couleurs dans les ténèbres, mais percevez des nuances de gris.`,
    effects: [{ type: 'darkvision', value: { range: 18 } }],
  },
  {
    name: 'Ruse gnome',
    description: `Vous êtes avantagé à tous les jets de sauvegarde d'Intelligence, de Sagesse et de Charisme contre la magie.`,
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'int', condition: 'magic' } },
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'wis', condition: 'magic' } },
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'cha', condition: 'magic' } },
    ],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et le gnome. La langue gnome, qui recourt à l'alphabet nain, est réputée pour ses traits techniques et ses encyclopédies consacrées au monde naturel.`,
    effects: [
      { type: 'language_proficiency', value: 'gnomish' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

// ─── Traits PROPRES à chaque lignée ──────────────────────────────────────────────────────
const rockGnomeLineage = {
  name: 'Gnome des roches',
  description: `Ingénieux et curieux, les gnomes des roches ont un don naturel pour la mécanique et l'invention.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Constitution augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'con', amount: 1 } }],
    },
    {
      name: 'Connaissance en ingénierie',
      description: `Chaque fois que vous effectuez un test d'Intelligence (Histoire) relatif aux objets magiques, alchimiques ou technologiques, vous appliquez le double de votre bonus de maîtrise au test, au lieu du simple bonus.`,
      effects: [{ type: 'skill_bonus', value: { skill: 'history', bonusType: 'proficiency', multiplier: 2, condition: 'magical_alchemical_technological_origins' } }],
    },
    {
      name: 'Bricoleur',
      description: `Vous avez la maîtrise des outils d'artisan (outils de bricoleur). Au moyen de ces outils et pour peu que vous passiez 1 heure et dépensiez 10 po de matériaux, vous construisez un mécanisme de taille TP (CA 5, 1 pv). Vous pouvez avoir jusqu'à trois mécanismes de ce type fonctionnant en même temps.`,
      effects: [],
    },
  ],
}

const forestGnomeLineage = {
  name: 'Gnome des forêts',
  description: `Furtifs et proches de la nature, les gnomes des forêts ont un talent inné pour l'illusion et un lien avec les petits animaux.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Dextérité augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'dex', amount: 1 } }],
    },
    {
      name: 'Illusionniste-né',
      description: `Vous connaissez le sort mineur Illusion mineure. L'Intelligence est votre caractéristique d'incantation pour ce sort.`,
      effects: [],
    },
    {
      name: 'Communication avec les petits animaux',
      description: `Vous pouvez communiquer de façon rudimentaire avec les bêtes de petite taille. Vous avez l'avantage aux tests de Charisme effectués pour influencer leur comportement.`,
      effects: [],
    },
  ],
}

export const gnome: LineageSpeciesData = {
  name: 'Gnome',
  ruleset: '5',
  size: CreatureSize.Small,
  speed: 7.5,
  baseTraits,
  lineageChoice: {
    name: 'Lignage gnome',
    description: `Vous faites partie d'un lignage gnome qui vous confère des traits particuliers. Choisissez Gnome des roches ou Gnome des forêts.`,
  },
  lineages: [rockGnomeLineage, forestGnomeLineage],
}

import { CreatureSize } from '../../schema/character_species'
import type { LineageSpeciesData } from '../lib/seedLineages'

/**
 * Halfelin 2014 restructuré en **base + lignées** (chantier lignée, D17 — rollout lot 6). Remplace
 * à terme `lightfootHalfling`/`stoutHalfling` de `character_species.ts` : base = traits communs,
 * lignées = le +1 propre + l'exclusif (Discrétion naturelle pour le pied-léger, Résistance des
 * robustes pour le robuste).
 *
 * ⚠️ Effets **copiés à l'identique** → équivalence (D12). Noms de lignée == anciennes espèces
 * (« Halfelin pied-léger/robuste ») → migration sans alias ; vitesse commune (7,5) → pas de
 * speedOverride.
 */

// ─── Traits COMMUNS aux deux lignées (base) ──────────────────────────────────────────────
const baseTraits = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur de Dextérité augmente de 2.`,
    effects: [{ type: 'ability_increase', value: { ability: 'dex', amount: 2 } }],
  },
  {
    name: 'Vitesse',
    description: `Votre vitesse de base au sol est de 7,50 m.`,
    effects: [{ type: 'walking_speed', value: 7.5 }],
  },
  {
    name: 'Chanceux',
    description: `Lorsque vous obtenez un 1 sur le d20 d'un jet d'attaque, d'un test de caractéristique ou d'un jet de sauvegarde, vous pouvez relancer ce dé, auquel cas c'est le second résultat qui s'applique.`,
    effects: [{ type: 'reroll', value: { rollType: 'd20', trigger: 1 } }],
  },
  {
    name: 'Brave',
    description: `Vous êtes avantagé aux jets de sauvegarde contre l'état effrayé.`,
    effects: [{ type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'frightened' } }],
  },
  {
    name: 'Agilité halfeline',
    description: `Vous pouvez vous déplacer à travers l'espace de toute créature dont la catégorie de taille est supérieure à la vôtre.`,
    effects: [],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et le halfelin. Cette langue n'a rien de secret, mais les halfelins n'aiment guère la partager. Leur tradition orale s'avère très riche.`,
    effects: [
      { type: 'language_proficiency', value: 'halfling' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

// ─── Traits PROPRES à chaque lignée ──────────────────────────────────────────────────────
const lightfootHalflingLineage = {
  name: 'Halfelin pied-léger',
  description: `Discrets et affables, les halfelins pied-léger savent se fondre dans la foule et passer inaperçus.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Charisme augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'cha', amount: 1 } }],
    },
    {
      name: 'Discrétion naturelle',
      description: `Il vous suffit d'être derrière une créature dont la catégorie de taille est d'au moins un cran supérieure à la vôtre pour pouvoir tenter de vous cacher.`,
      effects: [],
    },
  ],
}

const stoutHalflingLineage = {
  name: 'Halfelin robuste',
  description: `Endurants et vigoureux, les halfelins robustes ont, dit-on, du sang nain et résistent au poison.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Constitution augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'con', amount: 1 } }],
    },
    {
      name: 'Résistance des robustes',
      description: `Vous êtes avantagé aux jets de sauvegarde contre le poison et bénéficiez de la résistance aux dégâts de poison.`,
      effects: [
        { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'poison' } },
        { type: 'damage_resistance', value: { damageType: 'poison' } },
      ],
    },
  ],
}

export const halfling: LineageSpeciesData = {
  name: 'Halfelin',
  ruleset: '5',
  size: CreatureSize.Small,
  speed: 7.5,
  baseTraits,
  lineageChoice: {
    name: 'Lignage halfelin',
    description: `Vous faites partie d'un lignage halfelin qui vous confère des traits particuliers. Choisissez Halfelin pied-léger ou Halfelin robuste.`,
  },
  lineages: [lightfootHalflingLineage, stoutHalflingLineage],
}

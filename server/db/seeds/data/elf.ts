import { CreatureSize } from '../../schema/character_species'

/**
 * Elfe 2014 restructuré en **base + lignées** (chantier lignée, D17). Remplace à terme les
 * trois espèces séparées `highElf`/`woodElf`/`drow` de `character_species.ts` : la base porte
 * les traits communs aux trois, chaque lignée porte SES traits propres (dont le +1 de carac.,
 * la vitesse, la vision et les armes — qui DIFFÈRENT d'une lignée à l'autre, d'où leur place
 * sur la lignée et non sur la base : l'équivalence est alors une union `base ⊕ lignée`, sans
 * effet qui en écrase un autre).
 *
 * ⚠️ Effets **copiés à l'identique** des anciennes données (`highElf`/`woodElf`/`drow`) — c'est
 * ce qui garantit que le test d'équivalence (D12) tient : un perso « Elfe base + lignée X »
 * dérive exactement les mêmes effets que l'ancienne espèce X.
 *
 * SEED SEUL, ruleset `'5'` (2014). Additif : les anciennes espèces ne sont PAS supprimées ici
 * (migration des fiches = lot suivant). Les traits « sans effet » (Transe, Cachette naturelle,
 * Sensibilité au soleil) restent descriptifs, comme en 2014.
 */

// ─── Traits COMMUNS aux trois lignées (base) ─────────────────────────────────────────────
const baseTraits = [
  {
    name: 'Augmentation de caractéristiques',
    description: `Votre valeur de Dextérité augmente de 2.`,
    effects: [
      { type: 'ability_increase', value: { ability: 'dex', amount: 2 } },
    ],
  },
  {
    name: 'Sens aiguisés',
    description: `Vous avez la maîtrise de la compétence Perception.`,
    effects: [{ type: 'skill_proficiency', value: { skill: 'perception' } }],
  },
  {
    name: 'Ascendance féerique',
    description: `Vous êtes avantagé aux jets de sauvegarde contre l'état charmé, et la magie ne peut pas vous endormir.`,
    effects: [
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'charmed' } },
      { type: 'immunity', value: 'sleep_magic' },
    ],
  },
  {
    name: 'Transe',
    description: `Les elfes n'ont pas besoin de dormir. Ils méditent profondément pendant 4 heures par jour, en restant semi-conscients. Après une telle période de repos, vous bénéficiez des mêmes avantages qu'un humain qui a dormi 8 heures.`,
    effects: [],
  },
  {
    name: 'Langues',
    description: `Vous parlez, lisez et écrivez le commun et l'elfique.`,
    effects: [
      { type: 'language_proficiency', value: 'elvish' },
      { type: 'language_proficiency', value: 'common' },
    ],
  },
]

// ─── Traits PROPRES à chaque lignée ──────────────────────────────────────────────────────
const highElfLineage = {
  name: 'Haut-elfe',
  description: `Raffinés et lettrés, les hauts-elfes ont l'esprit vif et maîtrisent les rudiments de la magie.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur d'Intelligence augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'int', amount: 1 } }],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [{ type: 'walking_speed', value: 9 }],
    },
    {
      name: 'Vision dans le noir',
      description: `Habitué aux forêts vespérales et au ciel nocturne, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible.`,
      effects: [{ type: 'darkvision', value: { range: 18 } }],
    },
    {
      name: 'Entraînement aux armes elfiques',
      description: `Vous avez la maîtrise de l'épée longue, de l'épée courte, de l'arc court et de l'arc long.`,
      effects: [
        { type: 'weapon_proficiency', value: 'Épée longue' },
        { type: 'weapon_proficiency', value: 'Épée courte' },
        { type: 'weapon_proficiency', value: 'Arc court' },
        { type: 'weapon_proficiency', value: 'Arc long' },
      ],
    },
    {
      name: 'Sort mineur',
      description: `Vous connaissez un sort mineur de la liste de sorts du magicien (au choix). L'Intelligence est la caractéristique d'incantation correspondante.`,
      effects: [{ type: 'spell_choice', value: { class: 'wizard', level: 0, spellcastingAbility: 'int', count: 1 } }],
    },
    {
      name: 'Langue supplémentaire',
      description: `Vous parlez, lisez et écrivez une langue supplémentaire de votre choix.`,
      effects: [{ type: 'language_proficiency_choice', value: { count: 1 } }],
    },
  ],
}

const woodElfLineage = {
  name: 'Elfe des bois',
  description: `Furtifs et endurants, les elfes des bois vivent en harmonie avec la nature sauvage.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Sagesse augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'wis', amount: 1 } }],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 10,50 m.`,
      effects: [{ type: 'walking_speed', value: 10.5 }],
    },
    {
      name: 'Vision dans le noir',
      description: `Habitué aux forêts vespérales et au ciel nocturne, vous disposez d'une vision supérieure dans l'obscurité et la pénombre. Dans un rayon de 18 m, vous voyez en conditions de lumière faible comme si la lumière était vive, et dans les ténèbres comme sous une lumière faible.`,
      effects: [{ type: 'darkvision', value: { range: 18 } }],
    },
    {
      name: 'Entraînement aux armes elfiques',
      description: `Vous avez la maîtrise de l'épée longue, de l'épée courte, de l'arc court et de l'arc long.`,
      effects: [
        { type: 'weapon_proficiency', value: 'Épée longue' },
        { type: 'weapon_proficiency', value: 'Épée courte' },
        { type: 'weapon_proficiency', value: 'Arc court' },
        { type: 'weapon_proficiency', value: 'Arc long' },
      ],
    },
    {
      name: 'Cachette naturelle',
      description: `Vous pouvez essayer de vous cacher même lorsque vous n'êtes que légèrement obscurci par du feuillage, une forte pluie, de la neige qui tombe, de la brume ou d'autres phénomènes naturels.`,
      effects: [],
    },
  ],
}

const drowLineage = {
  // Nom propre (2024) ; l'ancienne espèce séparée 2014 s'appelait « Elfe noir » (character_species.ts,
  // intacte). Le renommage de la ligne déjà seedée en prod passe par la migration 0086 ; le matching
  // ancien-nom → lignée pour la migration des fiches est géré par un alias dans migrateLineageSheets.
  name: 'Drow',
  description: `Nés dans les Outreterre, les drows portent la magie des profondeurs et une vision perçante dans les ténèbres.`,
  traits: [
    {
      name: 'Augmentation de caractéristiques',
      description: `Votre valeur de Charisme augmente de 1.`,
      effects: [{ type: 'ability_increase', value: { ability: 'cha', amount: 1 } }],
    },
    {
      name: 'Vitesse',
      description: `Votre vitesse de base au sol est de 9 m.`,
      effects: [{ type: 'walking_speed', value: 9 }],
    },
    {
      name: 'Vision dans le noir supérieure',
      description: `Votre vision dans le noir a un rayon de 36 m, au lieu des 18 m habituels.`,
      effects: [{ type: 'darkvision', value: { range: 36 } }],
    },
    {
      name: 'Sensibilité au soleil',
      description: `Vous êtes désavantagé aux jets d'attaque et aux tests de Sagesse (Perception) reposant sur la vue quand vous-même, votre cible ou ce que vous tentez de percevoir vous trouvez en pleine lumière du soleil.`,
      effects: [],
    },
    {
      name: 'Magie drow',
      description: `Vous connaissez le sort mineur Lumières dansantes. Au niveau 3, vous pouvez lancer Feu féerique une fois par repos long ; au niveau 5, Ténèbres une fois par repos long. Le Charisme est la caractéristique d'incantation pour ces sorts.`,
      effects: [
        { type: 'spell_grant', value: { level: 0, spellcastingAbility: 'cha', spellName: 'dancing_lights', countPerLongRest: Infinity } },
        { type: 'spell_grant', value: { level: 1, spellcastingAbility: 'cha', spellName: 'faerie_fire', countPerLongRest: 1, unlockLevel: 3 } },
        { type: 'spell_grant', value: { level: 2, spellcastingAbility: 'cha', spellName: 'darkness', countPerLongRest: 1, unlockLevel: 5 } },
      ],
    },
    {
      name: 'Entraînement aux armes drows',
      description: `Vous avez la maîtrise de la rapière, de l'épée courte et de l'arbalète de poing.`,
      effects: [
        { type: 'weapon_proficiency', value: 'Rapière' },
        { type: 'weapon_proficiency', value: 'Épée courte' },
        { type: 'weapon_proficiency', value: 'Arbalète de poing' },
      ],
    },
  ],
}

/**
 * Elfe 2014 (ruleset `'5'`) = base + le point de choix « Lignage elfique » (une `progression`
 * `kind:'lineage'`) + les 3 lignées. Le seed (lot suivant) posera la base species, ses
 * `species_features`, la feature de choix portant la progression, et chaque lignée comme
 * `species_lineages` avec ses `lineage_feature`.
 */
export const elf = {
  name: 'Elfe',
  ruleset: '5' as const,
  size: CreatureSize.Medium,
  speed: 9,
  baseTraits,
  lineageChoice: {
    name: 'Lignage elfique',
    description: `Vous faites partie d'un lignage elfique qui vous confère des traits particuliers. Choisissez Haut-elfe, Elfe des bois ou Drow.`,
  },
  lineages: [highElfLineage, woodElfLineage, drowLineage],
}

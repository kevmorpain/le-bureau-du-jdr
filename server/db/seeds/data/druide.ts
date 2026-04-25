import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const druideName = 'Druide'

export const druideFeatures: FeatureDef[] = [
  {
    name: 'Druidique',
    description: `Vous connaissez le druidique, le langage secret des druides. Vous pouvez parler cette langue et l'utiliser pour laisser des messages cachés. Vous et quiconque connaît ce langage remarquez automatiquement un tel message. Les autres repèrent la présence d'un message s'ils réussissent un test de Sagesse (Perception) DD 15, mais ne peuvent pas le déchiffrer sans magie.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Incantation',
    description: `La Sagesse est votre caractéristique d'incantation pour vos sorts de druide.

Vous préparez vos sorts : nombre égal à votre modificateur de Sagesse + votre niveau de druide (minimum 1).

DD de sauvegarde = 8 + bonus de maîtrise + modificateur de Sagesse.
Modificateur d'attaque de sort = bonus de maîtrise + modificateur de Sagesse.

Vous pouvez lancer un sort de druide comme rituel s'il a l'étiquette rituel et est préparé. Vous pouvez utiliser un focaliseur druidique (gui, houx, baguette en bois sacré) comme focaliseur d'incantation.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Forme Sauvage',
    description: `À partir du niveau 2, vous pouvez utiliser votre action pour prendre la forme d'une bête que vous avez déjà vue. Deux utilisations par repos court ou long.

FP max et restrictions : 1/4 (sans vol ni nage) au niveau 2, 1/2 (sans vol) au niveau 4, 1 au niveau 8.

Durée : nombre d'heures égal à la moitié de votre niveau de druide.

En forme de bête : vos statistiques sont remplacées par celles de la bête (mais vous conservez votre INT, SAG, CHA et alignement), vous conservez les bénéfices de vos capacités de classe, vous ne pouvez pas lancer de sorts, vous récupérez les PV d'avant la transformation en revenant à la normale.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: 'action',
    rechargeType: 'short_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Quand vous atteignez le niveau 4 (et à nouveau aux niveaux 8, 12, 16 et 19), vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Maximum 20.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Jeunesse éternelle',
    description: `À partir du niveau 18, la magie primordiale que vous canalisez vous fait vieillir plus lentement. Pour chaque 10 ans qui s'écoulent, votre corps n'en vieillit que d'un. De plus, vous ne pouvez pas être vieilli par magie.`,
    featureType: 'class_feature',
    levelRequired: 18,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Incantation animale',
    description: `À partir du niveau 18, vous pouvez lancer la plupart de vos sorts de druide sous n'importe laquelle de vos formes de Forme sauvage, si le sort ne nécessite pas de matériaux coûteux.`,
    featureType: 'class_feature',
    levelRequired: 18,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Archidruide',
    description: `Au niveau 20, vous pouvez utiliser Forme sauvage un nombre de fois illimité. De plus, vous pouvez ignorer les composantes verbales, somatiques et matérielles (sans coût ni consommation) de vos sorts de druide.`,
    featureType: 'class_feature',
    levelRequired: 20,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

export const druideSubclasses: SubclassDef[] = [
  {
    name: 'Cercle de la terre',
    description: `Le Cercle de la terre est composé de mystiques et de sages qui perpétuent d'anciennes connaissances et rites au travers d'une vaste tradition orale. Ils se réunissent dans des cercles sacrés d'arbres ou de pierres levées.`,
    features: [
      {
        name: 'Magie de terre naturelle',
        description: `Quand vous choisissez ce cercle au niveau 2, vous apprenez un sort mineur de druide supplémentaire de votre choix. Il ne compte pas dans votre nombre de sorts mineurs connus.`,
        featureType: 'subclass_feature',
        levelRequired: 2,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Récupération naturelle',
        description: `À partir du niveau 2, lors d'un repos court, vous pouvez récupérer des emplacements de sorts dépensés dont les niveaux totalisent au maximum la moitié de votre niveau de druide (arrondi au supérieur, aucun emplacement de niveau 6+). Utilisable une fois par repos long.`,
        featureType: 'subclass_feature',
        levelRequired: 2,
        actionType: null,
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Magie de cercle',
        description: `Votre connexion à la terre vous permet d'apprendre des sorts supplémentaires selon votre terrain favori (toujours préparés, ne comptent pas dans votre limite) :

Par exemple pour la forêt : Croissance d'épines, Peau d'écorce (niv 3), Croissance végétale, Mur d'épines (niv 5), Localisation de créature, Passage par les arbres (niv 7), Communion avec la nature, Infestation d'insectes (niv 9).`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Pas de la terre',
        description: `À partir du niveau 6, les terrains difficiles non magiques ne vous coûtent pas de déplacement supplémentaire. Vous pouvez traverser des plantes non magiques épineuses sans être ralenti ni subir de dégâts. Avantage aux jets de sauvegarde contre les plantes créées ou manipulées magiquement.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Sanctuaire naturel',
        description: `Au niveau 10, vous êtes immunisé aux sorts de charme et d'effroi des élémentaires et des fées, ainsi qu'à leurs poisons et maladies.`,
        featureType: 'subclass_feature',
        levelRequired: 10,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Sanctuaire de dame Nature',
        description: `Au niveau 14, quand une bête ou une plante vous attaque, elle doit réussir un jet de sauvegarde de Sagesse (DD = votre DD de sorts) ou choisir une autre cible, l'attaque ratant automatiquement. En cas de succès, la créature est immunisée pendant 24 heures.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Cercle de la lune',
    description: `Les druides du Cercle de la lune sont les gardiens vigilants des étendues sauvages. Ils ont un lien très étroit avec les formes animales et vivent parfois plus longtemps en forme de bête qu'en forme humaine.`,
    features: [
      {
        name: 'Combat en forme sauvage',
        description: `Quand vous choisissez ce cercle au niveau 2, vous pouvez utiliser votre action bonus pour vous transformer (au lieu d'une action). De plus, en forme de bête, vous pouvez dépenser un emplacement de sort pour récupérer 1d8 PV par niveau d'emplacement.`,
        featureType: 'subclass_feature',
        levelRequired: 2,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Formes de la lune',
        description: `À partir du niveau 2, vous pouvez vous transformer en bêtes avec un FP aussi élevé que 1. À partir du niveau 6, le FP max est égal à 1/3 de votre niveau de druide.`,
        featureType: 'subclass_feature',
        levelRequired: 2,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Forme de bête primitive',
        description: `À partir du niveau 6, vos attaques en forme de bête comptent comme magiques pour surmonter les résistances et immunités aux attaques non magiques.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Forme élémentaire',
        description: `Au niveau 10, en dépensant deux utilisations de Forme sauvage, vous pouvez vous transformer en élémentaire de l'air, de la terre, du feu ou de l'eau. Vos PV ne sont pas limités par votre niveau pour cette forme. Durée : moitié de votre niveau de druide en heures.`,
        featureType: 'subclass_feature',
        levelRequired: 10,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Druide millénaire',
        description: `Au niveau 14, vous pouvez lancer Modifier son apparence à volonté, sans dépenser d'emplacement de sorts.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

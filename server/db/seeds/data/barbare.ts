import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const barbareName = 'Barbare'

export const barbareFeatures: FeatureDef[] = [
  {
    name: 'Rage',
    description: `En combat, vous vous battez avec une férocité bestiale. À votre tour, vous pouvez entrer en rage en utilisant une action bonus.

Pendant la rage, vous bénéficiez des avantages suivants si vous ne portez pas d'armure lourde :
- Vous avez l'avantage aux jets de caractéristique et aux jets de sauvegarde de Force.
- Lorsque vous effectuez une attaque de mêlée avec une arme, vous gagnez un bonus aux jets de dégâts qui augmente à mesure que vous gagnez des niveaux en tant que barbare.
- Vous avez la résistance aux dégâts contondants, perforants et tranchants.

La rage se termine si vous êtes inconscient ou si votre tour se termine et que vous n'avez pas attaqué de créature hostile depuis votre dernier tour, et que vous n'avez pas subi de dégâts depuis lors. Vous pouvez aussi mettre fin à votre rage au prix d'une action bonus.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: 'bonus_action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Défense sans armure',
    description: `Quand vous ne portez pas d'armure, votre Classe d'Armure est égale à 10 + votre modificateur de Dextérité + votre modificateur de Constitution. Vous pouvez utiliser un bouclier et bénéficier quand même de cet avantage.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Témérité',
    description: `À partir du niveau 2, vous pouvez mettre de côté toute préoccupation pour votre défense afin d'attaquer avec une férocité désespérée. Lors de votre premier tour de chaque combat, vous pouvez décider d'attaquer avec témérité. Cela vous donne l'avantage sur vos jets d'attaque de corps à corps avec les armes de Force pour ce tour, mais les jets d'attaque contre vous ont l'avantage jusqu'à votre prochain tour.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sens du danger',
    description: `À partir du niveau 2, vous développez un sens surnaturel pour repérer quand les choses ne vont pas dans votre sens, ce qui vous confère un avantage lorsque vous esquivez le danger.

Vous avez l'avantage aux jets de sauvegarde de Dextérité contre les effets que vous pouvez voir, comme les pièges et les sorts. Pour bénéficier de cet avantage, vous ne pouvez pas être aveugle, sourd ou incapable d'agir.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Attaque supplémentaire',
    description: `À partir du niveau 5, vous pouvez attaquer deux fois, au lieu d'une seule, lorsque vous choisissez l'action Attaquer lors de votre tour.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Déplacement rapide',
    description: `À partir du niveau 5, votre vitesse augmente de 3 mètres pendant que vous ne portez pas d'armure lourde.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Instinct animal',
    description: `À partir du niveau 7, vos instincts sont si aiguisés que vous avez l'avantage aux jets d'initiative.

De plus, si vous êtes surpris au début du combat et que vous n'êtes pas incapable d'agir, vous pouvez agir normalement pendant votre premier tour, à condition d'entrer en rage avant de faire quoi que ce soit d'autre lors de ce tour.`,
    featureType: 'class_feature',
    levelRequired: 7,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Attaque brute',
    description: `À partir du niveau 9, vous pouvez dépasser les limites normales de votre corps lors de combats brutaux. Lorsque vous effectuez un coup critique avec une attaque de corps à corps lors d'une rage, vous pouvez lancer un des dés de dégâts de l'attaque une fois de plus et l'ajouter aux dégâts supplémentaires du coup critique. Au niveau 13, ce bonus passe à deux dés supplémentaires, et au niveau 17, à trois dés supplémentaires.`,
    featureType: 'class_feature',
    levelRequired: 9,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Rage implacable',
    description: `À partir du niveau 11, votre rage peut vous garder en vie malgré vos blessures. Si vous tombez à 0 point de vie pendant que vous êtes en rage et que vous ne mourez pas sur le coup, vous pouvez effectuer un jet de sauvegarde de Constitution DD 10. Si vous réussissez, vous passez à 1 point de vie à la place.

Chaque fois que vous utilisez cette capacité après la première, le DD augmente de 5. Quand vous terminez un repos court ou long, le DD revient à 10.`,
    featureType: 'class_feature',
    levelRequired: 11,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Résistance brutale',
    description: `À partir du niveau 15, votre rage est si féroce qu'elle ne peut être brisée que par votre propre volonté ou par l'inconscience. Votre rage ne se termine prématurément que si vous êtes inconscient ou si vous choisissez d'y mettre fin.`,
    featureType: 'class_feature',
    levelRequired: 15,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Persistance',
    description: `À partir du niveau 18, la puissance de votre rage est pratiquement sans limite. Si votre total pour un jet de caractéristique de Force est inférieur à votre valeur de Force, vous pouvez utiliser cette valeur à la place.`,
    featureType: 'class_feature',
    levelRequired: 18,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Force indétrônable',
    description: `Au niveau 20, vous incarnez la puissance de la nature sauvage. Vos valeurs de Force et de Constitution augmentent de 4. Votre maximum pour ces caractéristiques est désormais de 24. De plus, le nombre de rages par repos long devient illimité.`,
    featureType: 'class_feature',
    levelRequired: 20,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Lorsque vous atteignez le niveau 4, et encore aux niveaux 8, 12, 16 et 19, vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Comme d'habitude, vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 grâce à cette capacité.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

export const barbareSubclasses: SubclassDef[] = [
  {
    name: 'Voie du Berserker',
    description: `Pour certains barbares, la rage est un moyen vers une fin — et cette fin est la violence. La Voie du Berserker est un chemin de furie débridée, implacable dans sa destruction.`,
    features: [
      {
        name: 'Frénésie',
        description: `À partir du niveau 3, vous pouvez entrer en frénésie lors de votre rage. Si vous le faites, pendant la durée de votre rage, vous pouvez effectuer une attaque de corps à corps supplémentaire en utilisant une action bonus à chacun de vos tours après celui-ci. Quand votre rage se termine, vous subissez un niveau d'épuisement.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Rage insensée',
        description: `À partir du niveau 6, vous ne pouvez pas être charmé ou effrayé pendant votre rage. Si vous êtes charmé ou effrayé lorsque vous entrez en rage, l'effet est suspendu pendant la durée de la rage.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Présence intimidante',
        description: `À partir du niveau 10, vous pouvez utiliser votre action pour effrayer quelqu'un par votre présence menaçante. Lorsque vous le faites, choisissez une créature que vous pouvez voir dans un rayon de 9 mètres autour de vous. Si la créature peut vous voir ou vous entendre, elle doit réussir un jet de sauvegarde de Sagesse (DD égal à 8 + votre bonus de maîtrise + votre modificateur de Charisme) ou être effrayée de vous jusqu'à la fin de votre prochain tour.

Lors des tours suivants, vous pouvez utiliser votre action pour prolonger la durée de cet effet jusqu'à la fin de votre prochain tour. L'effet prend fin si la créature termine son tour hors de votre champ de vision ou à plus de 18 mètres de vous.

Si la créature réussit son jet de sauvegarde, vous ne pouvez plus utiliser cette capacité sur cette créature pendant 24 heures.`,
        featureType: 'subclass_feature',
        levelRequired: 10,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Vengeance',
        description: `À partir du niveau 14, quand vous subissez des dégâts d'une créature qui se trouve dans un rayon de 1,50 mètre autour de vous, vous pouvez utiliser votre réaction pour effectuer une attaque de corps à corps contre cette créature.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: 'reaction',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Voie du Totem guerrier',
    description: `La Voie du Guerrier Totem est un chemin spirituel qui honore la connexion entre un barbare et la nature. À votre entrée dans cette voie, vous vous engagez envers un animal totem, le guide de votre esprit et votre symbole de puissance.`,
    features: [
      {
        name: 'Chercheur de totem',
        description: `Au niveau 3, vous pouvez lancer les sorts Communication avec les animaux et Sens animal sous forme de rituels. Lorsque vous utilisez Sens animal, vous voyez et entendez à travers un animal naturel ordinaire (non magique) de votre choix qui est à portée.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Esprit totem',
        description: `Au niveau 3, lors d'une cérémonie rituelle, vous choisissez un animal totem et obtenez un avantage magique en rapport avec cet animal. Choisissez un animal totem et l'avantage correspondant :

- **Aigle** : Pendant la rage, les autres créatures ont le désavantage aux jets d'attaque d'opportunité contre vous, et vous pouvez utiliser l'action Foncer en tant qu'action bonus dans votre tour.
- **Loup** : Pendant la rage, vos amis ont l'avantage aux jets d'attaque de corps à corps contre les créatures hostiles situées dans un rayon de 1,50 mètre autour de vous.
- **Ours** : Pendant la rage, vous avez la résistance à tous les types de dégâts, sauf les dégâts psychiques.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Aspect du totem',
        description: `Au niveau 6, vous obtenez un avantage magique qui correspond à votre animal totem. Votre esprit totem peut être différent de celui choisi au niveau 3 :

- **Aigle** : Vous avez la vision de l'aigle. En faible luminosité, vous ne subissez pas le désavantage aux jets de Perception basés sur la vue.
- **Loup** : Vous pouvez suivre d'autres créatures en vous déplaçant à un rythme rapide. Vous pouvez également vous déplacer furtivement à un rythme normal.
- **Ours** : Votre capacité de charge est doublée. Vous avez aussi l'avantage aux jets de Force pour pousser, tirer, soulever ou briser des objets.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Marcheur de l\'esprit',
        description: `Au niveau 10, vous pouvez lancer le sort Communion avec la nature sous forme de rituel. Lorsque vous le faites, une version spirituelle de l'un des animaux que vous avez choisis pour Esprit totem ou Aspect du totem apparaît pour vous transmettre les informations que vous cherchez.`,
        featureType: 'subclass_feature',
        levelRequired: 10,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Attaque du totem',
        description: `Au niveau 14, vous obtenez un avantage magique plus puissant. Votre esprit totem peut être différent de ceux choisis précédemment :

- **Aigle** : Pendant la rage, vous avez une vitesse de vol égale à votre vitesse de déplacement. Vous tombez à la fin de votre tour si rien ne vous maintient en l'air.
- **Loup** : Pendant la rage, vous pouvez utiliser une action bonus à votre tour pour renverser une créature de taille Grande ou inférieure lorsque vous la touchez avec une attaque de corps à corps.
- **Ours** : Pendant la rage, toute créature hostile à 1,50 mètre autour de vous a le désavantage aux jets d'attaque contre des cibles autres que vous.`,
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

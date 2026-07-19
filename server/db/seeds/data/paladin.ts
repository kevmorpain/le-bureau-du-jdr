import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const paladinName = 'Paladin'

export const paladinFeatures: FeatureDef[] = [
  {
    name: 'Sens divin',
    description: `La présence d'un mal puissant s'impose à vos sens. En utilisant votre action, vous pouvez ouvrir votre conscience pour détecter de telles forces. Jusqu'à la fin de votre prochain tour, vous connaissez l'emplacement de tout céleste, fiélon ou mort-vivant dans un rayon de 18 mètres qui n'est pas derrière un abri total. Vous détectez également les lieux et objets consacrés ou profanés.

Vous pouvez utiliser cette capacité un nombre de fois égal à 1 + votre modificateur de Charisme. Vous récupérez toutes les utilisations après un repos long.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: 'action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Imposition des mains',
    description: `Votre toucher béni peut soigner les blessures. Vous possédez une réserve de pouvoir égale à votre niveau de paladin × 5 points de vie. Vous pouvez dépenser ces points pour restaurer des points de vie à une créature que vous touchez (action), ou dépenser 5 points pour soigner une maladie ou neutraliser un poison.

Cette réserve se restaure après un repos long. Elle est sans effet sur les morts-vivants et les artificiels.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: 'action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Style de combat',
    description: `Au niveau 2, vous adoptez un style de combat particulier. Choisissez parmi : Défense (+1 CA avec armure), Duel (+2 dégâts arme à une main), Arme à deux mains (relancer 1 ou 2 aux dés de dégâts), Protection (réaction pour désavantage sur attaque contre allié adjacent, nécessite bouclier).`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Incantation',
    description: `Au niveau 2, vous avez appris à puiser dans la magie divine. Le Charisme est votre caractéristique d'incantation.

Vous préparez vos sorts : nombre égal à votre modificateur de Charisme + moitié de votre niveau de paladin (minimum 1).

DD de sauvegarde = 8 + bonus de maîtrise + modificateur de Charisme.
Modificateur d'attaque de sort = bonus de maîtrise + modificateur de Charisme.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Châtiment divin',
    description: `À partir du niveau 2, quand vous touchez une créature avec une arme de corps à corps, vous pouvez dépenser un emplacement de sort pour causer des dégâts radiants supplémentaires : 2d8 pour un emplacement de niveau 1, +1d8 par niveau au-delà du 1er (max 5d8). +1d8 supplémentaire si la cible est un mort-vivant ou un fiélon (max 6d8). Décision avant le jet d'attaque, une seule fois par tour.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Santé divine',
    description: `Au niveau 3, la magie divine qui coule en vous vous rend immunisé aux maladies.`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Conduit divin',
    description: `Au niveau 3, votre serment sacré vous permet de canaliser l'énergie divine pour alimenter des effets magiques, dont les options dépendent de votre serment. Vous devez terminer un repos court ou long entre chaque utilisation.`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: 'action',
    rechargeType: 'short_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristiques',
    description: `Quand vous atteignez le niveau 4 (puis les niveaux 8, 12, 16 et 19), vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou bien augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 grâce à cette capacité.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [{ type: 'asi_or_feat', value: {} }],
  },
  {
    name: 'Attaque supplémentaire',
    description: `À partir du niveau 5, vous pouvez attaquer deux fois, au lieu d'une seule, lorsque vous utilisez l'action Attaquer lors de votre tour.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Aura de protection',
    description: `À partir du niveau 6, vous et toute créature alliée dans un rayon de 3 mètres gagnez un bonus aux jets de sauvegarde égal à votre modificateur de Charisme (minimum +1), tant que vous êtes conscient.

Au niveau 18, le rayon passe à 9 mètres.`,
    featureType: 'class_feature',
    levelRequired: 6,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Aura de courage',
    description: `Au niveau 10, vous et les créatures alliées dans un rayon de 3 mètres ne pouvez pas être effrayés tant que vous êtes conscient.

Au niveau 18, le rayon passe à 9 mètres.`,
    featureType: 'class_feature',
    levelRequired: 10,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Châtiment divin amélioré',
    description: `Au niveau 11, toutes vos frappes de corps à corps infligent 1d8 dégâts radiants supplémentaires. Ce dé s'additionne aux dés de Châtiment divin si applicable.`,
    featureType: 'class_feature',
    levelRequired: 11,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Contact purifiant',
    description: `Au niveau 14, en utilisant votre action, vous mettez fin à un sort affectant vous-même ou une créature consentante que vous touchez. Utilisable un nombre de fois égal à votre modificateur de Charisme (minimum 1). Se restaure après un repos long.`,
    featureType: 'class_feature',
    levelRequired: 14,
    actionType: 'action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
]

export const paladinSubclasses: SubclassDef[] = [
  {
    name: 'Serment de dévotion',
    description: `Le Serment de dévotion lie un paladin aux idéaux les plus élevés de la justice, de la vertu et de l'ordre. Ces paladins s'efforcent d'agir comme des instruments de la puissance divine sur Terre.`,
    features: [
      {
        name: 'Sorts du serment de dévotion',
        description: `Sorts toujours préparés (ne comptent pas dans votre limite) :
- Niveau 3 : protection contre le mal et le bien, sanctuaire
- Niveau 5 : restauration partielle, zone de vérité
- Niveau 9 : dissipation de la magie, lueur d'espoir
- Niveau 13 : gardien de la foi, liberté de mouvement
- Niveau 17 : colonne de flamme, communion`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Arme sacrée',
        description: `En utilisant votre action, vous touchez une arme et l'imprégnez de puissance divine pendant 1 minute. Vous ajoutez votre modificateur de Charisme aux jets d'attaque avec cette arme (minimum +1) et elle émet de la lumière vive sur 6 mètres et faible sur 6 mètres supplémentaires. Elle devient magique si elle ne l'était pas.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Renvoi des impies',
        description: `En utilisant votre action, vous présentez votre symbole sacré. Chaque fiélon ou mort-vivant dans un rayon de 9 mètres qui peut vous voir ou vous entendre doit réussir un jet de sauvegarde de Sagesse ou être renvoyé pendant 1 minute (ou jusqu'à ce qu'il subisse des dégâts).`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Aura de dévotion',
        description: `À partir du niveau 7, vous et vos alliés dans un rayon de 3 mètres ne pouvez pas être charmés tant que vous êtes conscient. Au niveau 18, le rayon passe à 9 mètres.`,
        featureType: 'subclass_feature',
        levelRequired: 7,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Pureté de l\'esprit',
        description: `Au niveau 15, vous êtes en permanence sous les effets du sort protection contre le mal et le bien : les fées, fiélons, morts-vivants, célestes, élémentaires et aberrations ont plus de mal à vous atteindre ou à vous contrôler.`,
        featureType: 'subclass_feature',
        levelRequired: 15,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Nimbe sacré',
        description: `Au niveau 20, en utilisant votre action, vous vous enveloppez d'une aura de lumière solaire pendant 1 minute. Vous émettez de la lumière vive sur 9 mètres et faible sur 9 mètres supplémentaires ; tout ennemi qui commence son tour dans la lumière vive subit 10 dégâts radiants. Vous avez l'avantage aux jets de sauvegarde contre les sorts lancés par les fiélons et les morts-vivants. Utilisable une fois par repos long.`,
        featureType: 'subclass_feature',
        levelRequired: 20,
        actionType: 'action',
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Serment des anciens',
    description: `Le Serment des anciens est aussi vieux que la race des elfes. Ces paladins font leurs serments à la puissance de la vie, de la beauté et de tout ce qui fait que le monde vaut la peine d'être vécu.`,
    features: [
      {
        name: 'Sorts du serment des anciens',
        description: `Sorts toujours préparés :
- Niveau 3 : communication avec les animaux, frappe piégeuse
- Niveau 5 : foulée brumeuse, rayon de lune
- Niveau 9 : croissance végétale, protection contre une énergie
- Niveau 13 : peau de pierre, tempête de grêle
- Niveau 17 : communion avec la nature, passage par les arbres`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Courroux de la nature',
        description: `En utilisant votre action, vous invoquez des lianes spirituelles qui jaillissent autour d'une créature que vous voyez dans un rayon de 3 mètres. Elle doit réussir un jet de sauvegarde de Force ou de Dextérité (au choix) ou être entravée jusqu'à la fin de votre prochain tour.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Renvoi des infidèles',
        description: `En utilisant votre action, chaque fée ou fiélon dans un rayon de 9 mètres qui peut vous voir ou vous entendre doit réussir un jet de sauvegarde de Sagesse ou être renvoyé pendant 1 minute (ou jusqu'à ce qu'il subisse des dégâts). Une créature renvoyée doit fuir loin de vous et ne peut pas s'approcher volontairement.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Aura de garde',
        description: `À partir du niveau 7, vous et les créatures alliées dans un rayon de 3 mètres avez la résistance aux dégâts infligés par les sorts. Au niveau 18, le rayon passe à 9 mètres.`,
        featureType: 'subclass_feature',
        levelRequired: 7,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Sentinelle immortelle',
        description: `Au niveau 15, quand des dégâts vous réduiraient à 0 point de vie sans vous tuer sur le coup, vous pouvez tomber à 1 point de vie à la place. Utilisable une fois par repos long. De plus, vous ne montrez plus de signe de vieillissement et ne pouvez plus être vieilli par magie.`,
        featureType: 'subclass_feature',
        levelRequired: 15,
        actionType: null,
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Champion antique',
        description: `Au niveau 20, en utilisant votre action, vous vous transformez pendant 1 minute : vous regagnez 10 points de vie au début de chacun de vos tours, vous pouvez lancer vos sorts de paladin en action bonus, et les créatures ennemies dans un rayon de 3 mètres ont un désavantage aux jets de sauvegarde contre vos sorts et votre Conduit divin. Utilisable une fois par repos long.`,
        featureType: 'subclass_feature',
        levelRequired: 20,
        actionType: 'action',
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Serment de vengeance',
    description: `Le Serment de vengeance est un engagement solennel pour punir ceux qui ont commis des crimes horribles. Ces paladins se lèvent pour combattre le mal en usant de tous les moyens nécessaires.`,
    features: [
      {
        name: 'Sorts du serment de vengeance',
        description: `Sorts toujours préparés :
- Niveau 3 : fléau, marque du chasseur
- Niveau 5 : foulée brumeuse, immobilisation de personne
- Niveau 9 : hâte, protection contre une énergie
- Niveau 13 : bannissement, porte dimensionnelle
- Niveau 17 : immobilisation de monstre, scrutation`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Conspuer l\'ennemi',
        description: `En utilisant votre action, vous choisissez une créature dans un rayon de 18 mètres qui peut vous voir ou vous entendre. Elle doit réussir un jet de sauvegarde de Sagesse ou être effrayée pendant 1 minute (ou jusqu'à ce qu'elle subisse des dégâts). Tant qu'elle est effrayée, sa vitesse est de 0.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Conduit divin : Vœu d\'hostilité',
        description: `En utilisant votre action bonus, vous prononcez un vœu d'inimitié contre une créature que vous voyez dans un rayon de 3 mètres. Vous avez l'avantage à vos jets d'attaque contre elle pendant 1 minute ou jusqu'à ce qu'elle tombe à 0 point de vie ou soit inconsciente.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'bonus_action',
        rechargeType: 'short_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Vengeur implacable',
        description: `À partir du niveau 7, quand vous touchez une créature avec une attaque d'opportunité, vous pouvez vous déplacer jusqu'à la moitié de votre vitesse immédiatement après l'attaque, sans provoquer d'attaques d'opportunité.`,
        featureType: 'subclass_feature',
        levelRequired: 7,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Âme vengeresse',
        description: `À partir du niveau 15, quand une créature soumise à votre Vœu d'hostilité effectue une attaque, vous pouvez utiliser votre réaction pour effectuer une attaque de corps à corps contre elle si elle est à portée.`,
        featureType: 'subclass_feature',
        levelRequired: 15,
        actionType: 'reaction',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Ange de la vengeance',
        description: `Au niveau 20, en utilisant votre action, vous vous transformez en un ange vengeur pendant 1 heure. Il vous pousse des ailes qui vous donnent une vitesse de vol de 18 mètres, et vous émettez une aura de menace de 9 mètres : la première fois qu'une créature ennemie entre dans l'aura ou y commence son tour, elle doit réussir un jet de sauvegarde de Sagesse ou être effrayée pour 1 minute. Utilisable une fois par repos long (ou en dépensant un emplacement de sort de niveau 5).`,
        featureType: 'subclass_feature',
        levelRequired: 20,
        actionType: 'action',
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

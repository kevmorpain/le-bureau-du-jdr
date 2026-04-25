import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const rodeurName = 'Rôdeur'

export const rodeurFeatures: FeatureDef[] = [
  {
    name: 'Ennemi juré',
    description: `Au niveau 1, choisissez un type d'ennemi favori : aberrations, artificiels, bêtes, célestes, dragons, élémentaires, fées, fiélons, géants, monstruosités, morts-vivants, plantes, vases — ou deux races d'humanoïdes.

Vous avez l'avantage aux jets de Sagesse (Survie) pour pister vos ennemis favoris, ainsi qu'aux jets d'Intelligence pour vous souvenir d'informations sur eux. Vous apprenez également une langue qu'ils parlent.

Vous choisissez un ennemi favori supplémentaire aux niveaux 6 et 14.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Explorateur né',
    description: `Au niveau 1, choisissez un terrain favori : arctique, désert, forêt, littoral, marais, montagne, plaine ou Outreterre.

En voyageant 1 heure ou plus dans votre terrain favori : terrain difficile ne ralentit pas le groupe, impossibilité de se perdre sauf par magie, vous restez alerte aux dangers même en faisant autre chose, déplacement furtif à rythme normal si seul, nourriture trouvée doublée, pistage révèle nombre exact et taille des créatures.

Vous choisissez des terrains favoris supplémentaires aux niveaux 6 et 10.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Style de combat',
    description: `Au niveau 2, choisissez un style de combat : Archerie (+2 aux jets d'attaque à distance), Combat à deux armes (ajoutez le modificateur aux dégâts de la 2e attaque), Défense (+1 CA avec armure), Duel (+2 dégâts arme à une main).`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Incantation',
    description: `Au niveau 2, vous avez appris à utiliser la nature magique des terres sauvages. La Sagesse est votre caractéristique d'incantation.

Vous connaissez deux sorts de rôdeur de niveau 1 au départ.

DD de sauvegarde = 8 + bonus de maîtrise + modificateur de Sagesse.
Modificateur d'attaque de sort = bonus de maîtrise + modificateur de Sagesse.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Vigilance primitive',
    description: `À partir du niveau 3, vous pouvez utiliser votre action et dépenser un emplacement de sort pour détecter la présence d'aberrations, célestes, dragons, élémentaires, fées, fiélons et morts-vivants dans un rayon de 1,5 km (ou 9 km dans votre terrain favori). Dure 1 minute par niveau d'emplacement dépensé.`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: 'action',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Quand vous atteignez le niveau 4 (puis les niveaux 8, 12, 16 et 19), vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou deux de 1. Maximum 20.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Attaque supplémentaire',
    description: `À partir du niveau 5, vous pouvez attaquer deux fois lorsque vous choisissez l'action Attaquer lors de votre tour.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Cachette des terres',
    description: `Au niveau 8, en passant au moins 1 minute à vous camoufler avec des matériaux naturels, vous gagnez +10 aux jets de Discrétion pour vous cacher parmi la végétation, les rochers, la neige ou autres éléments naturels.`,
    featureType: 'class_feature',
    levelRequired: 8,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Déplacement des terres',
    description: `À partir du niveau 8, les terrains difficiles non magiques ne vous coûtent pas de déplacement supplémentaire. Vous pouvez traverser les plantes non magiques sans être ralenti ni subir de dégâts. Avantage aux jets de sauvegarde contre les plantes créées magiquement (ex : Enchevêtrement).`,
    featureType: 'class_feature',
    levelRequired: 8,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Détection des failles',
    description: `Au niveau 10, vous avez l'avantage aux tests passifs de Perception, et vous ne pouvez pas être surpris. Vous pouvez détecter les portes secrètes dans un rayon de 9 mètres en passant à côté d'elles.`,
    featureType: 'class_feature',
    levelRequired: 10,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Disparition',
    description: `À partir du niveau 14, vous pouvez utiliser l'action Se cacher en tant qu'action bonus lors de votre tour. De plus, vous ne pouvez pas être pisté par des moyens non magiques, sauf si vous choisissez de laisser une piste.`,
    featureType: 'class_feature',
    levelRequired: 14,
    actionType: 'bonus_action',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sens cachés',
    description: `Au niveau 18, vous pouvez détecter l'emplacement de toute créature invisible dans un rayon de 9 mètres. Vous n'avez pas de désavantage aux jets d'attaque contre des créatures que vous avez ainsi détectées.`,
    featureType: 'class_feature',
    levelRequired: 18,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

export const rodeurSubclasses: SubclassDef[] = [
  {
    name: 'Chasseur',
    description: `S'assimiler à la figure du Chasseur, c'est accepter de devenir la lame de la civilisation contre les ténèbres qui menacent de l'engloutir.`,
    features: [
      {
        name: 'Proie du chasseur',
        description: `Au niveau 3, choisissez l'une de ces capacités :

**Tueur de colosses :** Quand vous touchez une créature sous son maximum de PV, infligez 1d8 dégâts supplémentaires (une fois par tour).

**Seigneur de la horde :** Quand vous touchez une créature, action bonus pour attaquer une autre créature à 1,5 m de la cible et dans votre portée.

**Tueur de géants :** Quand une créature Grande ou plus grande vous rate, réaction pour l'attaquer immédiatement.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Tactiques défensives',
        description: `Au niveau 7, choisissez l'une de ces capacités :

**Échapper à la horde :** Les attaques d'opportunité contre vous ont le désavantage.

**Défense contre les attaques multiples :** Quand une créature vous touche, +4 CA contre ses attaques suivantes ce tour.

**Moral d'acier :** Avantage aux jets de sauvegarde contre la condition effrayé.`,
        featureType: 'subclass_feature',
        levelRequired: 7,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Attaque multiple',
        description: `Au niveau 11, choisissez l'une de ces capacités :

**Volée :** Action pour attaquer à distance toutes les créatures de votre choix visibles dans votre portée, si elles sont dans un rayon de 3 m d'un point choisi (jet d'attaque distinct par cible).

**Attaque tourbillonnante :** Action pour attaquer au corps à corps toutes les créatures dans un rayon de 1,5 m (jet distinct par cible).`,
        featureType: 'subclass_feature',
        levelRequired: 11,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Défense supérieure',
        description: `Au niveau 15, choisissez l'une de ces capacités :

**Esquive totale :** Dégâts divisés par 2 en cas d'échec à un jet de sauvegarde de Dextérité, et nuls en cas de réussite.

**Retour de bâton :** Quand une créature vous rate, réaction pour la forcer à répéter l'attaque contre une autre créature.

**Esquive instinctive :** Réaction pour réduire de moitié les dégâts d'une attaque visible.`,
        featureType: 'subclass_feature',
        levelRequired: 15,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Maître des bêtes',
    description: `Le Maître des bêtes incarne une amitié entre le monde civilisé et les étendues sauvages. Uni à un compagnon animal, le rôdeur forge une liaison profonde avec cette bête.`,
    features: [
      {
        name: 'Compagnon animal',
        description: `Au niveau 3, après 8 heures passées en forêt, vous appelez une bête avec un FP ≤ 1/4 et de taille Moyenne ou petite comme compagnon. Elle obéit à vos ordres et agit à votre initiative.

Ajoutez votre bonus de maîtrise à ses jets d'attaque, dégâts et jets de sauvegarde. Son bonus de CA = votre bonus de maîtrise. Ses PV max = max(PV normaux, 4 × votre niveau de rôdeur).

Si votre compagnon meurt, vous pouvez en appeler un autre après 8 heures.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Entraînement exceptionnel',
        description: `Au niveau 7, lors de tours où votre compagnon n'attaque pas, vous pouvez utiliser une action bonus pour lui ordonner d'Aider, Se désengager ou Foncer. Ses attaques comptent comme magiques.`,
        featureType: 'subclass_feature',
        levelRequired: 7,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Attaque bestiale',
        description: `Au niveau 11, quand vous ordonnez à votre compagnon d'attaquer, il peut effectuer deux attaques, ou utiliser sa capacité Attaques multiples s'il en possède une.`,
        featureType: 'subclass_feature',
        levelRequired: 11,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Partage des sorts',
        description: `À partir du niveau 15, quand vous lancez un sort qui vous cible uniquement, vous pouvez l'étendre à votre compagnon s'il se trouve dans un rayon de 9 mètres.`,
        featureType: 'subclass_feature',
        levelRequired: 15,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

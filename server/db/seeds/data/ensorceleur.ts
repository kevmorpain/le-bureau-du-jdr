import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const ensorceleurName = 'Ensorceleur'

export const ensorceleurFeatures: FeatureDef[] = [
  {
    name: 'Incantation',
    description: `Un événement dans votre passé vous a laissé une marque indélébile, en vous insufflant la magie des arcanes.

Vous connaissez quatre sorts mineurs de votre choix dans la liste d'ensorceleur, et deux sorts de niveau 1.

Le Charisme est votre caractéristique d'incantation.
DD de sauvegarde = 8 + bonus de maîtrise + modificateur de Charisme.
Modificateur d'attaque de sort = bonus de maîtrise + modificateur de Charisme.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Source de magie',
    description: `À partir du niveau 2, vous exploitez une source profonde de magie représentée par des points de sorcellerie. Vous commencez avec 2 points, et en gagnez davantage avec les niveaux. Vous les regagnez après un repos long.

**Créer des emplacements de sorts (action bonus) :** Convertissez des points en emplacements. Coût : niv 1 = 2, niv 2 = 3, niv 3 = 5, niv 4 = 6, niv 5 = 7 points.

**Convertir en points (action bonus) :** Dépensez un emplacement pour gagner un nombre de points égal au niveau de l'emplacement.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: 'bonus_action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Métamagie',
    description: `Au niveau 3, vous gagnez deux options de Métamagie de votre choix (une autre au niv 10 et au niv 17).

**Sort accéléré (2 points) :** Changez le temps d'incantation d'une action en action bonus.
**Sort ample (1 point) :** Doublez la portée du sort (si 1,5 m ou plus).
**Sort étendu (1 point) :** Doublez la durée (max 24h) pour les sorts de 1 minute ou plus.
**Sort intensifié (3 points) :** La cible a le désavantage au premier jet de sauvegarde.
**Sort jumeau (coût = niveau du sort) :** Ciblez une seconde créature avec un sort à cible unique.
**Sort prévenant (1 point) :** Jusqu'à Cha modificateur de créatures réussissent automatiquement leur sauvegarde.
**Sort renforcé (1 point) :** Relancez jusqu'à Cha modificateur de dés de dégâts.
**Sort subtil (1 point) :** Lancez sans composante verbale ni somatique.`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristiques',
    description: `Quand vous atteignez le niveau 4 (et à nouveau aux niveaux 8, 12, 16 et 19), vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 grâce à cette capacité.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [{ type: 'asi_or_feat', value: {} }],
  },
  {
    name: 'Restauration ensorcelée',
    description: `Au niveau 20, vous rechargez votre source de magie plus rapidement. Vous regagnez 4 points de sorcellerie dépensés chaque fois que vous terminez un repos court.`,
    featureType: 'class_feature',
    levelRequired: 20,
    actionType: null,
    rechargeType: 'short_rest',
    maxUsesFormula: null,
    effects: [],
  },
]

export const ensorceleurSubclasses: SubclassDef[] = [
  {
    name: 'Lignée draconique',
    description: `Votre magie innée vient de la magie draconique qui s'est mêlée à votre sang. Cette ascendance vous confère de grands pouvoirs liés aux dragons.`,
    features: [
      {
        name: 'Ancêtre draconique',
        description: `Au niveau 1, vous choisissez un type de dragon comme ancêtre. Vous pouvez parler, lire et écrire le draconique. Lors de vos interactions avec des dragons, votre bonus de maîtrise est doublé pour les jets de Charisme.

Types et dégâts associés : Airain/Or/Rouge (feu), Argent/Blanc (froid), Bleu/Bronze (foudre), Cuivre/Noir (acide), Vert (poison).`,
        featureType: 'subclass_feature',
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Résistance draconique',
        description: `Au niveau 1, votre maximum de points de vie augmente de 1 par niveau d'ensorceleur. De plus, sans armure, votre CA est égale à 13 + votre modificateur de Dextérité.`,
        featureType: 'subclass_feature',
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Affinité élémentaire',
        description: `Au niveau 6, quand vous lancez un sort infligeant des dégâts du type de votre ancêtre, vous pouvez ajouter votre modificateur de Charisme à un jet de dégâts. Vous pouvez aussi dépenser 1 point de sorcellerie pour obtenir la résistance à ce type de dégâts pendant 1 heure.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Ailes draconiques',
        description: `Au niveau 14, vous pouvez faire pousser une paire d'ailes de dragon (action bonus). Vitesse de vol égale à votre vitesse de marche. Vous pouvez les résorber avec une action bonus. Non compatible avec une armure non adaptée.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Présence draconique',
        description: `Au niveau 18, dépensez 5 points de sorcellerie pour émettre une aura de crainte ou de fascination pendant 1 minute (concentration). Toute créature hostile dans un rayon de 18 m doit réussir un jet de sauvegarde de Sagesse contre votre DD ou être charmée/effrayée jusqu'à la fin de votre prochain tour. Succès = immunité pendant 24h.`,
        featureType: 'subclass_feature',
        levelRequired: 18,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Magie sauvage',
    description: `Votre magie innée provient du chaos de la magie sauvage. Imprévisible et irrépressible, cette magie chaotique fait partie de votre vie.`,
    features: [
      {
        name: 'Pic de magie sauvage',
        description: `À partir du niveau 1, votre lien avec le chaos peut provoquer des effets imprévisibles. Chaque fois que vous lancez un sort d'ensorceleur de niveau 1 ou supérieur, le MD peut vous demander de lancer un d20. Sur un 1, lancez sur la table de Pic de magie sauvage pour déclencher un effet magique aléatoire.`,
        featureType: 'subclass_feature',
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Marée du chaos',
        description: `À partir du niveau 1, vous pouvez puiser dans le chaos pour gagner un avantage à un jet d'attaque, un test de caractéristique ou un jet de sauvegarde de votre choix. Une fois cette faculté utilisée, vous devez terminer un repos long avant de pouvoir vous en resservir — sauf si le MD vous fait lancer sur la table de Pic de magie sauvage, ce qui la recharge immédiatement.`,
        featureType: 'subclass_feature',
        levelRequired: 1,
        actionType: null,
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Chance forcée',
        description: `À partir du niveau 6, lorsqu'une autre créature que vous effectue un jet d'attaque, un test de caractéristique ou un jet de sauvegarde, vous pouvez utiliser votre réaction et dépenser 2 points de sorcellerie pour lancer 1d4 et l'appliquer comme bonus ou malus au jet. Vous pouvez le faire après le jet de dé, mais avant que le MD n'en annonce le résultat.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: 'reaction',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Chaos contrôlé',
        description: `À partir du niveau 14, vous gagnez un certain contrôle sur les vagues de magie chaotique. Chaque fois que vous lancez sur la table de Pic de magie sauvage, vous pouvez lancer le dé deux fois et choisir lequel des deux résultats s'applique.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Bombardement de sort',
        description: `À partir du niveau 18, vos sorts débordent d'énergie. Lorsque vous lancez les dés de dégâts d'un sort et qu'au moins un dé affiche son résultat maximal, vous choisissez l'un de ces dés, vous le relancez et vous ajoutez le nouveau résultat aux dégâts. Vous ne pouvez utiliser cette faculté qu'une fois par tour.`,
        featureType: 'subclass_feature',
        levelRequired: 18,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

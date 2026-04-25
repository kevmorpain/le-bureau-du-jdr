import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const moineName = 'Moine'

export const moineFeatures: FeatureDef[] = [
  {
    name: 'Défense sans armure',
    description: `Tant que vous n'êtes équipé ni d'une armure, ni d'un bouclier, votre CA est égale à 10 + votre modificateur de Dextérité + votre modificateur de Sagesse.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Arts martiaux',
    description: `Votre pratique des arts martiaux vous donne la maîtrise des styles de combat utilisant les attaques à mains nues et les armes de moine (épées courtes et armes de corps à corps simples sans la propriété à deux mains ou lourde).

Vous gagnez les avantages suivants quand vous êtes à mains nues ou que vous ne maniez que des armes de moine sans armure ni bouclier :
- Vous pouvez utiliser la Dextérité à la place de la Force pour les jets d'attaque et de dégâts.
- Vous pouvez lancer un d4 à la place des dégâts normaux (d6 au niveau 5, d8 au niveau 11, d10 au niveau 17).
- Quand vous utilisez l'action Attaquer avec une attaque à mains nues ou une arme de moine, vous pouvez effectuer une attaque à mains nues supplémentaire en tant qu'action bonus.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Points de ki',
    description: `Au niveau 2, votre entraînement vous permet d'exploiter une réserve mystique d'énergie intérieure représentée par des points de ki. Vous regagnez tous vos points de ki dépensés après un repos court ou long (30 minutes de méditation minimum).

DD de sauvegarde de ki = 8 + votre bonus de maîtrise + votre modificateur de Sagesse.

**Défense patiente (1 ki) :** Effectuez l'action Esquiver en tant qu'action bonus.
**Déluge de coups (1 ki) :** Immédiatement après l'action Attaquer, effectuez deux attaques à mains nues supplémentaires en tant qu'action bonus.
**Déplacement aérien (1 ki) :** Effectuez l'action Se désengager ou Foncer en tant qu'action bonus, et votre distance de saut est doublée pour ce tour.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: 'short_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Déplacement sans armure',
    description: `À partir du niveau 2, votre vitesse augmente de 3 mètres sans armure ni bouclier. Ce bonus augmente : +4,5 m au niveau 6, +6 m au niveau 10, +7,5 m au niveau 14, +9 m au niveau 18.

Au niveau 9, vous pouvez vous déplacer sur les surfaces verticales et les liquides sans tomber, tant que vous terminez votre tour sur une surface horizontale solide.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Déviation des projectiles',
    description: `À partir du niveau 3, vous pouvez utiliser votre réaction pour dévier ou attraper le projectile quand vous êtes touché par une attaque avec une arme à distance. Les dégâts sont réduits de 1d10 + votre modificateur de Dextérité + votre niveau de moine.

Si vous réduisez les dégâts à 0, vous pouvez attraper le projectile et dépenser 1 point de ki pour le renvoyer avec une attaque à distance (portée 6/18 mètres, maîtrise incluse).`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: 'reaction',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Quand vous atteignez le niveau 4 (puis les niveaux 8, 12, 16 et 19), vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou bien augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 grâce à cette capacité.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
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
    name: 'Frappe étourdissante',
    description: `À partir du niveau 5, quand vous touchez une autre créature avec une attaque au corps à corps avec une arme, vous pouvez dépenser 1 point de ki pour tenter une frappe étourdissante. La cible doit réussir un jet de sauvegarde de Constitution ou être étourdie jusqu'à la fin de votre prochain tour.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Réflexes du moine',
    description: `À partir du niveau 7, quand vous êtes soumis à un effet qui vous permet d'effectuer un jet de sauvegarde de Dextérité pour ne subir que la moitié des dégâts, vous ne subissez aucun dégât si vous réussissez, et seulement la moitié si vous échouez.`,
    featureType: 'class_feature',
    levelRequired: 7,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Immobilisation du corps',
    description: `À partir du niveau 7, vous pouvez utiliser votre action pour mettre fin à un effet qui vous affecte et qui vous charme ou vous effraie.`,
    featureType: 'class_feature',
    levelRequired: 7,
    actionType: 'action',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Corps de diamant',
    description: `Au niveau 10, votre maîtrise du ki vous rend immunisé aux maladies et aux poisons.`,
    featureType: 'class_feature',
    levelRequired: 10,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Déplacement sans âge',
    description: `Au niveau 15, votre ki vous sustente de sorte que vous n'avez plus besoin de nourriture ni d'eau, et les effets du vieillissement ne peuvent plus vous toucher. Vous ne pouvez plus être vieilli par magie.`,
    featureType: 'class_feature',
    levelRequired: 15,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Vide parfait',
    description: `Au niveau 18, vous maîtrisez deux façons de projeter votre ki :

**Vide immaculé (4 ki) :** En utilisant votre action, vous devenez invisible pendant 1 minute et gagnez la résistance à tous les dégâts sauf contondants, tranchants et perforants.

Vous pouvez également dépenser 8 points de ki pour lancer le sort projection astrale sans composantes matérielles, en vous ciblant uniquement.`,
    featureType: 'class_feature',
    levelRequired: 18,
    actionType: 'action',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Perfection de l\'être',
    description: `Au niveau 20, quand vous lancez l'initiative et n'avez plus de points de ki, vous en récupérez 4.`,
    featureType: 'class_feature',
    levelRequired: 20,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

export const moineSubclasses: SubclassDef[] = [
  {
    name: 'Voie de la Paume Ouverte',
    description: `Les moines de la Voie de la Paume Ouverte sont les maîtres ultimes de l'art du combat à mains nues. Ils apprennent des techniques pour repousser ou renverser leurs adversaires et atteindre un état de perfection physique et spirituelle.`,
    features: [
      {
        name: 'Technique de la paume ouverte',
        description: `À partir du niveau 3, vous pouvez manipuler le ki de votre ennemi quand vous utilisez votre Déluge de coups. Chaque fois que vous touchez une créature avec un des coups du Déluge de coups, vous pouvez lui imposer un des effets suivants :
- Elle doit réussir un jet de sauvegarde de Dextérité ou tomber à terre.
- Elle doit réussir un jet de sauvegarde de Force ou être repoussée à 4,5 mètres de vous.
- Elle ne peut effectuer aucune réaction jusqu'au début de votre prochain tour.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Corps et âme',
        description: `Au niveau 6, vous pouvez vous soigner vous-même. En utilisant votre action, vous regagnez un nombre de points de vie égal à trois fois votre niveau de moine. Vous devez terminer un repos long pour pouvoir utiliser à nouveau cette capacité.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: 'action',
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Frappe spectrale',
        description: `Au niveau 11, quand vous terminez un repos long, vous gagnez l'effet du sort sanctuaire jusqu'au début de votre prochain repos long. Le DD du jet de sauvegarde est égal à 8 + votre modificateur de Sagesse + votre bonus de maîtrise.`,
        featureType: 'subclass_feature',
        levelRequired: 11,
        actionType: null,
        rechargeType: 'long_rest',
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Paume tremblante',
        description: `Au niveau 17, quand vous touchez une créature avec une attaque à mains nues, vous pouvez dépenser 3 points de ki pour déclencher des vibrations létales qui durent un nombre de jours égal à votre niveau de moine. Vous pouvez utiliser votre action à tout moment pour les déclencher : la cible doit réussir un jet de sauvegarde de Constitution ou tomber à 0 PV, ou subir 10d10 dégâts nécrotiques en cas de succès.`,
        featureType: 'subclass_feature',
        levelRequired: 17,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Voie de l\'Ombre',
    description: `Les moines de la Voie de l'Ombre valorisent la discrétion et le mystère. Ils servent d'espions et d'assassins, parfois organisés en guildes de voleurs.`,
    features: [
      {
        name: 'Sorts de l\'ombre',
        description: `À partir du niveau 3, vous pouvez utiliser votre ki pour dupliquer les effets de certains sorts. En utilisant votre action, vous pouvez dépenser 2 points de ki pour lancer ténèbres, vision dans le noir, passe-sans-trace ou silence, sans composantes matérielles. Vous obtenez également le sort mineur illusion mineure si vous ne le connaissez pas déjà.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Ombres furtives',
        description: `Au niveau 6, lorsque vous êtes dans une zone de lumière faible ou de ténèbres, vous pouvez utiliser votre action bonus pour vous téléporter dans un espace inoccupé que vous pouvez voir et qui est également dans une zone de lumière faible ou de ténèbres. Vous avez l'avantage au premier jet d'attaque au corps à corps que vous faites avant la fin de ce tour.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Manteau de l\'ombre',
        description: `Au niveau 11, dans une zone de lumière faible ou de ténèbres, vous pouvez utiliser votre action pour devenir invisible jusqu'à ce que vous fassiez une attaque, lanciez un sort, ou vous retrouviez dans une zone de lumière vive.`,
        featureType: 'subclass_feature',
        levelRequired: 11,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Assassin silencieux',
        description: `Au niveau 17, quand une créature dans votre portée est touchée par une attaque portée par quelqu'un d'autre que vous, vous pouvez utiliser votre réaction pour effectuer une attaque au corps à corps contre cette créature.`,
        featureType: 'subclass_feature',
        levelRequired: 17,
        actionType: 'reaction',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'Voie des Quatre Éléments',
    description: `Vous suivez une tradition monastique qui vous permet de vous harmoniser avec les quatre éléments. Ces moines canalisent le ki pour reproduire des effets magiques élémentaires.`,
    features: [
      {
        name: 'Disciple des éléments',
        description: `Au niveau 3, vous apprenez des disciplines magiques qui exploitent la puissance des quatre éléments. Vous connaissez la discipline Lien élémentaire et une autre discipline élémentaire de votre choix. Vous en apprenez une supplémentaire aux niveaux 6, 11 et 17.

**Lien élémentaire :** Action pour créer de petits effets élémentaires inoffensifs (flamme, vent doux, courant d'eau, tremblement mineur).

Exemples de disciplines disponibles (coût en ki) :
- **Crochets du serpent de feu (2 ki) :** Portée +3 m et dégâts de feu supplémentaires lors des attaques.
- **Poing de l'Air (2 ki) :** Explosion d'air — la cible subit 3d10 dégâts contondants et est repoussée de 6 m (jet de sauvegarde de Force).
- **Fouet de l'Onde (2 ki) :** La cible subit 3d10 dégâts contondants et est tirée vers vous (jet de sauvegarde de Dextérité).
- **Frappe de cendres (2 ki) :** Lance mains brûlantes.
- **Destrier des vents (4 ki, niv 11) :** Lance vol sur vous-même.
- **Flammes du phénix (4 ki, niv 11) :** Lance boule de feu.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

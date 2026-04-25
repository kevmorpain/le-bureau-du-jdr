import type { FeatureDef, SubclassDef } from '../lib/seedClass'

export const bardeName = 'Barde'

export const bardeFeatures: FeatureDef[] = [
  {
    name: 'Lanceur de sorts',
    description: `Vous avez appris à défaire la magie de la réalité elle-même et à la façonner selon vos désirs. Le Charisme est votre caractéristique d'incantation pour vos sorts de barde.

DD de sauvegarde des sorts = 8 + votre bonus de maîtrise + votre modificateur de Charisme.
Modificateur d'attaque de sort = votre bonus de maîtrise + votre modificateur de Charisme.

Vous pouvez utiliser un instrument de musique comme focaliseur d'incantation pour vos sorts de barde.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Inspiration bardique',
    description: `Vous pouvez inspirer les autres par vos paroles ou votre musique envoûtantes. Pour ce faire, utilisez une action bonus à votre tour pour choisir une créature autre que vous-même dans un rayon de 18 mètres et qui peut vous entendre. Cette créature gagne un dé d'Inspiration bardique, un d6.

Une fois dans les 10 minutes suivantes, la créature peut lancer ce dé et ajouter le nombre obtenu à un jet de caractéristique, un jet d'attaque ou un jet de sauvegarde qu'elle vient d'effectuer. La créature peut attendre d'avoir lancé le d20 avant de décider d'utiliser le dé d'Inspiration bardique, mais doit décider avant que le MJ annonce si le jet est une réussite ou un échec.

Vous pouvez utiliser cette capacité un nombre de fois égal à votre modificateur de Charisme (minimum une fois). Vous retrouvez toutes vos utilisations dépensées lorsque vous terminez un repos long.

Le dé évolue : d8 au niveau 5, d10 au niveau 10, d12 au niveau 15.`,
    featureType: 'class_feature',
    levelRequired: 1,
    actionType: 'bonus_action',
    rechargeType: 'long_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Touche-à-tout',
    description: `À partir du niveau 2, vous pouvez ajouter la moitié de votre bonus de maîtrise, arrondi à l'inférieur, à tout jet de caractéristique qui n'inclut pas déjà votre bonus de maîtrise.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Chant reposant',
    description: `À partir du niveau 2, vous pouvez utiliser de la musique apaisante ou des oraisons pour aider à revigorer vos alliés blessés lors d'un repos court. Si vous ou des créatures amies qui peuvent entendre votre interprétation dépensez des dés de vie lors d'un repos court, chacune de ces créatures récupère 1d6 points de vie supplémentaires.

Le montant augmente : 1d8 au niveau 9, 1d10 au niveau 13, et 1d12 au niveau 17.`,
    featureType: 'class_feature',
    levelRequired: 2,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Expertise',
    description: `Au niveau 3, choisissez deux de vos maîtrises de compétence. Votre bonus de maîtrise est doublé pour tout jet de caractéristique que vous effectuez et qui utilise l'une de ces compétences choisies.

Au niveau 10, vous pouvez choisir deux autres maîtrises de compétence à améliorer de la même façon.`,
    featureType: 'class_feature',
    levelRequired: 3,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Source d\'inspiration',
    description: `À partir du niveau 5, vous retrouvez toutes vos utilisations dépensées d'Inspiration bardique lorsque vous terminez un repos court ou long.`,
    featureType: 'class_feature',
    levelRequired: 5,
    actionType: null,
    rechargeType: 'short_rest',
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Contre-charme',
    description: `À partir du niveau 6, vous avez acquis la capacité d'utiliser des notes musicales ou des mots de puissance pour interrompre des effets qui affectent l'esprit. Par une action, vous commencez une interprétation qui dure jusqu'à la fin de votre prochain tour. Pendant ce temps, vous et toute créature amie dans un rayon de 9 mètres autour de vous avez l'avantage aux jets de sauvegarde contre être charmé ou effrayé.`,
    featureType: 'class_feature',
    levelRequired: 6,
    actionType: 'action',
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Secrets magiques',
    description: `Au niveau 10, vous avez pillé la magie de toutes sortes de disciplines. Choisissez deux sorts de n'importe quelle classe. Ces sorts comptent comme des sorts de barde pour vous.

Vous apprenez deux sorts supplémentaires de n'importe quelle classe au niveau 14, et deux autres au niveau 18.`,
    featureType: 'class_feature',
    levelRequired: 10,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Maîtrise bardique',
    description: `Au niveau 20, lorsque vous lancez le dé d'initiative et qu'il ne vous reste pas d'utilisations d'Inspiration bardique, vous en récupérez une utilisation.`,
    featureType: 'class_feature',
    levelRequired: 20,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Lorsque vous atteignez le niveau 4, et encore aux niveaux 8, 12, 16 et 19, vous pouvez augmenter une valeur de caractéristique de votre choix de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 grâce à cette capacité.`,
    featureType: 'class_feature',
    levelRequired: 4,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

export const bardeSubclasses: SubclassDef[] = [
  {
    name: 'Collège du Savoir',
    description: `Les bardes du Collège du Savoir connaissent quelque chose sur la plupart des choses, accumulant des bribes de connaissance de sources aussi diverses que des écrits anciens et des anecdotes. Ils utilisent leurs talents pour captiver le public.`,
    features: [
      {
        name: 'Compétences supplémentaires',
        description: `Lorsque vous rejoignez le Collège du Savoir au niveau 3, vous gagnez la maîtrise de trois compétences de votre choix.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Mots acérés',
        description: `Toujours au niveau 3, vous apprenez à utiliser votre esprit pour semer le trouble dans la concentration de vos ennemis. Lorsqu'une créature que vous pouvez voir dans un rayon de 18 mètres autour de vous effectue un jet d'attaque, de caractéristique ou de dégâts, vous pouvez utiliser votre réaction pour dépenser l'une de vos utilisations d'Inspiration bardique et soustraire le nombre obtenu au jet de la créature. Vous pouvez choisir d'utiliser cette capacité après que la créature a lancé son dé, mais avant que le MJ ne détermine si le résultat est une réussite ou un échec. La créature est immunisée si elle ne peut pas vous entendre ou si elle est immunisée contre le charme.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: 'reaction',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Secrets magiques supplémentaires',
        description: `Au niveau 6, vous apprenez deux sorts de n'importe quelle classe. Un sort choisi doit être d'un niveau que vous pouvez lancer ou bien un sort mineur. Ces sorts comptent comme des sorts de barde pour vous, mais ne comptent pas dans votre nombre de sorts connus.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Gloire inégalée',
        description: `À partir du niveau 14, lorsque vous effectuez un jet de caractéristique, vous pouvez dépenser une utilisation d'Inspiration bardique. Lancez un dé d'Inspiration bardique et ajoutez le résultat à votre jet. Vous pouvez choisir de le faire après avoir lancé le dé mais avant que le MJ vous dise si vous réussissez ou échouez.`,
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
    name: 'Collège de Bravoure',
    description: `Les bardes du Collège de Bravoure sont des conteurs d'épopées légendaires de victoires contre des ennemis terrifiants. Ils s'inspirent de l'héroïsme pour insuffler le courage à leur public, et rejoignent souvent les rangs des combattants pour faire de nouveaux récits de première main.`,
    features: [
      {
        name: 'Maîtrises supplémentaires',
        description: `Lorsque vous rejoignez le Collège de Bravoure au niveau 3, vous gagnez la maîtrise des armures intermédiaires, des boucliers et des armes de guerre.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Inspiration de combat',
        description: `Toujours au niveau 3, vous apprenez à inspirer les autres dans le feu de l'action. Une créature qui reçoit un dé d'Inspiration bardique de vous peut lancer ce dé et ajouter le nombre obtenu au jet de dégâts d'une arme qu'elle vient d'effectuer. Par ailleurs, si une créature est attaquée, elle peut utiliser sa réaction pour lancer le dé d'Inspiration bardique et ajouter le nombre obtenu à sa CA contre cette attaque.`,
        featureType: 'subclass_feature',
        levelRequired: 3,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Attaque supplémentaire',
        description: `À partir du niveau 6, vous pouvez attaquer deux fois, au lieu d'une seule, lorsque vous choisissez l'action Attaquer lors de votre tour.`,
        featureType: 'subclass_feature',
        levelRequired: 6,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Sorts de bataille',
        description: `Au niveau 14, vous avez maîtrisé l'art de tisser la magie dans vos attaques. Lorsque vous utilisez votre action pour lancer un sort de barde, vous pouvez effectuer une attaque avec une arme par une action bonus.`,
        featureType: 'subclass_feature',
        levelRequired: 14,
        actionType: 'bonus_action',
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

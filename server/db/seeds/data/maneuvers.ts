import type { Formula } from '~~/shared/utils/formula'
import type { FeatureDef } from '../lib/seedClass'

// Données du Maître de guerre sans import de valeur : le script qui écrit la migration 0151 les charge telles quelles.

// Index = niveau de guerrier - 1.
export const SUPERIORITY_DICE_COUNT: Formula = { op: 'lookup', table: [0, 0, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6] }
export const SUPERIORITY_DIE: Formula = { op: 'lookup', table: [8, 8, 8, 8, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12, 12] }
export const MANEUVERS_KNOWN: Formula = { op: 'lookup', table: [0, 0, 3, 3, 3, 3, 5, 5, 5, 7, 7, 7, 7, 7, 9, 9, 9, 9, 9, 9] }

export const SUPERIORITY_DESCRIPTION = `Au niveau 3, vous apprenez des manœuvres alimentées par des dés de supériorité.

**Manœuvres :** vous connaissez trois manœuvres de votre choix, et en apprenez deux de plus aux niveaux 7, 10 et 15. Chaque fois que vous en apprenez de nouvelles, vous pouvez aussi en remplacer une que vous connaissez par une autre.

**Dés de supériorité :** vous disposez de quatre dés de supériorité (d8), d'un cinquième au niveau 7 et d'un sixième au niveau 15. Vous regagnez les dés dépensés à la fin d'un repos court ou long. Ils deviennent des d10 au niveau 10 et des d12 au niveau 18.

**Jets de sauvegarde :** DD de manœuvre = 8 + votre bonus de maîtrise + votre modificateur de Force ou de Dextérité (au choix).`

interface ManeuverDef {
  name: string
  description: string
  actionType: 'bonus_action' | 'reaction' | null
}

const MANEUVERS: ManeuverDef[] = [
  {
    name: 'Attaque menaçante',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. La cible fait un jet de sauvegarde de Sagesse ; en cas d'échec, elle est effrayée jusqu'à la fin de votre prochain tour.`,
    actionType: null,
  },
  {
    name: 'Attaque précise',
    description: `Quand vous faites une attaque avec une arme, vous pouvez dépenser un dé de supériorité et l'ajouter au jet d'attaque, avant ou après le jet, mais avant que les effets de l'attaque ne s'appliquent.`,
    actionType: null,
  },
  {
    name: 'Balayage',
    description: `Quand vous touchez une créature au corps à corps, vous pouvez dépenser un dé de supériorité pour tenter de toucher une autre créature située à 1,50 m ou moins de la première et à votre portée. Faites un jet d'attaque contre elle ; si elle est touchée, elle subit des dégâts égaux au dé de supériorité, du même type que ceux de l'attaque initiale.`,
    actionType: null,
  },
  {
    name: 'Croc-en-jambe',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. Si la cible est de taille G ou inférieure, elle fait un jet de sauvegarde de Force ; en cas d'échec, vous la jetez à terre.`,
    actionType: null,
  },
  {
    name: 'Désarmement',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. La cible fait un jet de sauvegarde de Force ; en cas d'échec, elle lâche l'objet de votre choix, qui tombe à ses pieds.`,
    actionType: null,
  },
  {
    name: 'Diversion',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. Jusqu'au début de votre prochain tour, la prochaine attaque d'un allié contre cette cible a l'avantage.`,
    actionType: null,
  },
  {
    name: 'Feinte',
    description: `Par une action bonus à votre tour, vous pouvez dépenser un dé de supériorité pour feinter une créature située à 1,50 m ou moins. Vous avez l'avantage à votre prochaine attaque contre elle ce tour-ci ; si cette attaque touche, ajoutez le dé aux dégâts.`,
    actionType: 'bonus_action',
  },
  {
    name: 'Fente',
    description: `Quand vous faites une attaque de corps à corps pendant votre tour, vous pouvez dépenser un dé de supériorité pour augmenter votre allonge de 1,50 m pour cette attaque. Si elle touche, ajoutez le dé aux dégâts.`,
    actionType: null,
  },
  {
    name: 'Instruction',
    description: `Quand vous utilisez l'action Attaquer, vous pouvez renoncer à une de vos attaques et, par une action bonus, désigner un allié qui peut vous voir ou vous entendre, en dépensant un dé de supériorité. Cet allié peut utiliser immédiatement sa réaction pour faire une attaque avec une arme, en ajoutant le dé aux dégâts.`,
    actionType: 'bonus_action',
  },
  {
    name: 'Jeu de jambes défensif',
    description: `Quand vous vous déplacez, vous pouvez dépenser un dé de supériorité, le lancer et ajouter le résultat à votre CA jusqu'à la fin de ce déplacement.`,
    actionType: null,
  },
  {
    name: 'Manœuvre tactique',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. Un allié qui peut vous voir ou vous entendre peut alors utiliser sa réaction pour se déplacer de la moitié de sa vitesse sans provoquer d'attaque d'opportunité de la part de la cible.`,
    actionType: null,
  },
  {
    name: 'Parade',
    description: `Quand une créature vous touche avec une attaque de corps à corps, vous pouvez utiliser votre réaction et dépenser un dé de supériorité pour réduire les dégâts du résultat du dé, plus votre modificateur de Dextérité.`,
    actionType: 'reaction',
  },
  {
    name: 'Provocation',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. La cible fait un jet de sauvegarde de Sagesse ; en cas d'échec, elle a le désavantage à ses jets d'attaque contre toute cible autre que vous jusqu'à la fin de votre prochain tour.`,
    actionType: null,
  },
  {
    name: 'Regain',
    description: `Par une action bonus à votre tour, vous pouvez dépenser un dé de supériorité pour un allié qui peut vous voir ou vous entendre. Il gagne des points de vie temporaires égaux au résultat du dé, plus votre modificateur de Charisme.`,
    actionType: 'bonus_action',
  },
  {
    name: 'Repousser',
    description: `Quand vous touchez une créature avec une attaque d'arme, vous pouvez dépenser un dé de supériorité et l'ajouter aux dégâts. Si la cible est de taille G ou inférieure, elle fait un jet de sauvegarde de Force ; en cas d'échec, vous la repoussez jusqu'à 4,50 m de vous.`,
    actionType: null,
  },
  {
    name: 'Riposte',
    description: `Quand une créature vous rate avec une attaque de corps à corps, vous pouvez utiliser votre réaction et dépenser un dé de supériorité pour l'attaquer en retour avec une arme de corps à corps. Si vous touchez, ajoutez le dé aux dégâts.`,
    actionType: 'reaction',
  },
]

// Options de manœuvre : jamais attribuées d'office (leur tag les exclut de la matérialisation passive), seulement si choisies.
export const maneuverFeatures: FeatureDef[] = MANEUVERS.map(m => ({
  name: m.name,
  description: m.description,
  featureType: 'subclass_feature',
  levelRequired: 3,
  actionType: m.actionType,
  rechargeType: null,
  maxUsesFormula: null,
  tag: 'maneuver',
  effects: [],
  meta: { cost: { resource: 'superiority_dice', amount: 1 } },
}))

import { fixed, lookup, variable, add, mul, max } from '~~/shared/utils/formula'

// ─── Pact Magic slot tables (PHB 5e) ──────────────────────────────────────────
// Index = class_level - 1 (levels 1–20)

const pactMagicSlotCount = lookup([1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4])
const pactMagicSlotLevel = lookup([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5])

// Invocations known by class level
const invocationsKnown = lookup([0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8])

// ─── Warlock base class features ──────────────────────────────────────────────

export const warlockFeatures = [
  {
    name: 'Magie du Pacte',
    description: `Votre recherche ésotérique et les sorts que votre patron vous a accordés vous ont fourni des installations permettant d'utiliser des sorts. Vous pouvez lancer n'importe quel sort d'occultiste que vous connaissez comme rituel si ce sort possède la caractéristique rituel.

Emplacements de sorts : vos emplacements de sorts de Magie du Pacte se rechargent lors d'un repos court ou long. Le niveau et le nombre d'emplacements disponibles dépend de votre niveau d'occultiste.`,
    featureType: 'class_feature' as const,
    levelRequired: 1,
    rechargeType: 'short_rest' as const,
    // maxUsesFormula represents the number of pact magic slots (slot level is a separate concern)
    maxUsesFormula: pactMagicSlotCount,
    actionType: null,
    // Store slot level in effects for display purposes
    effects: [],
    meta: { slotLevelFormula: pactMagicSlotLevel },
  },
  {
    name: 'Invocations occultes',
    description: `À force d'étudier des textes occultes interdits, vous avez débloqué des invocations occultes, des fragments de savoir interdit qui vous imprègnent d'une aptitude magique permanente. Vous gagnez deux invocations occultes de votre choix. Vos options d'invocations sont détaillées à la fin de la description de cette classe. Quand vous gagnez un niveau d'occultiste, vous pouvez remplacer une invocation occulte que vous connaissez par une autre que vous pouvez apprendre à ce niveau.`,
    featureType: 'class_feature' as const,
    levelRequired: 2,
    maxUsesFormula: invocationsKnown,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
  {
    name: 'Faveur du Pacte',
    description: `Au 3e niveau, votre patron vous octroie un don pour vos services loyaux. Vous recevez l'une des caractéristiques suivantes de votre choix.

**Pacte de la Chaîne** : Vous apprenez le sort Appel de familier et pouvez le lancer en tant que rituel. Ce sort n'est pas comptabilisé dans le nombre de vos sorts d'occultiste connus. Quand vous lancez ce sort, vous pouvez choisir une forme standard pour votre familier ou une forme spéciale : diablotin, pseudodragon, quasit ou lutin. De plus, quand vous effectuez l'action Attaquer, vous pouvez renoncer à l'une de vos attaques pour permettre à votre familier d'effectuer une attaque de son choix avec sa réaction.

**Pacte de la Lame** : Vous pouvez utiliser votre action pour créer une arme de pacte dans votre main vide. Vous choisissez la forme que prend cette arme de corps à corps chaque fois que vous la créez. Vous possédez la maîtrise de cette arme pendant que vous la tenez. Cette arme est considérée comme magique pour les besoins de vaincre la résistance aux dégâts non magiques.

**Pacte du Tome** : Votre patron vous donne un grimoire appelé Livre des Ombres. Quand vous gagnez ce don, choisissez trois sorts mineurs dans la liste de sorts de n'importe quelle classe. Tant que vous avez ce livre en votre possession, vous pouvez lancer ces sorts mineurs à volonté.`,
    featureType: 'class_feature' as const,
    levelRequired: 3,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
  {
    name: 'Amélioration de caractéristique',
    description: `Quand vous atteignez le niveau 4 (et à nouveau aux niveaux 8, 12, 16 et 19), vous pouvez augmenter la valeur de votre choix de caractéristique de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 en utilisant cette aptitude.`,
    featureType: 'class_feature' as const,
    levelRequired: 4,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
  {
    name: 'Mysticisme sombre',
    description: `À partir du niveau 2, quand vous lancez un sort d'occultiste, vous pouvez le lancer en secret si vous êtes capable de parler et d'utiliser des composantes somatiques. Les créatures qui ne vous voient pas lancer le sort ne peuvent pas déterminer que vous lancez un sort.`,
    featureType: 'class_feature' as const,
    levelRequired: 2,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
]

// ─── Grand Ancien subclass features ───────────────────────────────────────────

export const grandAncienFeatures = [
  {
    name: 'Sorts étendus',
    description: `Le Grand Ancien vous permet d'apprendre certains sorts supplémentaires lorsque vous atteignez certains niveaux d'occultiste. Ces sorts comptent pour vous comme des sorts d'occultiste mais n'entrent pas dans le nombre de sorts d'occultiste que vous connaissez.

Niveaux 1-2 : Sommeil, Charme-personne
Niveaux 3-4 : Détection des pensées, Fantasme
Niveaux 5-6 : Communication avec les morts, Vol
Niveaux 7-8 : Invisibilité suprême, Terrain hallucinatoire
Niveaux 9-10 : Domination de monstre, Contacter un autre plan`,
    featureType: 'subclass_feature' as const,
    levelRequired: 1,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
  {
    name: 'Contact du Grand Ancien',
    description: `À partir du niveau 1, vous pouvez communiquer par télépathie avec n'importe quelle créature que vous voyez dans un rayon de 18 mètres. Vous n'avez pas besoin de partager une langue avec la créature, mais elle doit être capable de comprendre au moins une langue. Une créature peut choisir de bloquer cette communication télépathique.`,
    featureType: 'subclass_feature' as const,
    levelRequired: 1,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [],
  },
  {
    name: 'Bouclier psychique',
    description: `À partir du niveau 6, vous pouvez protéger vous-même ou un allié des dégâts d'une attaque. Quand vous ou une créature dans un rayon de 18 mètres de vous que vous pouvez voir est ciblée par une attaque, vous pouvez utiliser votre réaction pour imposer un désavantage au jet d'attaque. Si l'attaque rate, vous avez l'avantage sur le prochain jet d'attaque contre l'attaquant, à condition de l'effectuer avant la fin de votre prochain tour.`,
    featureType: 'subclass_feature' as const,
    levelRequired: 6,
    maxUsesFormula: fixed(1),
    actionType: 'reaction' as const,
    rechargeType: 'long_rest' as const,
    effects: [],
  },
  {
    name: 'Voile de la pensée',
    description: `À partir du niveau 10, votre esprit ne peut pas être lu à moins que vous ne le permettiez. Vous bénéficiez de la résistance aux dégâts psychiques, et chaque fois qu'une créature vous inflige des dégâts psychiques, elle subit le même montant de dégâts psychiques.`,
    featureType: 'subclass_feature' as const,
    levelRequired: 10,
    maxUsesFormula: null,
    actionType: null,
    rechargeType: null,
    effects: [
      { type: 'damage_resistance', value: { damageType: 'psychic' } },
    ],
  },
]

export const warlockSubclassName = 'Grand Ancien'
export const warlockClassName = 'Occultiste'

import type { SubclassDef } from '../lib/seedClass'
import type { Effect } from '../../schema/effects'

export const warlockSubclasses: SubclassDef[] = [
  {
    name: 'Grand Ancien',
    description: `Votre patron est un être d'une puissance et d'une intelligence insondables, qui réside dans les recoins les plus lointains du multivers. Les motivations de cet être sont incompréhensibles pour les mortels.`,
    features: grandAncienFeatures.map(f => ({
      ...f,
      effects: (f.effects ?? []) as Effect[],
    })),
  },
  {
    name: 'Le Fiélon',
    description: `Vous avez conclu un pacte avec un fiélon des plans inférieurs, un être dont les objectifs sont maléfiques, même si vous vous efforcez de l'opposer à ses fins.`,
    features: [
      {
        name: 'Liste de sorts étendus',
        description: `Le Fiélon vous permet d'apprendre certains sorts supplémentaires :

Niveaux 1-2 : Injonction, Mains brûlantes
Niveaux 3-4 : Cécité/Surdité, Rayon ardent
Niveaux 5-6 : Boule de feu, Nuage nauséabond
Niveaux 7-8 : Bouclier de feu, Mur de feu
Niveaux 9-10 : Colonne de flamme, Sanctification`,
        featureType: 'subclass_feature' as const,
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Bénédiction du sombre maître',
        description: `À partir du niveau 1, lorsque vous réduisez une créature hostile à 0 point de vie, vous gagnez un nombre de points de vie temporaires égal à votre modificateur de Charisme + votre niveau d'occultiste (minimum 1).`,
        featureType: 'subclass_feature' as const,
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Chance du ténébreux',
        description: `À partir du niveau 6, quand vous effectuez un jet de caractéristique ou un jet de sauvegarde, vous pouvez utiliser cette aptitude pour ajouter un d10 à votre jet (après avoir vu le résultat mais avant tout effet). Utilisable une fois par repos court ou long.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 6,
        actionType: null,
        rechargeType: 'short_rest' as const,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Résistance fiélonne',
        description: `À partir du niveau 10, après un repos court ou long, choisissez un type de dégâts : vous y êtes résistant jusqu'au prochain repos. Les dégâts d'armes magiques ou en argent ignorent cette résistance.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 10,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Traversée des enfers',
        description: `À partir du niveau 14, en action, touchez une créature et envoyez-la dans les Enfers. La cible doit réussir un jet de sauvegarde de Charisme ou être téléportée dans un plan infernal. Elle revient au début de votre prochain tour, subissant 10d10 dégâts psychiques. Utilisable une fois par repos long.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 14,
        actionType: 'action' as const,
        rechargeType: 'long_rest' as const,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
  {
    name: 'L\'Archifée',
    description: `Votre patron est un seigneur ou une dame des fées, une créature de légende dont le pouvoir rivalise avec celui des dieux.`,
    features: [
      {
        name: 'Liste de sorts étendus',
        description: `L'Archifée vous permet d'apprendre certains sorts supplémentaires :

Niveaux 1-2 : Lueurs féeriques, Sommeil
Niveaux 3-4 : Apaisement des émotions, Force fantasmagorique
Niveaux 5-6 : Clignotement, Croissance végétale
Niveaux 7-8 : Domination de bête, Invisibilité supérieure
Niveaux 9-10 : Apparence trompeuse, Domination de personne`,
        featureType: 'subclass_feature' as const,
        levelRequired: 1,
        actionType: null,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Présence féerique',
        description: `À partir du niveau 1, en action, toute créature dans un cube de 3 mètres prenant origine à partir de vous doit réussir un jet de sauvegarde de Sagesse ou être charmée ou effrayée (votre choix) jusqu'à la fin de votre prochain tour. Utilisable une fois par repos court ou long.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 1,
        actionType: 'action' as const,
        rechargeType: 'short_rest' as const,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Pas illusoire',
        description: `À partir du niveau 6, quand vous subissez des dégâts, réaction pour devenir invisible et vous téléporter jusqu'à 18 mètres vers un espace inoccupé visible. Vous restez invisible jusqu'au début de votre prochain tour ou jusqu'à ce que vous attaquiez ou lanciez un sort. Utilisable une fois par repos court ou long.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 6,
        actionType: 'reaction' as const,
        rechargeType: 'short_rest' as const,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Protection contre les charmes',
        description: `À partir du niveau 10, vous êtes immunisé à la condition charmé. Quand une créature tente de vous charmer, réaction pour retourner l'effet : elle doit réussir un jet de sauvegarde de Sagesse ou être charmée par vous pendant 1 minute.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 10,
        actionType: 'reaction' as const,
        rechargeType: null,
        maxUsesFormula: null,
        effects: [],
      },
      {
        name: 'Forme sombre',
        description: `À partir du niveau 14, en action, vous prenez une forme terrifiante pendant 1 minute (concentration). Action bonus à chaque tour pour charmer ou effrayer une créature à 18 mètres (jet de sauvegarde de Sagesse). Celles déjà charmées ou effrayées subissent 8d6 dégâts psychiques en cas d'échec. Utilisable une fois par repos long.`,
        featureType: 'subclass_feature' as const,
        levelRequired: 14,
        actionType: 'action' as const,
        rechargeType: 'long_rest' as const,
        maxUsesFormula: null,
        effects: [],
      },
    ],
  },
]

// Helper: build the context for formula evaluation at a given class level
export const buildFormulaContext = (classLevel: number, totalLevel: number, abilityMods: Record<string, number>, profBonus: number) => ({
  level: totalLevel,
  class_level: classLevel,
  prof_bonus: profBonus,
  str_mod: abilityMods.str ?? 0,
  dex_mod: abilityMods.dex ?? 0,
  con_mod: abilityMods.con ?? 0,
  int_mod: abilityMods.int ?? 0,
  wis_mod: abilityMods.wis ?? 0,
  cha_mod: abilityMods.cha ?? 0,
})

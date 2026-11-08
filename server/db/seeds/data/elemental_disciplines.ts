import type { Formula } from '~~/shared/utils/formula'
import type { FeatureDef } from '../lib/seedClass'

// Données de la Voie des quatre éléments sans import de valeur : le script qui écrit la migration 0158 les charge telles quelles.

// Index = niveau de moine - 1. Disciplines choisies en plus de Lien élémentaire : une au niveau 3, puis une aux niveaux 6, 11 et 17.
export const ELEMENTAL_DISCIPLINES_KNOWN: Formula = { op: 'lookup', table: [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4] }

export const DISCIPLE_DESCRIPTION = `Au niveau 3, vous apprenez des disciplines élémentaires qui puisent dans votre ki. Chaque utilisation d'une discipline dépense des points de ki.

**Disciplines :** vous connaissez Lien élémentaire et une autre discipline de votre choix, et en apprenez une de plus aux niveaux 6, 11 et 17. Chaque fois que vous en apprenez une nouvelle, vous pouvez aussi en remplacer une que vous connaissez par une autre. Certaines disciplines exigent un niveau de moine minimum.

**Lien élémentaire :** en action, vous maîtrisez brièvement les forces élémentaires dans un rayon de 9 mètres. Choisissez un effet : un effet sensoriel inoffensif et instantané lié à l'air, à la terre, au feu ou à l'eau ; allumer ou éteindre instantanément une bougie, une torche ou un petit feu de camp ; refroidir ou réchauffer jusqu'à 500 g de matière non vivante pendant 1 heure ; modeler du feu, de la terre, de l'eau ou de la brume (un cube de 30 cm d'arête au plus) en une forme grossière pendant 1 minute.

**Lancer un sort élémentaire :** une discipline qui lance un sort utilise son temps d'incantation et ses règles, sans composantes matérielles. À partir du niveau 5, vous pouvez dépenser des points de ki supplémentaires : chacun augmente le niveau du sort d'un cran, si le sort gagne à être lancé plus haut. Le total de points de ki d'un sort (coût de la discipline compris) ne peut dépasser 3 aux niveaux 5 à 8, 4 aux niveaux 9 à 12, 5 aux niveaux 13 à 16 et 6 aux niveaux 17 à 20.`

interface DisciplineDef {
  name: string
  description: string
  kiCost: number
  // Niveau de moine exigé ; la sous-classe s'ouvre au niveau 3, qui vaut donc « aucun prérequis ».
  levelRequired: number
  actionType: 'action' | null
}

const castSpell = (spell: string, self = false) => (kiCost: number) =>
  `Vous pouvez dépenser ${kiCost} points de ki pour ${self ? 'vous lancer' : 'lancer'} le sort ${spell}.`

const DISCIPLINES: DisciplineDef[] = [
  {
    name: 'Crochets du serpent de feu',
    description: `Quand vous faites l'action Attaquer, vous pouvez dépenser 1 point de ki pour envelopper vos poings et vos pieds de flammes. Votre allonge à mains nues augmente de 3 mètres pour cette action et le reste du tour. Chaque coup qui touche inflige des dégâts de feu au lieu de contondants, et si vous dépensez 1 point de ki de plus quand l'attaque touche, elle inflige 1d10 dégâts de feu supplémentaires.`,
    kiCost: 1,
    levelRequired: 3,
    actionType: null,
  },
  {
    name: 'Défense de la montagne éternelle',
    description: castSpell('peau de pierre', true)(5),
    kiCost: 5,
    levelRequired: 17,
    actionType: null,
  },
  {
    name: 'Destrier des vents',
    description: castSpell('vol', true)(4),
    kiCost: 4,
    levelRequired: 11,
    actionType: null,
  },
  {
    name: 'Étreinte du vent du nord',
    description: castSpell('immobilisation de personne')(3),
    kiCost: 3,
    levelRequired: 6,
    actionType: null,
  },
  {
    name: 'Façonnage de la rivière',
    description: `En action, vous dépensez 1 point de ki pour agir sur une zone d'eau ou de glace d'au plus 9 mètres de côté, à 36 mètres ou moins de vous. Vous pouvez changer l'eau en glace et inversement, remodeler la glace, élever ou abaisser son niveau, creuser ou combler une tranchée, ériger ou abattre un mur, ou créer un pilier. L'ampleur ne peut dépasser la moitié de la plus grande dimension de la zone (dans un carré de 9 mètres : un pilier jusqu'à 4,50 mètres, une tranchée de 4,50 mètres de profondeur). Vous ne pouvez pas piéger ni emprisonner une créature, et aucun jet de sauvegarde n'est prévu.`,
    kiCost: 1,
    levelRequired: 3,
    actionType: 'action',
  },
  {
    name: 'Flammes du phénix',
    description: castSpell('boule de feu')(4),
    kiCost: 4,
    levelRequired: 11,
    actionType: null,
  },
  {
    name: 'Fouet de l\'onde',
    description: `En action, vous dépensez 2 points de ki : une créature visible à 9 mètres ou moins doit réussir un jet de sauvegarde de Dextérité (DD de ki). En cas d'échec, elle subit 3d10 dégâts contondants, plus 1d10 par point de ki supplémentaire dépensé, et vous pouvez la jeter à terre ou la tirer de 7,50 mètres vers vous. En cas de réussite, elle subit la moitié des dégâts et n'est ni tirée ni jetée à terre.`,
    kiCost: 2,
    levelRequired: 3,
    actionType: 'action',
  },
  {
    name: 'Frappe de cendres',
    description: castSpell('mains brûlantes')(2),
    kiCost: 2,
    levelRequired: 3,
    actionType: null,
  },
  {
    name: 'Gong du sommet',
    description: castSpell('fracassement')(3),
    kiCost: 3,
    levelRequired: 6,
    actionType: null,
  },
  {
    name: 'Poing de l\'air',
    description: `En action, vous dépensez 2 points de ki : une créature à 9 mètres ou moins doit réussir un jet de sauvegarde de Force (DD de ki). En cas d'échec, elle subit 3d10 dégâts contondants, plus 1d10 par point de ki supplémentaire dépensé, est repoussée de 6 mètres et jetée à terre. En cas de réussite, elle subit la moitié des dégâts et n'est ni repoussée ni jetée à terre.`,
    kiCost: 2,
    levelRequired: 3,
    actionType: 'action',
  },
  {
    name: 'Poing des quatre tonnerres',
    description: castSpell('vague tonnante')(2),
    kiCost: 2,
    levelRequired: 3,
    actionType: null,
  },
  {
    name: 'Posture de brume',
    description: castSpell('forme gazeuse', true)(4),
    kiCost: 4,
    levelRequired: 11,
    actionType: null,
  },
  {
    name: 'Ruée des esprits du vent',
    description: castSpell('bourrasque')(2),
    kiCost: 2,
    levelRequired: 3,
    actionType: null,
  },
  {
    name: 'Souffle de l\'hiver',
    description: castSpell('cône de froid')(6),
    kiCost: 6,
    levelRequired: 17,
    actionType: null,
  },
  {
    name: 'Torrent de flammes voraces',
    description: castSpell('mur de feu')(5),
    kiCost: 5,
    levelRequired: 17,
    actionType: null,
  },
  {
    name: 'Vague de terre grondante',
    description: castSpell('mur de pierre')(6),
    kiCost: 6,
    levelRequired: 17,
    actionType: null,
  },
]

// Options de discipline : jamais attribuées d'office (leur tag les exclut de la matérialisation passive), seulement si choisies.
export const elementalDisciplineFeatures: FeatureDef[] = DISCIPLINES.map(d => ({
  name: d.name,
  description: d.description,
  featureType: 'subclass_feature',
  levelRequired: d.levelRequired,
  actionType: d.actionType,
  rechargeType: null,
  maxUsesFormula: null,
  tag: 'elemental_discipline',
  effects: [],
  meta: { cost: { resource: 'ki', amount: d.kiCost } },
}))

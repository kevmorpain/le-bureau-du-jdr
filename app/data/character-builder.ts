// Données riches D&D 5e (2014) pour le Character Builder.
// Ces données sont hardcodées côté frontend car la DB ne stocke pas
// les traits, bonus de carac., descriptions détaillées, etc.
// Voir docs/character-builder.md pour le contexte complet.

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
export type SpellcastingType = 'full' | 'half' | 'pact'

// ─── Constantes ────────────────────────────────────────────────────────────────

export const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// Langues D&D 5e disponibles pour les choix de langue
export const LANGUAGES = [
  'Abyssal', 'Céleste', 'Commun', 'Commun des profondeurs', 'Draconique',
  'Druidique', 'Elfique', 'Géant', 'Gnome', 'Gobelin', 'Halfelin',
  'Infernal', 'Nain', 'Orque', 'Primordial', 'Sylvain',
] as const

// Options génériques d'équipement → liste d'items spécifiques disponibles en DB
export const GENERIC_ITEM_OPTIONS: Record<string, string[]> = {
  'Arme courante': ['Gourdin', 'Dague', 'Grande massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Faucille', 'Lance', 'Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme courante de corps à corps': ['Gourdin', 'Dague', 'Grande massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Faucille', 'Lance'],
  'Arme courante à distance': ['Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme courante au choix': ['Gourdin', 'Dague', 'Grande massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Faucille', 'Lance', 'Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme de guerre': ["Hache d'armes", "Fléau d'armes", 'Glaive', 'Grande hache', 'Épée à deux mains', 'Hallebarde', 'Épée longue', 'Morgenstern', 'Fauchard', 'Épieu de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre', 'Arbalète à main', 'Arbalète lourde', 'Arc long'],
  'Arme de guerre de corps à corps': ["Hache d'armes", "Fléau d'armes", 'Glaive', 'Grande hache', 'Épée à deux mains', 'Hallebarde', 'Épée longue', 'Morgenstern', 'Fauchard', 'Épieu de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre'],
  'Arme de guerre au choix': ["Hache d'armes", "Fléau d'armes", 'Glaive', 'Grande hache', 'Épée à deux mains', 'Hallebarde', 'Épée longue', 'Morgenstern', 'Fauchard', 'Épieu de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre', 'Arbalète à main', 'Arbalète lourde', 'Arc long'],
  'Instrument de musique au choix': ['Cornemuse', 'Cor', 'Flûte', 'Luth', 'Lyre', 'Tambour', 'Viole'],
  'Outil d\'artisan au choix': ['Outils de forgeron', 'Outils de charpentier', 'Outils de cordonnier', 'Outils de cuisinier', 'Outils de graveur', 'Outils de joaillier', 'Outils de maçon', 'Outils de peintre', 'Outils de potier', 'Outils de tanneur', 'Outils de tisserand', 'Outils de tonnelier', 'Outils de verrier'],
  'Jeux au choix': ['Jeu de dés', "Jeu de cartes du Destin", "Jeu d'échecs de dragon"],
  'Un jeu au choix': ['Jeu de dés', "Jeu de cartes du Destin", "Jeu d'échecs de dragon"],
}

// Maîtrises d'outils avec choix : strings exacts utilisés dans BackgroundData.toolProficiencies → liste d'options
export const TOOL_CHOICE_MAP: Record<string, string[]> = {
  'Un jeu au choix': GENERIC_ITEM_OPTIONS['Un jeu au choix']!,
  'Outil d\'artisan au choix': GENERIC_ITEM_OPTIONS["Outil d'artisan au choix"]!,
  'Instrument de musique au choix': GENERIC_ITEM_OPTIONS['Instrument de musique au choix']!,
}

// Mapping French display → machine-readable keys (used for character_proficiency_overrides)
export const ARMOR_PROF_KEYS: Record<string, string> = {
  'Armures légères': 'light',
  'Armures légères (non-métalliques)': 'light',
  'Armures intermédiaires': 'medium',
  'Toutes les armures': 'all_armor',
  'Boucliers': 'shield',
  'Boucliers (non-métalliques)': 'shield',
}

export const WEAPON_PROF_KEYS: Record<string, string> = {
  'Armes courantes': 'simple_weapons',
  'Armes de guerre': 'martial_weapons',
  'Arbalète de poing': 'hand_crossbow',
  'Arbalète légère': 'light_crossbow',
  'Épée longue': 'longsword',
  'Rapière': 'rapier',
  'Épée courte': 'shortsword',
  'Arc long': 'longbow',
  'Arc court': 'shortbow',
}

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Force',
  dex: 'Dextérité',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Sagesse',
  cha: 'Charisme',
}

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: 'FOR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'SAG',
  cha: 'CHA',
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}

// ─── Compétences ───────────────────────────────────────────────────────────────

export interface SkillDef {
  key: string
  label: string
  ability: AbilityKey
}

export const SKILLS: SkillDef[] = [
  { key: 'acrobatics', label: 'Acrobaties', ability: 'dex' },
  { key: 'animalHandling', label: 'Dressage', ability: 'wis' },
  { key: 'arcana', label: 'Arcanes', ability: 'int' },
  { key: 'athletics', label: 'Athlétisme', ability: 'str' },
  { key: 'deception', label: 'Tromperie', ability: 'cha' },
  { key: 'history', label: 'Histoire', ability: 'int' },
  { key: 'insight', label: 'Perspicacité', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Médecine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Représentation', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Escamotage', ability: 'dex' },
  { key: 'stealth', label: 'Discrétion', ability: 'dex' },
  { key: 'survival', label: 'Survie', ability: 'wis' },
]

// ─── Types Races ───────────────────────────────────────────────────────────────

export interface SubraceData {
  id: string
  name: string
  dbName: string | null                  // nom exact dans character_species (null si absent de la DB)
  abilityBonuses: Partial<Record<AbilityKey, number>>
  speed?: number                          // en mètres, si différent de la race parente
  darkvision?: number                     // portée en mètres
  description: string
  traits: string[]
}

export interface RaceData {
  id: string
  name: string
  emoji: string
  dbName: string | null                  // nom exact dans character_species (null si virtual)
  description: string
  abilityBonuses: Partial<Record<AbilityKey, number>>
  speed: number                           // en mètres
  size: 'Petite' | 'Moyenne'
  darkvision?: number                     // portée en mètres
  traits: string[]
  languages: string[]
  subraces?: SubraceData[]
  // Cas spéciaux
  hasHalfElfBonuses?: boolean             // Demi-Elfe : +1+1 aux carac. hors CHA
  hasVariantOption?: boolean              // Humain : option variante disponible
  hasDragonAncestry?: boolean             // Drakéide : choix d'ascendance obligatoire
}

// ─── Races ─────────────────────────────────────────────────────────────────────

export const RACES: RaceData[] = [
  {
    id: 'human',
    name: 'Humain',
    emoji: '🧑',
    dbName: 'Humain',
    description: 'Adaptables et ambitieux, les humains sont les plus répandus dans les contrées civilisées. Ils excellent dans tous les domaines grâce à leur polyvalence incomparable.',
    abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 9,
    size: 'Moyenne',
    traits: [
      '+1 à toutes les caractéristiques',
      'Maîtrise d\'une compétence supplémentaire',
      'Langue supplémentaire au choix',
    ],
    languages: ['Commun', '+1 au choix'],
    hasVariantOption: true,
  },
  {
    id: 'elf',
    name: 'Elfe',
    emoji: '🧝',
    dbName: null,
    description: 'Grâcieux et longévifs, les elfes sont doués d\'une acuité sensorielle remarquable et d\'une résistance naturelle à la magie. Leur transe leur permet de méditer à la place de dormir.',
    abilityBonuses: { dex: 2 },
    speed: 9,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Dextérité',
      'Sens aiguisés (maîtrise Perception)',
      'Ascendance féérique (avantage contre charme, immunité sommeil magique)',
      'Transe (4h de méditation = 8h de sommeil)',
    ],
    languages: ['Commun', 'Elfique'],
    subraces: [
      {
        id: 'high-elf',
        name: 'Haut-Elfe',
        dbName: 'Haut-elfe',
        abilityBonuses: { dex: 2, int: 1 },
        darkvision: 18,
        description: 'Raffinés et lettrés, maîtres de la magie arcanique.',
        traits: [
          '+1 Intelligence',
          'Sort mineur de magicien au choix (INT)',
          'Langue supplémentaire',
          'Maîtrise : épée longue, rapière, arc court, arc long',
        ],
      },
      {
        id: 'wood-elf',
        name: 'Elfe des Bois',
        dbName: 'Elfe des bois',
        abilityBonuses: { dex: 2, wis: 1 },
        speed: 10.5,
        darkvision: 18,
        description: 'Furtifs et endurants, en harmonie avec la nature sauvage.',
        traits: [
          '+1 Sagesse',
          'Vitesse 10,5m',
          'Pas furtifs de la forêt (se cacher si légèrement obscurci)',
          'Maîtrise : épée longue, rapière, arc court, arc long',
        ],
      },
      {
        id: 'drow',
        name: 'Elfe Noir (Drow)',
        dbName: null, // Absent de la DB — sera mappé vers 'Elfe des bois' à la soumission
        abilityBonuses: { dex: 2, cha: 1 },
        darkvision: 36,
        description: 'Nés dans les Outreterre, ils portent la magie des profondeurs.',
        traits: [
          '+1 Charisme',
          'Vision supérieure 36m',
          'Sensibilité solaire (désavantage en pleine lumière)',
          'Magie innée : Lumières dansantes, Fée (1/jr), Ténèbres (1/jr)',
        ],
      },
    ],
  },
  {
    id: 'dwarf',
    name: 'Nain',
    emoji: '⛏️',
    dbName: null,
    description: 'Courageux et endurants, les nains sont réputés pour leur résistance au poison, leur expertise du travail de la pierre et leur ténacité au combat.',
    abilityBonuses: { con: 2 },
    speed: 7.5,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Constitution',
      'Vision dans le noir 18m',
      'Résistance naine (résistance poison, avantage JS contre poison)',
      'Entraînement martial nain (haches et marteaux)',
      'Connaissance de la pierre',
    ],
    languages: ['Commun', 'Nain'],
    subraces: [
      {
        id: 'mountain-dwarf',
        name: 'Nain des Montagnes',
        dbName: 'Nain des montagnes',
        abilityBonuses: { str: 2, con: 2 },
        darkvision: 18,
        description: 'Robustes guerriers des hauteurs, entraînés au port des armures.',
        traits: [
          '+2 Force (cumulatif avec +2 CON de la race)',
          'Maîtrise des armures légères et intermédiaires',
        ],
      },
      {
        id: 'hill-dwarf',
        name: 'Nain des Collines',
        dbName: 'Nain des collines',
        abilityBonuses: { con: 2, wis: 1 },
        darkvision: 18,
        description: 'Perspicaces et tenaces, dotés d\'une endurance légendaire.',
        traits: [
          '+1 Sagesse',
          'Robustesse naine : +1 PV max par niveau',
        ],
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfelin',
    emoji: '🍃',
    dbName: null,
    description: 'Chanceux par nature et remarquablement courageux, les halfelins défient les probabilités et s\'adaptent à toutes les situations avec une agilité surprenante.',
    abilityBonuses: { dex: 2 },
    speed: 7.5,
    size: 'Petite',
    traits: [
      '+2 Dextérité',
      'Chanceux (relancer un 1 sur d20)',
      'Courageux (avantage contre la peur)',
      'Agilité halfeline (traverser l\'espace d\'une créature plus grande)',
    ],
    languages: ['Commun', 'Halfelin'],
    subraces: [
      {
        id: 'lightfoot',
        name: 'Pied-Léger',
        dbName: 'Halfelin pied-léger',
        abilityBonuses: { dex: 2, cha: 1 },
        description: 'Naturellement furtifs, ils se fondent dans la foule.',
        traits: [
          '+1 Charisme',
          'Discrétion naturelle (se cacher derrière une créature Moyenne ou plus)',
        ],
      },
      {
        id: 'stout',
        name: 'Robuste',
        dbName: 'Halfelin robuste',
        abilityBonuses: { dex: 2, con: 1 },
        description: 'Résistants comme des nains, liés à eux depuis longtemps.',
        traits: [
          '+1 Constitution',
          'Résistance robuste (résistance poison, avantage JS contre poison)',
        ],
      },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    emoji: '🔩',
    dbName: null,
    description: 'Inventifs et curieux, les gnomes sont des créatures vives et enthousiastes dont la magie innée protège leur intellect contre les assauts de la magie.',
    abilityBonuses: { int: 2 },
    speed: 7.5,
    size: 'Petite',
    darkvision: 18,
    traits: [
      '+2 Intelligence',
      'Vision dans le noir 18m',
      'Ruse gnome (avantage JS INT/SAG/CHA contre la magie)',
    ],
    languages: ['Commun', 'Gnome'],
    subraces: [
      {
        id: 'rock-gnome',
        name: 'Gnome des Rochers',
        dbName: 'Gnome des rochers',
        abilityBonuses: { int: 2, con: 1 },
        darkvision: 18,
        description: 'Inventeurs-nés, passionnés par la mécanique et l\'artifice.',
        traits: [
          '+1 Constitution',
          'Connaissances en ingénierie (double maîtrise Histoire sur objets magiques/tech.)',
          'Bricoleur (construire de petits mécanismes avec outils de bricoleur)',
        ],
      },
      {
        id: 'forest-gnome',
        name: 'Gnome des Forêts',
        dbName: 'Gnome des forêts',
        abilityBonuses: { int: 2, dex: 1 },
        darkvision: 18,
        description: 'Discrets et en harmonie avec la faune des sous-bois.',
        traits: [
          '+1 Dextérité',
          'Magie innée des gnomes (sort Illusion mineure, INT)',
          'Communication avec les bêtes (petits animaux)',
        ],
      },
    ],
  },
  {
    id: 'half-elf',
    name: 'Demi-Elfe',
    emoji: '🌙',
    dbName: 'Demi-elfe',
    description: 'Vivant entre deux mondes, les demi-elfes combinent le charme elfique et l\'adaptabilité humaine. Ils reçoivent +2 CHA et +1 à deux caractéristiques au choix (hors CHA).',
    abilityBonuses: { cha: 2 }, // +1+1 au choix hors CHA géré séparément
    speed: 9,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Charisme',
      '+1 à deux caractéristiques au choix (hors Charisme)',
      'Vision dans le noir 18m',
      'Ascendance féérique (avantage contre charme, immunité sommeil magique)',
      'Polyvalence (2 maîtrises de compétences supplémentaires au choix)',
    ],
    languages: ['Commun', 'Elfique', '+1 au choix'],
    hasHalfElfBonuses: true,
  },
  {
    id: 'half-orc',
    name: 'Demi-Orc',
    emoji: '💪',
    dbName: 'Demi-orc',
    description: 'Forts et intimidants, les demi-orcs allient la brutalité orcique à la ténacité humaine. Redoutables au combat rapproché grâce à leur résistance implacable.',
    abilityBonuses: { str: 2, con: 1 },
    speed: 9,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Force, +1 Constitution',
      'Vision dans le noir 18m',
      'Menaçant (maîtrise Intimidation)',
      'Acharnement (1×/repos long : rester à 1 PV au lieu de tomber à 0)',
      'Sauvagerie (+1 dé de dégâts sur coup critique avec arme)',
    ],
    languages: ['Commun', 'Orc'],
  },
  {
    id: 'tiefling',
    name: 'Tieffelin',
    emoji: '😈',
    dbName: 'Tieffelin',
    description: 'Portant le sang infernal de leurs ancêtres diaboliques, les tiéflins font face au monde avec ruse et défi. Charismatiques, résistants au feu et dotés de magie innée.',
    abilityBonuses: { int: 1, cha: 2 },
    speed: 9,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Charisme, +1 Intelligence',
      'Vision dans le noir 18m',
      'Résistance infernale (résistance au feu)',
      'Ascendance infernale : Thaumaturgie (0), Représailles infernales (niv.3), Ténèbres (niv.5)',
    ],
    languages: ['Commun', 'Infernal'],
  },
  {
    id: 'dragonborn',
    name: 'Drakéide',
    emoji: '🐉',
    dbName: 'Drakéide',
    description: 'Descendants orgueilleux des dragons, les drakéides possèdent une arme de souffle dévastatrice et une résistance élémentaire innée selon leur ascendance draconique.',
    abilityBonuses: { str: 2, cha: 1 },
    speed: 9,
    size: 'Moyenne',
    traits: [
      '+2 Force, +1 Charisme',
      'Ascendance draconique (à choisir — détermine le souffle et la résistance)',
      'Arme de souffle (cône ou ligne, JS DEX ou CON, 2d6 dégâts)',
      'Résistance aux dégâts selon l\'ascendance',
    ],
    languages: ['Commun', 'Draconique'],
    hasDragonAncestry: true,
  },
]

// ─── Ascendance Draconique ──────────────────────────────────────────────────────

export interface DragonAncestryData {
  id: string
  name: string
  damage: string
  breathShape: string
  breathSave: 'DEX' | 'CON'
}

export const DRAGON_ANCESTRY: DragonAncestryData[] = [
  { id: 'black', name: 'Noir', damage: 'Acide', breathShape: 'Ligne 1,5×9m', breathSave: 'DEX' },
  { id: 'blue', name: 'Bleu', damage: 'Foudre', breathShape: 'Ligne 1,5×9m', breathSave: 'DEX' },
  { id: 'brass', name: 'Laiton', damage: 'Feu', breathShape: 'Ligne 1,5×9m', breathSave: 'DEX' },
  { id: 'bronze', name: 'Bronze', damage: 'Foudre', breathShape: 'Ligne 1,5×9m', breathSave: 'DEX' },
  { id: 'copper', name: 'Cuivre', damage: 'Acide', breathShape: 'Ligne 1,5×9m', breathSave: 'DEX' },
  { id: 'gold', name: 'Or', damage: 'Feu', breathShape: 'Cône 4,5m', breathSave: 'DEX' },
  { id: 'green', name: 'Vert', damage: 'Poison', breathShape: 'Cône 4,5m', breathSave: 'CON' },
  { id: 'red', name: 'Rouge', damage: 'Feu', breathShape: 'Cône 4,5m', breathSave: 'DEX' },
  { id: 'silver', name: 'Argent', damage: 'Froid', breathShape: 'Cône 4,5m', breathSave: 'CON' },
  { id: 'white', name: 'Blanc', damage: 'Froid', breathShape: 'Cône 4,5m', breathSave: 'CON' },
]

// ─── Types Classes ─────────────────────────────────────────────────────────────

export interface ClassFeature {
  name: string
  description: string
}

export interface SkillChoices {
  count: number
  from: string[] | 'all'
}

export interface SpellcastingInfo {
  ability: AbilityKey
  type: SpellcastingType
  startsAtLevel?: number              // Paladin/Rôdeur commencent niveau 2
}

export interface EquipmentGroup {
  choice: boolean
  options?: string[]
  items?: string[]
}

export interface LevelMilestones {
  [level: number]: string
}

export interface ClassData {
  id: string
  name: string
  dbName: string                      // nom exact dans la table classes
  emoji: string
  color: string                       // couleur hex pour les badges
  role: string
  description: string
  hitDie: number
  savingThrows: AbilityKey[]
  armorProficiencies: string[]
  weaponProficiencies: string[]
  skillChoices: SkillChoices
  spellcasting: SpellcastingInfo | null
  subclassLevel: number
  subclassLabel: string
  subclasses: string[]
  features: ClassFeature[]
  equipment: EquipmentGroup[]
  levelMilestones: LevelMilestones
}

// ─── Classes ───────────────────────────────────────────────────────────────────

export const CLASSES: ClassData[] = [
  {
    id: 'barbarian',
    name: 'Barbare',
    dbName: 'Barbare',
    emoji: '🪓',
    color: '#ef4444',
    role: 'Combattant',
    description: 'Puissance brute et rage primitive. Le barbare encaisse et inflige des dégâts considérables au corps à corps.',
    hitDie: 12,
    savingThrows: ['str', 'con'],
    armorProficiencies: ['Armures légères', 'Armures intermédiaires', 'Boucliers'],
    weaponProficiencies: ['Armes courantes', 'Armes de guerre'],
    skillChoices: { count: 2, from: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
    spellcasting: null,
    subclassLevel: 3,
    subclassLabel: 'Voie primitive',
    subclasses: ['Voie du berserker', 'Voie du guerrier totem'],
    features: [
      { name: 'Rage', description: 'Action bonus : entrez en rage — +2 dégâts FOR, résistance contondant/perçant/tranchant, avantage JS FOR. 2 utilisations / repos long.' },
      { name: 'Défense sans armure', description: 'CA = 10 + mod DEX + mod CON quand vous ne portez pas d\'armure.' },
    ],
    equipment: [
      { choice: true, options: ['Grande hache', '2 hachettes'] },
      { choice: true, options: ['Paquetage d\'exploration', 'Paquetage du voyageur'] },
      { choice: false, items: ['4 javelines'] },
    ],
    levelMilestones: { 2: 'Attaque téméraire', 3: 'Voie primitive', 4: 'ASI', 5: 'Attaque supplémentaire', 7: 'Instinct sauvage', 9: 'Critique brutal' },
  },
  {
    id: 'bard',
    name: 'Barde',
    dbName: 'Barde',
    emoji: '🎵',
    color: '#f59e0b',
    role: 'Soutien / Sorts',
    description: 'Artiste et magicien, le barde inspire ses alliés, manipule ses ennemis et lance des sorts puissants grâce à son charisme naturel.',
    hitDie: 8,
    savingThrows: ['dex', 'cha'],
    armorProficiencies: ['Armures légères'],
    weaponProficiencies: ['Armes courantes', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    skillChoices: { count: 3, from: 'all' },
    spellcasting: { ability: 'cha', type: 'full' },
    subclassLevel: 3,
    subclassLabel: 'Collège bardique',
    subclasses: ['Collège du savoir', 'Collège de la vaillance'],
    features: [
      { name: 'Incantation (CHA)', description: 'Lanceur de sorts complet. Connaît 4 sorts + 2 tours de magie au niv.1. 2 emplacements niv.1.' },
      { name: 'Inspiration bardique (d6)', description: 'Action bonus : accordez un d6 à un allié pour l\'ajouter à un jet d\'attaque, de compétence ou de sauvegarde.' },
    ],
    equipment: [
      { choice: true, options: ['Rapière', 'Épée longue', 'Arme courante au choix'] },
      { choice: true, options: ['Paquetage du diplomate', 'Paquetage du bateleur'] },
      { choice: true, options: ['Luth', 'Instrument de musique au choix'] },
      { choice: false, items: ['Armure de cuir', 'Dague'] },
    ],
    levelMilestones: { 3: 'Collège bardique', 4: 'ASI', 5: 'Source d\'inspiration', 6: 'Expertise', 10: 'Secrets magiques' },
  },
  {
    id: 'cleric',
    name: 'Clerc',
    dbName: 'Clerc',
    emoji: '✨',
    color: '#fbbf24',
    role: 'Soutien / Soins',
    description: 'Intermédiaire entre les mortels et les dieux, le clerc soigne, protège et frappe au nom de sa divinité grâce à sa sagesse divine.',
    hitDie: 8,
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['Armures légères', 'Armures intermédiaires', 'Boucliers'],
    weaponProficiencies: ['Armes courantes'],
    skillChoices: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
    spellcasting: { ability: 'wis', type: 'full' },
    subclassLevel: 1,
    subclassLabel: 'Domaine divin',
    subclasses: ['Domaine de la vie', 'Domaine de la lumière', 'Domaine du savoir', 'Domaine de la nature', 'Domaine de la duperie', 'Domaine de la tempête', 'Domaine de la guerre'],
    features: [
      { name: 'Incantation (SAG)', description: 'Lanceur complet. Prépare niv+mod SAG sorts/jour. Sorts de domaine toujours préparés.' },
      { name: 'Renvoi des morts-vivants', description: 'Action : morts-vivants visibles dans 9m — JS SAG ou renvoyés pendant 1 minute.' },
    ],
    equipment: [
      { choice: true, options: ['Masse d\'armes', 'Marteau de guerre (si maîtrisé)'] },
      { choice: true, options: ['Armure d\'écailles', 'Armure de cuir', 'Cotte de mailles (si maîtrisée)'] },
      { choice: true, options: ['Arbalète légère + 20 carreaux', 'Arme courante'] },
      { choice: false, items: ['Bouclier', 'Symbole sacré', 'Paquetage d\'ecclésiastique'] },
    ],
    levelMilestones: { 1: 'Domaine divin', 2: 'Intervention divine (canalisation)', 4: 'ASI', 5: 'Destruction des morts-vivants' },
  },
  {
    id: 'druid',
    name: 'Druide',
    dbName: 'Druide',
    emoji: '🌿',
    color: '#22c55e',
    role: 'Sorts / Métamorphose',
    description: 'Gardien de la nature et maître des métamorphoses, le druide tire sa magie des forces primordiales du monde naturel.',
    hitDie: 8,
    savingThrows: ['int', 'wis'],
    armorProficiencies: ['Armures légères', 'Armures intermédiaires', 'Boucliers (non-métalliques)'],
    weaponProficiencies: ['Gourdin', 'Dague', 'Fléchette', 'Javeline', 'Masse', 'Bâton', 'Cimeterre', 'Fronde', 'Lance'],
    skillChoices: { count: 2, from: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
    spellcasting: { ability: 'wis', type: 'full' },
    subclassLevel: 2,
    subclassLabel: 'Cercle druidique',
    subclasses: ['Cercle de la terre', 'Cercle de la lune'],
    features: [
      { name: 'Incantation (SAG)', description: 'Lanceur complet. Prépare ses sorts chaque jour. Parle le Druidique, langue secrète.' },
      { name: 'Forme sauvage (niv.2)', description: 'À partir du niv.2 : transformation en animal. 2 utilisations / repos court.' },
    ],
    equipment: [
      { choice: true, options: ['Bouclier de bois', 'Arme courante'] },
      { choice: true, options: ['Cimeterre', 'Arme de corps à corps courante'] },
      { choice: false, items: ['Armure de cuir', 'Paquetage d\'explorateur', 'Focalisateur druidique'] },
    ],
    levelMilestones: { 2: 'Cercle druidique + Forme sauvage', 4: 'ASI', 6: 'Forme sauvage améliorée', 18: 'Corps de la bête' },
  },
  {
    id: 'fighter',
    name: 'Guerrier',
    dbName: 'Guerrier',
    emoji: '⚔️',
    color: '#dc2626',
    role: 'Combattant',
    description: 'Maître des armes et armures, le guerrier est le combattant le plus polyvalent, capable de porter plus d\'attaques que quiconque.',
    hitDie: 10,
    savingThrows: ['str', 'con'],
    armorProficiencies: ['Toutes les armures', 'Boucliers'],
    weaponProficiencies: ['Armes courantes', 'Armes de guerre'],
    skillChoices: { count: 2, from: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
    spellcasting: null,
    subclassLevel: 3,
    subclassLabel: 'Archétype martial',
    subclasses: ['Champion', 'Maître de guerre', 'Chevalier occulte'],
    features: [
      { name: 'Style de combat', description: 'Archerie (+2 attaque à distance), Combat à 2 armes, Défense (+1 CA), Duel (+2 dégâts), Grande arme (relancer 1 ou 2), Protection (réaction).' },
      { name: 'Second souffle', description: 'Action bonus : récupérez 1d10 + niveau PV. 1 utilisation / repos court.' },
    ],
    equipment: [
      { choice: true, options: ['Cotte de mailles', 'Armure de cuir + arc long + 20 flèches'] },
      { choice: true, options: ['Arme de guerre + bouclier', '2 armes de guerre'] },
      { choice: true, options: ['Arbalète légère + 20 carreaux', '2 hachettes'] },
      { choice: true, options: ['Paquetage du donjon', 'Paquetage d\'explorateur'] },
    ],
    levelMilestones: { 3: 'Archétype martial', 4: 'ASI', 5: 'Attaque supplémentaire', 6: 'ASI', 9: 'Indomptable', 11: '3 attaques' },
  },
  {
    id: 'monk',
    name: 'Moine',
    dbName: 'Moine',
    emoji: '🥋',
    color: '#a78bfa',
    role: 'Mobilité / Dégâts',
    description: 'Artiste martial channelant le ki pour des prouesses physiques extraordinaires — vitesse, esquive et frappes dévastatrices.',
    hitDie: 8,
    savingThrows: ['str', 'dex'],
    armorProficiencies: [],
    weaponProficiencies: ['Armes courantes', 'Épée courte'],
    skillChoices: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
    spellcasting: null,
    subclassLevel: 3,
    subclassLabel: 'Tradition monastique',
    subclasses: ['Voie de la paume', 'Voie de l\'ombre', 'Voie des quatre éléments'],
    features: [
      { name: 'Arts martiaux', description: 'Attaques à mains nues/armes de moine avec DEX ou FOR, dégâts 1d4 (niv.1). Attaque bonus à mains nues après attaque d\'arme de moine.' },
      { name: 'Défense sans armure', description: 'CA = 10 + mod DEX + mod SAG sans armure ni bouclier.' },
    ],
    equipment: [
      { choice: true, options: ['Épée courte', 'Arme courante de corps à corps'] },
      { choice: true, options: ['Paquetage du donjon', 'Paquetage d\'explorateur'] },
      { choice: false, items: ['10 fléchettes'] },
    ],
    levelMilestones: { 2: 'Ki + Déplacement sans armure', 3: 'Tradition monastique', 4: 'ASI + Chute ralentie', 5: 'Attaque supplémentaire + Frappe étourdissante' },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    dbName: 'Paladin',
    emoji: '🛡️',
    color: '#eab308',
    role: 'Combattant / Soutien',
    description: 'Guerrier sacré lié par un serment solennel, le paladin combine force martiale et magie divine pour protéger les innocents.',
    hitDie: 10,
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['Toutes les armures', 'Boucliers'],
    weaponProficiencies: ['Armes courantes', 'Armes de guerre'],
    skillChoices: { count: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
    spellcasting: { ability: 'cha', type: 'half', startsAtLevel: 2 },
    subclassLevel: 3,
    subclassLabel: 'Serment sacré',
    subclasses: ['Serment de dévotion', 'Serment des anciens', 'Serment de vengeance'],
    features: [
      { name: 'Sens divin', description: 'Action : détectez fiélons, célestes et morts-vivants dans 18m. 1+mod CHA utilisations / repos long.' },
      { name: 'Imposition des mains', description: 'Réservoir = niveau×5 PV. Soignez par portions ou neutralisez maladies/poisons (5 PV).' },
    ],
    equipment: [
      { choice: true, options: ['Arme de guerre + bouclier', '2 armes de guerre'] },
      { choice: true, options: ['5 javelines', 'Arme courante de corps à corps'] },
      { choice: false, items: ['Cotte de mailles', 'Symbole sacré', 'Paquetage du prêtre'] },
    ],
    levelMilestones: { 2: 'Style de combat + Incantation + Châtiment divin', 3: 'Serment sacré', 4: 'ASI', 5: 'Attaque supplémentaire' },
  },
  {
    id: 'ranger',
    name: 'Rôdeur',
    dbName: 'Rôdeur',
    emoji: '🏹',
    color: '#34d399',
    role: 'Exploration / Combat',
    description: 'Guerrier des terres sauvages, expert du pistage et du combat naturel. Son ennemi juré et son compagnon animal le définissent.',
    hitDie: 10,
    savingThrows: ['str', 'dex'],
    armorProficiencies: ['Armures légères', 'Armures intermédiaires', 'Boucliers'],
    weaponProficiencies: ['Armes courantes', 'Armes de guerre'],
    skillChoices: { count: 3, from: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
    spellcasting: { ability: 'wis', type: 'half', startsAtLevel: 2 },
    subclassLevel: 3,
    subclassLabel: 'Archétype de rôdeur',
    subclasses: ['Chasseur', 'Maître des bêtes'],
    features: [
      { name: 'Ennemi juré', description: 'Choisissez un type d\'ennemi. Avantage aux vérifications pour le traquer et rappeler des infos à son sujet.' },
      { name: 'Explorateur-né', description: 'Choisissez un terrain. Nombreux avantages pour voyager et survivre dans ce milieu.' },
    ],
    equipment: [
      { choice: true, options: ['Armure d\'écailles', 'Armure de cuir'] },
      { choice: true, options: ['2 épées courtes', '2 armes courantes de corps à corps'] },
      { choice: false, items: ['Arc long', '20 flèches', 'Paquetage d\'explorateur'] },
    ],
    levelMilestones: { 2: 'Style de combat + Incantation', 3: 'Archétype de rôdeur + Vigilance primitive', 4: 'ASI', 5: 'Attaque supplémentaire' },
  },
  {
    id: 'rogue',
    name: 'Roublard',
    dbName: 'Roublard',
    emoji: '🗡️',
    color: '#71717a',
    role: 'Discret / Dégâts',
    description: 'Expert de la furtivité et du subterfuge, le roublard excelle à frapper là où ça fait mal grâce à son Attaque sournoise dévastatrice.',
    hitDie: 8,
    savingThrows: ['dex', 'int'],
    armorProficiencies: ['Armures légères'],
    weaponProficiencies: ['Armes courantes', 'Arbalète de poing', 'Épée longue', 'Rapière', 'Épée courte'],
    skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'] },
    spellcasting: null,
    subclassLevel: 3,
    subclassLabel: 'Archétype de roublard',
    subclasses: ['Voleur', 'Assassin', 'Escroc arcanique'],
    features: [
      { name: 'Expertise', description: 'Doublez le bonus de maîtrise pour 2 compétences (parmi maîtrisées). Outils de voleur inclus.' },
      { name: 'Attaque sournoise (1d6)', description: '+1d6 dégâts si avantage OU allié adjacent sans désavantage. Armes de finesse ou à distance.' },
    ],
    equipment: [
      { choice: true, options: ['Rapière', 'Épée courte'] },
      { choice: true, options: ['Arc court + 20 flèches', '2 épées courtes'] },
      { choice: true, options: ['Paquetage du cambrioleur', 'Paquetage du donjon', 'Paquetage d\'explorateur'] },
      { choice: false, items: ['Armure de cuir', '2 dagues', 'Outils de voleur'] },
    ],
    levelMilestones: { 3: 'Archétype de roublard', 4: 'ASI', 5: 'Attaque sournoise 3d6 + Pas d\'esquive', 7: 'Esquive totale' },
  },
  {
    id: 'sorcerer',
    name: 'Ensorceleur',
    dbName: 'Ensorceleur',
    emoji: '✨',
    color: '#f97316',
    role: 'Incantateur',
    description: 'Magie innée jaillissant du sang ou de l\'âme. L\'ensorceleur façonne les sorts avec une flexibilité unique grâce aux Métamagie.',
    hitDie: 6,
    savingThrows: ['con', 'cha'],
    armorProficiencies: [],
    weaponProficiencies: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    skillChoices: { count: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
    spellcasting: { ability: 'cha', type: 'full' },
    subclassLevel: 1,
    subclassLabel: 'Origine magique',
    subclasses: ['Lignée draconique', 'Magie sauvage'],
    features: [
      { name: 'Origine magique', description: 'Votre magie innée vient d\'une source précise qui confère des pouvoirs dès le niveau 1.' },
      { name: 'Incantation (CHA)', description: 'Lanceur complet. Connaît un nombre limité de sorts (4 au niv.1). 2 emplacements niv.1.' },
    ],
    equipment: [
      { choice: true, options: ['Arbalète légère + 20 carreaux', 'Arme courante'] },
      { choice: true, options: ['Sacoche à composantes', 'Focalisateur arcanique'] },
      { choice: false, items: ['2 dagues', 'Paquetage du donjon'] },
    ],
    levelMilestones: { 1: 'Origine sorcière', 2: 'Points de sorcellerie + Métamagie', 4: 'ASI', 6: 'Capacités d\'origine' },
  },
  {
    id: 'warlock',
    name: 'Occultiste',
    dbName: 'Occultiste',
    emoji: '🌑',
    color: '#7c3aed',
    role: 'Pacte / Sorts',
    description: 'Pouvoirs obtenus par un pacte avec une entité puissante. Peu de sorts mais récupérés à chaque repos court — une magie explosive et unique.',
    hitDie: 8,
    savingThrows: ['wis', 'cha'],
    armorProficiencies: ['Armures légères'],
    weaponProficiencies: ['Armes courantes'],
    skillChoices: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
    spellcasting: { ability: 'cha', type: 'pact' },
    subclassLevel: 1,
    subclassLabel: 'Patron d\'Outremonde',
    subclasses: ['Le Fiélon', 'Le Grand Ancien', 'L\'Archifée'],
    features: [
      { name: 'Patron d\'Outremonde', description: 'Choisissez votre patron : il vous accorde des capacités supplémentaires et des sorts étendus.' },
      { name: 'Magie de pacte', description: '1 emplacement / repos court au niv.1. L\'emplacement récupère au repos court !' },
    ],
    equipment: [
      { choice: true, options: ['Arbalète légère + 20 carreaux', 'Arme courante'] },
      { choice: true, options: ['Sacoche à composantes', 'Focalisateur arcanique'] },
      { choice: false, items: ['Armure de cuir', 'Arme courante', '2 dagues', 'Paquetage du donjon'] },
    ],
    levelMilestones: {
      1: 'Patron d\'Outremonde',
      2: 'Manifestations occultes',
      3: 'Faveur de pacte',
      4: 'ASI',
      5: 'Empl. niv.3 + 3e manifestation',
      6: 'Aptitude de patron',
      7: 'Empl. niv.4 + 4e manifestation',
      8: 'ASI',
      9: 'Empl. niv.5 + 5e manifestation',
      10: 'Aptitude de patron',
      11: 'Arcanum mystique (niv. 6)',
      12: 'ASI + 6e manifestation',
      13: 'Arcanum mystique (niv. 7)',
      14: 'Aptitude de patron',
    },
  },
  {
    id: 'wizard',
    name: 'Magicien',
    dbName: 'Magicien',
    emoji: '📚',
    color: '#60a5fa',
    role: 'Incantateur',
    description: 'Érudit de la magie arcanique dont le grimoire lui permet d\'apprendre et de préparer un vaste répertoire de sorts — le maître incontesté de la magie.',
    hitDie: 6,
    savingThrows: ['int', 'wis'],
    armorProficiencies: [],
    weaponProficiencies: ['Dague', 'Fléchette', 'Fronde', 'Bâton', 'Arbalète légère'],
    skillChoices: { count: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
    spellcasting: { ability: 'int', type: 'full' },
    subclassLevel: 2,
    subclassLabel: 'Tradition arcanique',
    subclasses: ['École d\'abjuration', 'École d\'invocation', 'École de divination', 'École d\'enchantement', 'École d\'évocation', 'École d\'illusion', 'École de nécromancie', 'École de transmutation'],
    features: [
      { name: 'Incantation (INT)', description: 'Grimoire : 6 sorts niv.1 + 2 tours de magie. Prépare niv+mod INT sorts/jour. 2 emplacements niv.1.' },
      { name: 'Restauration arcanique', description: 'Repos court : récupérez emplacements (total ≤ ½ niveau arrondi sup, pas niv.6+). 1×/jour.' },
    ],
    equipment: [
      { choice: true, options: ['Bâton', 'Dague'] },
      { choice: true, options: ['Sacoche à composantes', 'Focalisateur arcanique'] },
      { choice: false, items: ['Grimoire', 'Paquetage du savant'] },
    ],
    levelMilestones: { 2: 'Tradition arcanique', 4: 'ASI', 6: 'Capacité de tradition', 14: 'Maîtrise du grimoire' },
  },
]

// ─── Styles de combat ─────────────────────────────────────────────────────────

export const FIGHTING_STYLES: Record<string, string[]> = {
  fighter: ['Archerie', 'Combat à deux armes', 'Défense', 'Duel', 'Grande arme', 'Protection'],
  paladin: ['Défense', 'Duel', 'Grande arme', 'Protection'],
  ranger: ['Archerie', 'Combat à deux armes', 'Défense'],
}

export const FIGHTING_STYLE_DESCRIPTIONS: Record<string, string> = {
  'Archerie': '+2 aux jets d\'attaque avec les armes à distance.',
  'Combat à deux armes': 'Ajoutez votre modificateur de caractéristique aux dégâts de la seconde attaque avec une arme légère.',
  'Défense': '+1 à la CA quand vous portez une armure.',
  'Duel': '+2 aux dégâts avec une arme à une main, sans autre arme tenue.',
  'Grande arme': 'Relancez un 1 ou 2 sur les dés de dégâts d\'une arme à deux mains ou polyvalente.',
  'Protection': 'Réaction : imposez le désavantage à une attaque contre un allié adjacent (bouclier requis).',
}

// ─── Alignements ──────────────────────────────────────────────────────────────

export interface AlignmentData {
  id: string
  short: string
  name: string
  description: string
}

export const ALIGNMENTS: AlignmentData[] = [
  { id: 'lg', short: 'LB', name: 'Loyal Bon', description: 'Suit les règles avec compassion.' },
  { id: 'ng', short: 'NB', name: 'Neutre Bon', description: 'Fait le bien selon sa conscience.' },
  { id: 'cg', short: 'CB', name: 'Chaotique Bon', description: 'Fait le bien, peu importe les règles.' },
  { id: 'ln', short: 'LN', name: 'Loyal Neutre', description: 'Respecte l\'ordre avant tout.' },
  { id: 'n', short: 'N', name: 'Neutre', description: 'Équilibre et pragmatisme.' },
  { id: 'cn', short: 'CN', name: 'Chaotique Neutre', description: 'Liberté absolue, sans morale fixe.' },
  { id: 'le', short: 'LM', name: 'Loyal Mauvais', description: 'Pouvoir et règles au service du mal.' },
  { id: 'ne', short: 'NM', name: 'Neutre Mauvais', description: 'Sert ses seuls intérêts.' },
  { id: 'ce', short: 'CM', name: 'Chaotique Mauvais', description: 'Violence et caprice sans limite.' },
]

// ─── Historiques ───────────────────────────────────────────────────────────────

export interface BackgroundSuggestions {
  personality: string[]
  ideals: string[]
  bonds: string[]
  flaws: string[]
}

export interface BackgroundData {
  id: string
  dbName: string | null
  name: string
  description: string
  skillProficiencies: string[]
  toolProficiencies: string[]
  languages: number
  equipment: string[]
  featureName: string
  featureDescription: string
  suggestions: BackgroundSuggestions
}

export const BACKGROUNDS: BackgroundData[] = [
  {
    id: 'acolyte',
    dbName: 'Acolyte',
    name: 'Acolyte',
    description: 'Serviteur dévoué d\'un temple ou d\'un dieu.',
    skillProficiencies: ['insight', 'religion'],
    toolProficiencies: [],
    languages: 2,
    equipment: ['Symbole sacré', 'Livre de prières', '5 bâtonnets d\'encens', 'Vêtements de cérémonie', '15 po'],
    featureName: 'Abri des fidèles',
    featureDescription: 'Logement, nourriture et soins dans les temples de votre foi. Les prêtres sont des alliés.',
    suggestions: {
      personality: ['Je m\'isole dans la contemplation et la prière.', 'Je vois des présages dans tous les événements.'],
      ideals: ['Foi. Je fais confiance à ma divinité pour guider mes actions.', 'Charité. J\'aide toujours ceux dans le besoin.'],
      bonds: ['Je mourrai pour récupérer une relique sacrée perdue.', 'Je cherche à découvrir la vérité sur ma foi.'],
      flaws: ['Je suis inflexible dans mes croyances.', 'Je suis suspicieux envers les étrangers.'],
    },
  },
  {
    id: 'charlatan',
    dbName: 'Charlatan',
    name: 'Charlatan',
    description: 'Escroc habile, maître du mensonge et des fausses identités.',
    skillProficiencies: ['deception', 'sleightOfHand'],
    toolProficiencies: ['Kit de déguisement', 'Outils de faussaire'],
    languages: 0,
    equipment: ['Vêtements fins', 'Kit de déguisement', 'Outils de faussaire', '15 po'],
    featureName: 'Fausse identité',
    featureDescription: 'Vous disposez d\'une seconde identité avec documents, vêtements et contacts.',
    suggestions: {
      personality: ['Je mens par habitude, même quand ce n\'est pas nécessaire.', 'Je suis confiant et les gens me font naturellement confiance.'],
      ideals: ['Indépendance. Je suis un esprit libre — personne ne me dit quoi faire.', 'Créativité. Je n\'essaie jamais la même escroquerie deux fois.'],
      bonds: ['Je dois tout à mon mentor, un escroc qui m\'a pris sous son aile.', 'J\'ai une dette envers quelqu\'un que j\'ai escroqué.'],
      flaws: ['Je ne peux pas m\'empêcher d\'escroquer les gens plus riches que moi.', 'Je mens trop facilement.'],
    },
  },
  {
    id: 'criminal',
    dbName: 'Criminel',
    name: 'Criminel',
    description: 'Hors-la-loi expérimenté, à l\'aise dans les bas-fonds.',
    skillProficiencies: ['deception', 'stealth'],
    toolProficiencies: ['Un jeu au choix', 'Outils de voleur'],
    languages: 0,
    equipment: ['Pied-de-biche', 'Vêtements sombres à capuche', '15 po'],
    featureName: 'Contact criminel',
    featureDescription: 'Un contact fiable dans le milieu peut transmettre des informations sensibles.',
    suggestions: {
      personality: ['Je suis toujours calme, quelle que soit la situation.', 'Je préfère agir seul.'],
      ideals: ['Liberté. Les chaînes sont faites pour être brisées.', 'Solidarité. Je suis loyal envers mes alliés.'],
      bonds: ['Je vole pour aider ma famille dans la misère.', 'Je me suis fait voler quelque chose que je veux récupérer.'],
      flaws: ['Quand je vois quelque chose que je veux, je le prends.', 'Si un plan peut mal tourner, je n\'en verrai pas les conséquences.'],
    },
  },
  {
    id: 'entertainer',
    dbName: 'Saltimbanque',
    name: 'Artiste',
    description: 'Artiste de scène vivant pour les applaudissements et la gloire.',
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiencies: ['Kit de déguisement', 'Instrument de musique'],
    languages: 0,
    equipment: ['Instrument de musique', 'Faveur d\'un admirateur', 'Costume', '15 po'],
    featureName: 'Par acclamation populaire',
    featureDescription: 'Trouvez toujours une scène pour vous produire, souvent avec gîte et couvert.',
    suggestions: {
      personality: ['Je m\'attache facilement à la foule et veux plaire à tout le monde.', 'Je pense à voix haute — parfois trop.'],
      ideals: ['Beauté. L\'art doit émouvoir les âmes et exprimer ce que les mots ne peuvent dire.', 'Créativité. Le monde a besoin de nouvelles idées.'],
      bonds: ['Mon instrument est mon bien le plus précieux.', 'Je veux prouver ma valeur à quelqu\'un qui m\'a toujours sous-estimé.'],
      flaws: ['Je ferai n\'importe quoi pour attirer l\'attention.', 'Je suis trop vaniteux.'],
    },
  },
  {
    id: 'folk-hero',
    dbName: 'Héros du peuple',
    name: 'Héros du peuple',
    description: 'Personnage ordinaire appelé à quelque chose de plus grand.',
    skillProficiencies: ['animalHandling', 'survival'],
    toolProficiencies: ['Outil d\'artisan au choix', 'Véhicule terrestre'],
    languages: 0,
    equipment: ['Outil d\'artisan', 'Pelle', 'Pot de fer', 'Vêtements communs', '10 po'],
    featureName: 'Hospitalité rustique',
    featureDescription: 'Les gens du peuple vous accueillent, vous nourrissent et vous cachent au besoin.',
    suggestions: {
      personality: ['Je juge les gens sur leurs actes, pas leurs paroles.', 'Si quelqu\'un est en difficulté, je l\'aide.'],
      ideals: ['Respect. Les gens méritent d\'être traités avec dignité, peu importe leur rang.', 'Destin. Rien ni personne ne peut m\'arrêter.'],
      bonds: ['Je protège les gens de mon village natal comme si c\'était ma famille.', 'Un tyran a ruiné ma famille — je ferai tout pour le renverser.'],
      flaws: ['Je place trop confiance dans les puissants.', 'Je suis têtu.'],
    },
  },
  {
    id: 'guild-artisan',
    dbName: 'Artisan de guilde',
    name: 'Artisan de guilde',
    description: 'Membre d\'une guilde, maîtrisant un art ou un commerce.',
    skillProficiencies: ['insight', 'persuasion'],
    toolProficiencies: ['Outil d\'artisan au choix'],
    languages: 1,
    equipment: ['Outils d\'artisan', 'Lettre de la guilde', 'Vêtements de voyage', '15 po'],
    featureName: 'Membre de la guilde',
    featureDescription: 'Logement et assistance auprès des membres de votre guilde dans n\'importe quelle ville.',
    suggestions: {
      personality: ['Je crois que tout vaut la peine d\'être bien fait.', 'Je m\'ennuie rapidement si je n\'ai pas de travail à faire.'],
      ideals: ['Communauté. La guilde est une famille — chacun doit faire sa part.', 'Aspiration. Je travaille dur pour être le meilleur dans mon domaine.'],
      bonds: ['La guilde m\'a tout appris. Je lui dois ma loyauté.', 'Je veux créer quelque chose qui durera plus que ma vie.'],
      flaws: ['Je suis avare et ne partage pas volontiers.', 'Je suis trop attaché à mes créations.'],
    },
  },
  {
    id: 'hermit',
    dbName: 'Ermite',
    name: 'Ermite',
    description: 'Reclus solitaire ayant découvert une vérité lors de sa retraite.',
    skillProficiencies: ['medicine', 'religion'],
    toolProficiencies: ['Matériel d\'herboriste'],
    languages: 1,
    equipment: ['Étui à parchemins avec notes', 'Couverture d\'hiver', 'Matériel d\'herboriste', '5 po'],
    featureName: 'Découverte',
    featureDescription: 'Vous avez fait une découverte unique lors de votre réclusion — connaissance, lieu ou vérité cachée.',
    suggestions: {
      personality: ['Je suis détaché des préoccupations matérielles.', 'Je n\'élève jamais la voix.'],
      ideals: ['Sagesse. Je cherche la vérité dans la méditation.', 'Paix. La violence est un dernier recours.'],
      bonds: ['Je retourne dans la société pour accomplir une mission divine.', 'Ma découverte doit être protégée des mauvaises mains.'],
      flaws: ['Je suis peu à l\'aise en société.', 'Je suis dogmatique dans ma philosophie.'],
    },
  },
  {
    id: 'noble',
    dbName: 'Noble',
    name: 'Noble',
    description: 'Issu d\'une famille puissante portant rang et responsabilités.',
    skillProficiencies: ['history', 'persuasion'],
    toolProficiencies: ['Un jeu au choix'],
    languages: 1,
    equipment: ['Vêtements fins', 'Chevalière de famille', 'Parchemin de lignée', '25 po'],
    featureName: 'Position de privilège',
    featureDescription: 'Votre statut ouvre les portes de la noblesse. On vous traite en égal.',
    suggestions: {
      personality: ['Tout le monde devrait me laisser en paix.', 'Je suis patient pour les gens à qui je dois quelque chose.'],
      ideals: ['Noblesse oblige. Je dois me montrer à la hauteur de mon rang.', 'Pouvoir. Si je peux conquérir le pouvoir, je dois le faire.'],
      bonds: ['Je dois tout à ma famille.', 'Je trahirais ma famille si quelqu\'un de plus puissant me l\'ordonnait.'],
      flaws: ['J\'ai du mal à cacher mon mépris pour les roturiers.', 'Je cache ma lâcheté sous une arrogance de façade.'],
    },
  },
  {
    id: 'outlander',
    dbName: 'Étranger',
    name: 'Hors-la-loi',
    description: 'Grandi dans les terres reculées, loin de la civilisation.',
    skillProficiencies: ['athletics', 'survival'],
    toolProficiencies: ['Instrument de musique au choix'],
    languages: 1,
    equipment: ['Bâton', 'Piège de chasse', 'Trophée animal', 'Vêtements de voyage', '10 po'],
    featureName: 'Marcheur des terres sauvages',
    featureDescription: 'Trouvez nourriture et eau douce pour 6 personnes en terrain sauvage.',
    suggestions: {
      personality: ['Je suis torturé par des souvenirs terribles que je préfère oublier.', 'Je suis lent à faire confiance, mais loyal une fois que j\'ai décidé.'],
      ideals: ['Gloire. Je dois me prouver à moi-même et au monde.', 'Nature. La monde civilisé est une mince couche sur quelque chose de sauvage.'],
      bonds: ['Mon clan est tout ce qui compte.', 'Je cherche à venger un tort terrible fait à mon peuple.'],
      flaws: ['Je suis trop méfiant des étrangers.', 'La violence est ma première réponse à tout problème.'],
    },
  },
  {
    id: 'sage',
    dbName: 'Sage',
    name: 'Sage',
    description: 'Érudit passionné ayant consacré sa vie à la recherche du savoir.',
    skillProficiencies: ['arcana', 'history'],
    toolProficiencies: [],
    languages: 2,
    equipment: ['Bouteille d\'encre', 'Plume d\'écriture', 'Petit couteau', 'Lettre d\'un collègue décédé', '10 po'],
    featureName: 'Chercheur',
    featureDescription: 'Si vous ne connaissez pas l\'info, vous savez où la trouver (bibliothèques, experts).',
    suggestions: {
      personality: ['Je cite des sages célèbres pour ponctuer mes discours.', 'Je suis absolument convaincu que les gens ont tort face à moi.'],
      ideals: ['Savoir. La clé du pouvoir est le savoir.', 'Découverte. Je veux percer tous les secrets du monde.'],
      bonds: ['J\'ai accès à une ancienne bibliothèque que très peu connaissent.', 'Mon œuvre de vie est une encyclopédie.'],
      flaws: ['Je ne supporte pas de partager le crédit de mes idées.', 'Je méprise les ignorants.'],
    },
  },
  {
    id: 'sailor',
    dbName: 'Marin',
    name: 'Marin',
    description: 'Loup de mer endurci ayant affronté tempêtes et monstres marins.',
    skillProficiencies: ['athletics', 'perception'],
    toolProficiencies: ['Outils de navigateur', 'Véhicule aquatique'],
    languages: 0,
    equipment: ['Gourdin', 'Corde de soie 15m', 'Porte-bonheur', '10 po'],
    featureName: 'Passage assuré',
    featureDescription: 'Obtenez un passage gratuit pour vous et vos compagnons sur n\'importe quel navire.',
    suggestions: {
      personality: ['Mon argent est dépensé au port, entre jeu et boisson.', 'Ma langue est aussi rude que mes mains.'],
      ideals: ['Respect. Il faut que j\'aie le respect de l\'équipage.', 'Maîtrise. Je dois être le meilleur marin des mers.'],
      bonds: ['Je ferai n\'importe quoi pour m\'emparer du bateau qui m\'appartient.', 'Mon capitaine m\'a sauvé la vie — je lui dois tout.'],
      flaws: ['Je ne suis vraiment moi-même qu\'en mer.', 'Une bouteille de vin m\'efface toute peur.'],
    },
  },
  {
    id: 'soldier',
    dbName: 'Soldat',
    name: 'Soldat',
    description: 'Vétéran militaire discipliné, familier du champ de bataille.',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiencies: ['Un jeu au choix', 'Véhicule terrestre'],
    languages: 0,
    equipment: ['Insigne de rang', 'Trophée de guerre', 'Jeu de dés', 'Vêtements communs', '10 po'],
    featureName: 'Rang militaire',
    featureDescription: 'Les soldats et mercenaires reconnaissent votre rang et peuvent vous obéir.',
    suggestions: {
      personality: ['Je suis toujours poli et respectueux.', 'Je suis hanté par les visages de mes ennemis morts.'],
      ideals: ['Plus grand bien. Ma ville, ma nation, mes gens — voilà pour qui je bats.', 'Idéal. Je mens, vole, tue si ça sert mes gens.'],
      bonds: ['Je veux retrouver les camarades que j\'ai perdus.', 'Mon équipement de guerre est la mémoire de mes batailles.'],
      flaws: ['L\'ennemi imaginaire est parfois plus dangereux que le réel.', 'Obéir aux ordres est un réflexe que j\'ai du mal à contrôler.'],
    },
  },
  {
    id: 'urchin',
    dbName: 'Enfant des rues',
    name: 'Gamin des rues',
    description: 'Survivant des rues formé à la débrouillardise depuis l\'enfance.',
    skillProficiencies: ['sleightOfHand', 'stealth'],
    toolProficiencies: ['Kit de déguisement', 'Outils de voleur'],
    languages: 0,
    equipment: ['Petit couteau', 'Carte de la ville', 'Jeton de bonne chance', 'Vêtements communs', '10 po'],
    featureName: 'Visage dans la foule',
    featureDescription: 'Déplacez-vous doublement vite dans les villes et restez incognito dans la masse.',
    suggestions: {
      personality: ['Je cache ma peur derrière une façade de bravade.', 'Je m\'adapte vite à chaque situation.'],
      ideals: ['Communauté. Nous devons nous serrer les coudes.', 'Changement. Les pauvres souffrent le plus du statu quo.'],
      bonds: ['Ma fratrie de la rue est ma vraie famille.', 'Je dois beaucoup à un mentor qui m\'a appris à survivre.'],
      flaws: ['L\'or me glisse entre les doigts.', 'Je ne fais confiance à personne de riche ou de puissant.'],
    },
  },
  {
    id: 'custom',
    dbName: null,
    name: 'Personnalisé',
    description: 'Créez un historique sur mesure adapté à l\'histoire de votre personnage.',
    skillProficiencies: [],
    toolProficiencies: [],
    languages: 0,
    equipment: [],
    featureName: '',
    featureDescription: '',
    suggestions: { personality: [], ideals: [], bonds: [], flaws: [] },
  },
]

// ─── Calculs de sorts ─────────────────────────────────────────────────────────

export const FULL_CASTER_SLOTS: number[][] = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]

export const HALF_CASTER_SLOTS: number[][] = [
  [0,0,0,0,0,0,0,0,0],[2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],
  [4,2,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],
  [4,3,3,1,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,0,0,0,0],
]

export const PACT_SLOT_LEVEL = [1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5]
export const PACT_SLOT_COUNT = [1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4]

export function spellSlotsAtLevel(type: SpellcastingType, level: number): number[] {
  const idx = Math.max(0, Math.min(19, level - 1))
  if (type === 'full') return FULL_CASTER_SLOTS[idx]!
  if (type === 'half') return HALF_CASTER_SLOTS[idx]!
  if (type === 'pact') {
    const slotLvl = PACT_SLOT_LEVEL[idx]!
    const count = PACT_SLOT_COUNT[idx]!
    const row = [0,0,0,0,0,0,0,0,0]
    row[slotLvl - 1] = count
    return row
  }
  return [0,0,0,0,0,0,0,0,0]
}

export function maxSpellLevelAtLevel(type: SpellcastingType, level: number): number {
  const slots = spellSlotsAtLevel(type, level)
  for (let i = 8; i >= 0; i--) {
    if ((slots[i] ?? 0) > 0) return i + 1
  }
  return 0
}

export const CANTRIPS_KNOWN: Partial<Record<string, number[]>> = {
  bard:     [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  cleric:   [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
  druid:    [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  sorcerer: [4,4,4,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6],
  warlock:  [2,2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4],
  wizard:   [3,3,3,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5],
}

export const SPELLS_KNOWN: Partial<Record<string, number[]>> = {
  bard:     [4,5,6,7,8,9,10,11,12,14,15,15,16,18,19,19,20,22,22,22],
  sorcerer: [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,15,15],
  warlock:  [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,15,15,15],
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function profBonusAtLevel(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

export function hpAtLevel(hitDie: number, level: number, conMod: number): number {
  if (level <= 0) return 0
  const firstLevel = hitDie + conMod
  const additionalLevels = (level - 1) * (Math.ceil(hitDie / 2) + 1 + conMod)
  return firstLevel + additionalLevels
}

// ─── Mapping DB names ─────────────────────────────────────────────────────────
// Ces noms correspondent exactement à character_species.name et backgrounds.name en DB.
// Utilisés pour résoudre les IDs lors de la soumission finale.

export const SPECIES_DB_NAMES: Record<string, string | null> = {
  'high-elf': 'Haut-elfe',
  'wood-elf': 'Elfe des bois',
  'drow': null,              // Absent de la DB — ignorer à la soumission
  'hill-dwarf': 'Nain des collines',
  'mountain-dwarf': 'Nain des montagnes',
  'lightfoot': 'Halfelin pied-léger',
  'stout': 'Halfelin robuste',
  'human': 'Humain',
  'variant-human': 'Humain',
  'dragonborn': 'Drakéide',
  'rock-gnome': 'Gnome des rochers',
  'forest-gnome': 'Gnome des forêts',
  'half-elf': 'Demi-elfe',
  'half-orc': 'Demi-orc',
  'tiefling': 'Tieffelin',
}

export const BACKGROUND_DB_NAMES: Record<string, string> = {
  'acolyte': 'Acolyte',
  'charlatan': 'Charlatan',
  'criminal': 'Criminel',
  'entertainer': 'Saltimbanque',
  'folk-hero': 'Héros du peuple',
  'guild-artisan': 'Artisan de guilde',
  'hermit': 'Ermite',
  'noble': 'Noble',
  'outlander': 'Étranger',
  'sage': 'Sage',
  'sailor': 'Marin',
  'soldier': 'Soldat',
  'urchin': 'Enfant des rues',
}

export const CLASS_DB_NAMES: Record<string, string> = {
  'barbarian': 'Barbare',
  'bard': 'Barde',
  'cleric': 'Clerc',
  'druid': 'Druide',
  'fighter': 'Guerrier',
  'monk': 'Moine',
  'paladin': 'Paladin',
  'ranger': 'Rôdeur',
  'rogue': 'Roublard',
  'sorcerer': 'Ensorceleur',
  'warlock': 'Occultiste',
  'wizard': 'Magicien',
}

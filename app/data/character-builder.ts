import { ALIGNMENTS as CANONICAL_ALIGNMENTS } from '~~/shared/rules/alignments'

// Données riches D&D 5e (2014) pour le Character Builder.
// Ces données sont hardcodées côté frontend car la DB ne stocke pas
// les traits, bonus de carac., descriptions détaillées, etc.
// Voir docs/character-builder.md pour le contexte complet.

import { ABILITY_KEYS, type AbilityKey } from '~~/shared/rules/abilities'
import type { CasterType } from '~~/shared/rules/spellcasting'

// Ré-export depuis la source canonique (cf. shared/rules/abilities.ts, decisions.md D6) —
// les consommateurs continuent d'importer `AbilityKey` / `ABILITIES` d'ici.
export type { AbilityKey }
// L'ensemble fermé des types d'incantation vit dans `shared/rules/spellcasting.ts` et
// sa valeur par classe dans `classes.spellcasting_type` ; ici on ne manipule que les
// trois progressions qui ont une table d'emplacements (`CasterType`, `'none'` exclu).
export type { CasterType }

// ─── Constantes ────────────────────────────────────────────────────────────────

export const ABILITIES: AbilityKey[] = [...ABILITY_KEYS]

// Langues D&D 5e disponibles pour les choix de langue
export const LANGUAGES = [
  'Abyssal', 'Céleste', 'Commun', 'Commun des profondeurs', 'Draconique',
  'Druidique', 'Elfique', 'Géant', 'Gnome', 'Gobelin', 'Halfelin',
  'Infernal', 'Nain', 'Orque', 'Primordial', 'Sylvain',
] as const

// Options génériques d'équipement → liste d'items spécifiques disponibles en DB
export const GENERIC_ITEM_OPTIONS: Record<string, string[]> = {
  'Arme courante': ['Gourdin', 'Dague', 'Massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Serpe', 'Lance', 'Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme courante de corps à corps': ['Gourdin', 'Dague', 'Massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Serpe', 'Lance'],
  'Arme courante à distance': ['Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme courante au choix': ['Gourdin', 'Dague', 'Massue', 'Hachette', 'Javeline', 'Marteau léger', "Masse d'armes", 'Bâton', 'Serpe', 'Lance', 'Arbalète légère', 'Fléchette', 'Fronde', 'Arc court'],
  'Arme de guerre': ["Hache d'armes", "Fléau d'armes", 'Coutille', 'Hache à deux mains', 'Épée à deux mains', 'Hallebarde', "Lance d'arçon", 'Maillet', 'Pique', 'Épée longue', 'Morgenstern', 'Pic de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre', 'Arbalète de poing', 'Arbalète lourde', 'Arc long', 'Filet', 'Sarbacane'],
  'Arme de guerre de corps à corps': ["Hache d'armes", "Fléau d'armes", 'Coutille', 'Hache à deux mains', 'Épée à deux mains', 'Hallebarde', "Lance d'arçon", 'Maillet', 'Pique', 'Épée longue', 'Morgenstern', 'Pic de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre'],
  'Arme de guerre au choix': ["Hache d'armes", "Fléau d'armes", 'Coutille', 'Hache à deux mains', 'Épée à deux mains', 'Hallebarde', "Lance d'arçon", 'Maillet', 'Pique', 'Épée longue', 'Morgenstern', 'Pic de guerre', 'Rapière', 'Cimeterre', 'Épée courte', 'Trident', 'Fouet', 'Marteau de guerre', 'Arbalète de poing', 'Arbalète lourde', 'Arc long', 'Filet', 'Sarbacane'],
  'Instrument de musique au choix': ['Cornemuse', 'Cor', 'Flûte', 'Luth', 'Lyre', 'Tambour', 'Viole', 'Chalemie', 'Flûte de pan', 'Tympanon'],
  'Outil d\'artisan au choix': ['Outils de forgeron', 'Outils de charpentier', 'Outils de cordonnier', 'Ustensiles de cuisinier', 'Outils de bijoutier', 'Outils de maçon', 'Matériel de peintre', 'Outils de potier', 'Outils de tanneur', 'Outils de tisserand', 'Outils de souffleur de verre', "Matériel d'alchimiste", 'Matériel de brasseur', 'Matériel de calligraphe', 'Outils de cartographe', 'Outils de bricoleur', 'Outils de menuisier'],
  'Jeux au choix': ['Jeu de dés', 'Jeu de cartes', "Jeu d'échecs draconiques", 'Jeu des Dragons'],
  'Un jeu au choix': ['Jeu de dés', 'Jeu de cartes', "Jeu d'échecs draconiques", 'Jeu des Dragons'],
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
  { key: 'animal_handling', label: 'Dressage', ability: 'wis' },
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
  { key: 'sleight_of_hand', label: 'Escamotage', ability: 'dex' },
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
  lineageId?: number                     // species_lineages.id si la sous-race vient du catalogue (D17, lot 5b)
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
  // Espèce « base + lignée » (D17) : nom de l'espèce de base en DB. Quand présent, le picker de
  // sous-race est PILOTÉ PAR LE CATALOGUE (useSpeciesLineages) au lieu du `subraces` hardcodé.
  lineageBaseSpeciesName?: string
  // Cas spéciaux
  hasHalfElfBonuses?: boolean             // Demi-Elfe : +1+1 aux carac. hors CHA
  hasVariantOption?: boolean              // Humain : option variante disponible
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
    lineageBaseSpeciesName: 'Elfe',
    description: 'Grâcieux et longévifs, les elfes sont doués d\'une acuité sensorielle remarquable et d\'une résistance naturelle à la magie. Leur transe leur permet de méditer à la place de dormir.',
    abilityBonuses: { dex: 2 },
    speed: 9,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Dextérité',
      'Sens aiguisés (maîtrise Perception)',
      'Ascendance féerique (avantage contre charme, immunité sommeil magique)',
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
          'Maîtrise : épée longue, épée courte, arc court, arc long',
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
          'Cachette naturelle (se cacher si légèrement obscurci)',
          'Maîtrise : épée longue, épée courte, arc court, arc long',
        ],
      },
      {
        id: 'drow',
        name: 'Elfe Noir (Drow)',
        dbName: 'Elfe noir',
        abilityBonuses: { dex: 2, cha: 1 },
        darkvision: 36,
        description: 'Nés dans les Outreterre, ils portent la magie des profondeurs.',
        traits: [
          '+1 Charisme',
          'Vision dans le noir supérieure (36 m)',
          'Sensibilité au soleil (désavantage attaques/Perception au soleil)',
          'Magie drow : Lumières dansantes, puis Feu féerique (niv.3) et Ténèbres (niv.5)',
          'Maîtrise : rapière, épée courte, arbalète de poing',
        ],
      },
    ],
  },
  {
    id: 'dwarf',
    name: 'Nain',
    emoji: '⛏️',
    dbName: null,
    lineageBaseSpeciesName: 'Nain',
    description: 'Courageux et endurants, les nains sont réputés pour leur résistance au poison, leur expertise du travail de la pierre et leur ténacité au combat.',
    abilityBonuses: { con: 2 },
    speed: 7.5,
    size: 'Moyenne',
    darkvision: 18,
    traits: [
      '+2 Constitution',
      'Vision dans le noir 18m',
      'Résistance naine (résistance poison, avantage JS contre poison)',
      'Entraînement aux armes naines (haches et marteaux)',
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
          'Ténacité naine : +1 PV max par niveau',
        ],
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfelin',
    emoji: '🍃',
    dbName: null,
    lineageBaseSpeciesName: 'Halfelin',
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
          'Résistance des robustes (résistance poison, avantage JS contre poison)',
        ],
      },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    emoji: '🔩',
    dbName: null,
    lineageBaseSpeciesName: 'Gnome',
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
        name: 'Gnome des Roches',
        dbName: 'Gnome des roches',
        abilityBonuses: { int: 2, con: 1 },
        darkvision: 18,
        description: 'Inventeurs-nés, passionnés par la mécanique et l\'artifice.',
        traits: [
          '+1 Constitution',
          'Connaissance en ingénierie (double maîtrise Histoire sur objets magiques/tech.)',
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
          'Illusionniste-né (sort Illusion mineure, INT)',
          'Communication avec les petits animaux',
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
      'Ascendance féerique (avantage contre charme, immunité sommeil magique)',
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
      'Endurance implacable (1×/repos long : rester à 1 PV au lieu de tomber à 0)',
      'Attaques sauvages (+1 dé de dégâts sur coup critique avec arme)',
    ],
    languages: ['Commun', 'Orc'],
  },
  {
    id: 'tiefling',
    name: 'Tieffelin',
    emoji: '😈',
    // Base+lignée (D17, lot 6) : le picker vient du catalogue (base « Tieffelin »). Le `dbName` pointe
    // la LEGACY renommée (migration 0087) → repli résolvable AVANT le seed de la base (pas de fenêtre
    // où « Tieffelin » serait irrésolvable). Après seed, `lineageBaseSpeciesName` prend le relais.
    dbName: 'Tieffelin (Asmodée)',
    lineageBaseSpeciesName: 'Tieffelin',
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
    // Base+lignée (D17, lot 6) : l'ascendance draconique devient une lignée « Dragon <couleur> »
    // (picker catalogue). `dbName` pointe la LEGACY renommée (migration 0088) → repli résolvable avant
    // le seed de la base ; `lineageBaseSpeciesName` prend le relais une fois la base seedée.
    dbName: 'Drakéide (2014)',
    lineageBaseSpeciesName: 'Drakéide',
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
  },
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
  type: CasterType
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
  // Libellé FR de la spécialisation (ex. « Domaine divin ») — donnée d'affichage front-only
  // (aucune colonne DB). Le NIVEAU d'accès et la LISTE des sous-classes viennent désormais du
  // catalogue (`/api/catalog/classes`, F2 tranche 3), plus du blob.
  subclassLabel: string
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
    skillChoices: { count: 2, from: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
    spellcasting: null,
    subclassLabel: 'Voie primitive',
    features: [
      { name: 'Rage', description: 'Action bonus : entrez en rage — +2 dégâts FOR, résistance contondant/perçant/tranchant, avantage JS FOR. 2 utilisations / repos long.' },
      { name: 'Défense sans armure', description: 'CA = 10 + mod DEX + mod CON quand vous ne portez pas d\'armure.' },
    ],
    equipment: [
      { choice: true, options: ['Hache à deux mains', '2 hachettes'] },
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
    subclassLabel: 'Collège bardique',
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
    subclassLabel: 'Domaine divin',
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
    skillChoices: { count: 2, from: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
    spellcasting: { ability: 'wis', type: 'full' },
    subclassLabel: 'Cercle druidique',
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
    skillChoices: { count: 2, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
    spellcasting: null,
    subclassLabel: 'Archétype martial',
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
    subclassLabel: 'Tradition monastique',
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
    subclassLabel: 'Serment sacré',
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
    skillChoices: { count: 3, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
    spellcasting: { ability: 'wis', type: 'half', startsAtLevel: 2 },
    subclassLabel: 'Archétype de rôdeur',
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
    skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'] },
    spellcasting: null,
    subclassLabel: 'Archétype de roublard',
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
    subclassLabel: 'Origine magique',
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
    subclassLabel: 'Patron d\'Outremonde',
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
    subclassLabel: 'Tradition arcanique',
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

// Libellés et ordre viennent de la source canonique partagée (shared/rules/alignments.ts),
// qui porte aussi le code stocké en base ; le builder n'en garde que son `id` historique.
export const ALIGNMENTS: AlignmentData[] = CANONICAL_ALIGNMENTS.map(a => ({
  id: a.builderId,
  short: a.short,
  name: a.name,
  description: a.description,
}))

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
    featureName: 'Abri du fidèle',
    featureDescription: 'Logement, nourriture et soins dans les temples de votre foi. Les prêtres sont des alliés.',
    suggestions: {
      personality: [
        'J\'idolâtre un héros particulier de ma foi, et renvoie constamment à ses actes et à son exemple.',
        'Je peux trouver un terrain d\'entente entre les ennemis les plus féroces, ressentir de l\'empathie pour eux et toujours travailler vers la paix.',
        'Je vois des présages dans chaque événement et action. Les dieux essaient de nous parler, nous avons juste besoin d\'écouter.',
        'J\'ai toujours une attitude optimiste.',
        'Je cite (ou paraphrase) des textes sacrés et des proverbes dans presque toutes les situations.',
        'Je suis tolérant (ou intolérant) vis-à-vis des autres fois et je respecte (ou condamne) l\'adoration des autres dieux.',
        'J\'ai apprécié la bonne nourriture, les boissons et la haute société parmi l\'élite de mon temple. La vie rude me fait grincer.',
        'J\'ai passé tellement de temps dans mon temple que j\'ai peu d\'expérience pratique pour traiter avec les gens du monde extérieur.',
      ],
      ideals: [
        'Tradition. Les anciennes traditions de culte et de sacrifice doivent être préservées et respectées.',
        'Charité. J\'essaie toujours d\'aider ceux dans le besoin, quel qu\'en soit le coût.',
        'Progrès. Nous devons aider à mettre en place sur terre les changements que les dieux réalisent constamment.',
        'Pouvoir. J\'espère un jour parvenir au sommet de la hiérarchie religieuse de ma foi.',
        'Foi. J\'ai confiance dans le fait que ma divinité guidera mes actions et que si je travaille dur, tout ira bien.',
        'Aspiration. Je cherche à me montrer digne de la faveur de mon dieu en faisant correspondre mes actions avec ses enseignements.',
      ],
      bonds: [
        'Je cherche une ancienne relique de ma foi qui a été perdue il y a longtemps. Je mourrais pour la récupérer.',
        'Un jour je me vengerai de la hiérarchie corrompue de ce temple qui m\'a accusé d\'être un hérétique.',
        'Je dois ma vie au prêtre qui m\'a recueilli quand mes parents sont morts.',
        'Tout ce que je fais est pour les gens ordinaires.',
        'Je ferais tout pour protéger le temple dans lequel je servais.',
        'Je cherche à préserver un texte sacré que mes ennemis veulent détruire car ils le considèrent hérétique.',
      ],
      flaws: [
        'Je juge sévèrement les autres, en partie parce que je suis encore plus sévère envers moi-même.',
        'J\'ai trop confiance en ceux qui exercent le pouvoir au sein de la hiérarchie de mon temple.',
        'Ma piété me conduit parfois à faire confiance aveuglément à ceux qui professent la foi de mon dieu.',
        'Je suis inflexible dans ma pensée.',
        'Je suis méfiant envers les étrangers et m\'attends au pire de leur part.',
        'Une fois que j\'ai un but, je deviens obsédé par celui-ci, au détriment du reste de ma vie.',
      ],
    },
  },
  {
    id: 'charlatan',
    dbName: 'Charlatan',
    name: 'Charlatan',
    description: 'Escroc habile, maître du mensonge et des fausses identités.',
    skillProficiencies: ['deception', 'sleight_of_hand'],
    toolProficiencies: ['Kit de déguisement', 'Kit de contrefaçon'],
    languages: 0,
    equipment: ['Vêtements fins', 'Kit de déguisement', 'Kit de contrefaçon', '15 po'],
    featureName: 'Fausse identité',
    featureDescription: 'Vous disposez d\'une seconde identité avec documents, vêtements et contacts.',
    suggestions: {
      personality: [
        'Je tombe facilement amoureux, mais passe rapidement à une autre personne. Je suis toujours en train de faire la cour à quelqu\'un.',
        'J\'ai une blague pour n\'importe quelle occasion, en particulier pour les situations où l\'humour n\'est pas approprié.',
        'La flatterie est mon astuce préférée pour obtenir ce que je veux.',
        'Je suis un joueur né qui ne peut s\'empêcher de prendre des risques pour un gain potentiel.',
        'Je mens sur à peu près tout, même s\'il n\'y a aucune bonne raison pour le faire.',
        'Les sarcasmes et les insultes sont mes armes favorites.',
        'Je conserve tout un tas de symboles sacrés sur moi et prie toute divinité qui pourrait me venir en aide à un moment.',
        'Je mets dans mes poches tout ce que je vois et qui pourrait avoir une quelconque valeur.',
      ],
      ideals: [
        'Indépendance. Je suis un esprit libre, personne ne me dit ce que je dois faire.',
        'Justice. Je ne cible jamais une personne qui ne peut pas se permettre de perdre quelques pièces.',
        'Charité. Je distribue l\'argent que j\'obtiens à ceux qui en ont vraiment besoin.',
        'Créativité. Je ne fais jamais deux fois la même arnaque.',
        'Amitié. Les biens matériels vont et viennent. Les liens d\'amitié qui se tissent durent éternellement.',
        'Aspiration. Je suis déterminé à faire quelque chose de ma vie.',
      ],
      bonds: [
        'J\'ai floué la mauvaise personne et ai intérêt à tout faire pour qu\'elle ne recroise plus jamais mon chemin ou celui d\'un de mes proches.',
        'Je dois tout à mon maître, une horrible personne qui est probablement en train de pourrir en prison.',
        'Dehors, quelque part, j\'ai un enfant qui ne me connaît pas. Je cherche à rendre le monde meilleur pour lui/elle.',
        'Je viens d\'une famille noble, et un jour je viendrai leur réclamer mes terres et mon titre qu\'ils m\'ont lâchement dérobés.',
        'Une personne très puissante a tué quelqu\'un que j\'aimais. Un jour prochain, j\'aurai ma revanche.',
        'J\'ai escroqué et ruiné une personne qui ne le méritait pas. Je cherche à expier mon erreur, mais je ne pourrai jamais me le pardonner.',
      ],
      flaws: [
        'Je ne peux pas résister à un joli minois.',
        'J\'ai toujours des dettes. Je dépense mon argent sale dans des produits de luxe plus rapidement que je ne le gagne.',
        'Je suis persuadé que jamais personne ne pourra me rouler de la manière dont je roule les autres.',
        'Je suis trop gourmand lorsqu\'il s\'agit de profit. Je ne peux pas m\'empêcher de prendre des risques lorsque de l\'argent est en jeu.',
        'Je ne peux pas m\'empêcher d\'escroquer ceux qui sont plus puissants que moi.',
        'Je déteste l\'admettre et je vais me détester pour cela, mais je prendrai mes jambes à mon cou et sauverai avant tout ma vie si la situation devient critique.',
      ],
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
    featureName: 'Accointances avec la pègre',
    featureDescription: 'Un contact fiable dans le milieu peut transmettre des informations sensibles.',
    suggestions: {
      personality: [
        'J\'ai toujours un plan pour savoir quoi faire quand les choses vont mal.',
        'Je suis toujours calme, quelle que soit la situation. Je n\'élève pas la voix ou ne laisse pas mes émotions me contrôler.',
        'La première chose que je fais dans un nouveau lieu est de noter les emplacements de toute chose précieuse, ou bien là où ces choses pourraient être cachées.',
        'Je préfère me faire un nouvel ami qu\'un nouvel ennemi.',
        'Je suis incroyablement lent à faire confiance. Ceux qui semblent les plus droits sont souvent ceux qui ont le plus à cacher.',
        'Je ne fais pas attention aux risques d\'une situation.',
        'La meilleure façon de me faire faire quelque chose est de me dire de ne pas le faire.',
        'J\'explose à la moindre insulte.',
      ],
      ideals: [
        'Honneur. Je ne vole pas les autres dans une négociation.',
        'Liberté. Les chaînes sont faites pour être brisées, de même que ceux qui les forgent.',
        'Charité. Je vole des riches pour pouvoir aider ceux qui sont dans le besoin.',
        'Avidité. Je ferai tout ce qu\'il faut pour devenir riche.',
        'Personnes. Je suis fidèle à mes amis, pas à des idéaux, et tous les autres peuvent bien s\'embarquer sur le Styx, ça ne m\'importe pas.',
        'Rédemption. Il y a une étincelle de bonté en chacun de nous.',
      ],
      bonds: [
        'Je suis en train de payer une vieille dette que je dois à un généreux bienfaiteur.',
        'Mes gains mal acquis vont soutenir ma famille.',
        'Quelque chose d\'important m\'a été pris, et je dois le voler de nouveau.',
        'Je vais devenir le plus grand voleur qui n\'ait jamais été.',
        'Je suis coupable d\'un crime terrible. J\'espère pouvoir me racheter.',
        'Quelqu\'un que j\'aimais est mort à cause d\'une erreur que j\'ai faite. Cela ne se reproduira plus.',
      ],
      flaws: [
        'Quand je vois quelque chose de précieux, je ne pense qu\'à une chose : comment m\'en emparer.',
        'Lorsque je suis confronté à un choix entre l\'argent et mes amis, je choisis généralement l\'argent.',
        'S\'il y a un plan, je vais l\'oublier. Si je ne l\'oublie pas, je l\'ignore.',
        'Il y a quelque chose qui me trahit quand je mens.',
        'Je tourne le dos et m\'enfuis en courant quand les choses vont mal.',
        'Une personne innocente est en prison pour un crime que j\'ai commis. Et je n\'ai pas de problème avec cela.',
      ],
    },
  },
  {
    id: 'entertainer',
    dbName: 'Artiste',
    name: 'Artiste',
    description: 'Artiste de scène vivant pour les applaudissements et la gloire.',
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiencies: ['Kit de déguisement', 'Instrument de musique'],
    languages: 0,
    equipment: ['Instrument de musique', 'Faveur d\'un admirateur', 'Costume', '15 po'],
    featureName: 'À la demande du public',
    featureDescription: 'Trouvez toujours une scène pour vous produire, souvent avec gîte et couvert.',
    suggestions: {
      personality: [
        'Je connais une histoire en rapport avec chaque situation.',
        'À chaque fois que j\'arrive dans un nouvel endroit, je m\'entiche des rumeurs locales et répands les commérages.',
        'Je suis désespérément romantique, toujours à la recherche de cette « personne spéciale ».',
        'Personne ne reste en colère contre moi très longtemps, car je peux désamorcer toute tension.',
        'J\'adore les bonnes insultes, même celles qui sont dirigées contre moi.',
        'Je deviens acerbe si je ne suis pas le centre de l\'attention.',
        'Je ne peux me contenter que de la perfection.',
        'Je change mon humeur ou mon état d\'esprit aussi vite que je change de note dans une chanson.',
      ],
      ideals: [
        'Beauté. Lorsque je fais une représentation, je rends le monde meilleur qu\'il ne l\'était.',
        'Tradition. Les histoires, les légendes et les chansons du passé ne devraient jamais être oubliées, car elles nous apprennent qui nous sommes.',
        'Créativité. Le monde a besoin de nouvelles idées et d\'audace.',
        'Avarice. Je ne fais cela que pour l\'or et la gloire.',
        'Peuple. J\'aime voir des sourires sur les visages qui m\'entourent lorsque je fais ma représentation. C\'est tout ce qui m\'importe.',
        'Honnêteté. L\'art doit être le reflet de l\'âme ; il doit provenir du plus profond de notre être et révéler qui nous sommes.',
      ],
      bonds: [
        'Mon instrument est mon bien le plus précieux, et il me rappelle quelqu\'un que j\'aime.',
        'Quelqu\'un a volé mon précieux instrument, et un jour je le récupérerai.',
        'Je veux être connu, et ferais n\'importe quoi pour cela.',
        'J\'idolâtre le héros d\'une vieille histoire et calque mes actions sur les siennes.',
        'Je ferais n\'importe quoi pour me prouver que je suis supérieur à mon détesté rival.',
        'Je ferais n\'importe quoi pour les membres de mon ancienne troupe.',
      ],
      flaws: [
        'Je ferais n\'importe quoi pour gagner gloire et notoriété.',
        'Je suis sans défense devant un joli minois.',
        'Un scandale m\'empêche de retourner chez moi. Ce genre de désagrément semble me suivre de partout.',
        'J\'ai un jour caricaturé un noble, lequel cherche encore à voir ma tête au bout d\'une pique. C\'était une erreur que je vais probablement répéter.',
        'J\'ai des difficultés à garder mes vrais sentiments pour moi. Ma langue acérée me cause beaucoup de problèmes.',
        'En dépit de mes efforts, mes amis ont peu confiance en moi.',
      ],
    },
  },
  {
    id: 'folk-hero',
    dbName: 'Héros du peuple',
    name: 'Héros du peuple',
    description: 'Personnage ordinaire appelé à quelque chose de plus grand.',
    skillProficiencies: ['animal_handling', 'survival'],
    toolProficiencies: ['Outil d\'artisan au choix', 'Véhicule terrestre'],
    languages: 0,
    equipment: ['Outil d\'artisan', 'Pelle', 'Pot de fer', 'Vêtements communs', '10 po'],
    featureName: 'Hospitalité rustique',
    featureDescription: 'Les gens du peuple vous accueillent, vous nourrissent et vous cachent au besoin.',
    suggestions: {
      personality: [
        'Je juge les gens sur leurs actions, pas sur leurs paroles.',
        'Si quelqu\'un est en difficulté, je suis toujours prêt à lui apporter de l\'aide.',
        'Quand je me fixe sur quelque chose, je fonce, peu importe ce qui sera sur ma route.',
        'J\'ai un fort sentiment de justice et j\'essaye toujours de trouver la solution la plus équitable aux différends.',
        'J\'ai confiance en mes capacités et je fais ce que je peux pour inspirer la confiance aux autres.',
        'La pensée est pour les autres. Moi je préfère l\'action.',
        'J\'utilise mal les mots longs lorsque j\'essaye de paraître intelligent.',
        'Je m\'ennuie facilement. Quand vais-je suivre mon destin ?',
      ],
      ideals: [
        'Respect. Les gens méritent d\'être traités avec dignité et respect.',
        'Équité. Personne ne devrait obtenir un traitement préférentiel devant la loi, et nul n\'est au-dessus de la loi.',
        'Liberté. On ne doit pas permettre aux tyrans d\'opprimer le peuple.',
        'Puissance. Si je deviens fort, je peux prendre ce que je veux, ce que je mérite.',
        'Sincérité. Il n\'est pas bon de faire semblant d\'être ce que l\'on n\'est pas.',
        'Destin. Rien ni personne ne peut me détourner de mon destin.',
      ],
      bonds: [
        'J\'ai une famille, mais je ne sais pas où ils sont. Un jour, j\'espère les revoir.',
        'J\'ai travaillé la terre, j\'aime la terre, et je vais protéger la terre.',
        'Un noble orgueilleux m\'a un jour passé une horrible raclée. Je vais prendre ma revanche sur le premier tyran que je rencontre.',
        'Mes outils sont le symbole de ma vie passée, et je les porte pour ne jamais oublier mes racines.',
        'Je protège ceux qui sont sans défense.',
        'Je souhaite que ma petite amie lorsque j\'étais enfant vienne avec moi pour poursuivre mon destin.',
      ],
      flaws: [
        'Le tyran qui gouverne ma terre ne reculera devant rien pour me voir mort.',
        'Je suis convaincu de l\'importance de mon destin, et aveugle devant mes lacunes et les risques d\'échec.',
        'Les gens qui m\'ont connu plus jeune connaissent mon secret honteux. Pour cette raison je ne pourrais jamais revenir chez moi.',
        'J\'ai un faible pour les vices de la ville, en particulier pour les alcools forts.',
        'Secrètement, je crois que les choses iraient mieux si j\'étais un tyran gouvernant ce territoire.',
        'J\'ai du mal à faire confiance à mes alliés.',
      ],
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
    featureName: 'Membre de guilde',
    featureDescription: 'Logement et assistance auprès des membres de votre guilde dans n\'importe quelle ville.',
    suggestions: {
      personality: [
        'Je crois que si quelque chose doit être fait, il doit l\'être correctement. Je n\'y peux rien, je suis un perfectionniste.',
        'Je suis un snob qui regarde de haut ceux qui ne peuvent apprécier les arts de qualité.',
        'Je veux tout le temps savoir comment les choses fonctionnent et ce qui pousse les gens à avancer.',
        'Je lance plein d\'aphorismes spirituels et ai un proverbe pour chaque occasion.',
        'Je suis grossier envers ceux qui n\'ont pas mon engagement pour le travail bien fait et mon fair-play.',
        'J\'aime parler de longues heures de ma profession.',
        'Je ne me sépare pas de mon or facilement et marchande sans relâche pour faire la meilleure affaire possible.',
        'Je suis reconnu pour mon travail, et je veux m\'assurer que tout le monde l\'apprécie. Je suis toujours pris au dépourvu lorsque quelqu\'un n\'a pas entendu parlé de moi.',
      ],
      ideals: [
        'Communauté. Il est du devoir de tout peuple civilisé de renforcer les liens qui unissent sa communauté ainsi que d\'assurer la sécurité de sa civilisation.',
        'Générosité. Mes talents m\'ont été donnés pour que je les utilise pour le plus grand nombre.',
        'Liberté. Chacun devrait être libre d\'exercer son propre gagne-pain.',
        'Avarice. Je ne suis là que pour l\'argent.',
        'Peuple. Je m\'engage pour des personnes que j\'apprécie, pas pour des idées.',
        'Aspiration. Je travaille dur pour être le meilleur dans mon domaine.',
      ],
      bonds: [
        'L\'atelier où j\'ai appris mon métier est l\'endroit le plus important au monde pour moi.',
        'J\'ai créé un travail remarquable pour certaines personnes, puis les ai trouvées indignes de le recevoir. Je suis encore à la recherche d\'une personne qui le méritera.',
        'J\'ai une énorme dette envers ma guilde, car elle a fait de moi ce que je suis aujourd\'hui.',
        'Je cherche à être riche pour m\'assurer l\'amour d\'une personne.',
        'Un jour je retournerai à ma guilde et leur prouverai que je suis un bien plus grand artisan qu\'eux.',
        'Je vais prendre ma revanche sur les forces maléfiques qui ont détruit mon atelier et anéanti mon gagne-pain.',
      ],
      flaws: [
        'Je ferais n\'importe quoi pour mettre la main sur quelque chose de rare ou d\'inestimable.',
        'Je me persuade très vite que les gens cherchent à me rouler dans la farine.',
        'Personne ne doit savoir que j\'ai un jour dérobé l\'or des coffres d\'une guilde.',
        'Je ne suis jamais satisfait de ce que j\'ai, je veux toujours plus.',
        'Je tuerai pour obtenir un titre de noblesse.',
        'Je suis horriblement jaloux de tous ceux qui peuvent surpasser mes créations. Partout où je vais, je suis entouré de rivaux.',
      ],
    },
  },
  {
    id: 'hermit',
    dbName: 'Ermite',
    name: 'Ermite',
    description: 'Reclus solitaire ayant découvert une vérité lors de sa retraite.',
    skillProficiencies: ['medicine', 'religion'],
    toolProficiencies: ['Kit d\'herboriste'],
    languages: 1,
    equipment: ['Étui à parchemins avec notes', 'Couverture d\'hiver', 'Kit d\'herboriste', '5 po'],
    featureName: 'Découverte',
    featureDescription: 'Vous avez fait une découverte unique lors de votre réclusion — connaissance, lieu ou vérité cachée.',
    suggestions: {
      personality: [
        'J\'ai été isolé pendant tellement longtemps que je ne parle que rarement, préférant les gestes et quelques grognements occasionnels.',
        'Je suis toujours serein, même confronté à un désastre.',
        'Le chef de ma communauté avait de sages paroles pour tout sujet, et je suis désireux de partager cette sagesse.',
        'Je ressens une immense empathie pour tous ceux qui souffrent.',
        'Je suis insensible à l\'étiquette et aux attentes sociales.',
        'Je relie tout ce qui m\'arrive à une grande machination cosmique.',
        'Je me perds souvent dans mes pensées et dans la contemplation, ce qui me rend insensible à mon entourage.',
        'Je travaille sur une grande théorie philosophique et j\'aime transmettre mes idées.',
      ],
      ideals: [
        'Bien commun. Mes dons sont destinés à être partagés par tous, et non pour mon propre intérêt.',
        'Logique. Les émotions ne doivent pas brouiller notre sens de ce qui est vrai et faux, ou notre pensée logique.',
        'Libre pensée. L\'investigation et la curiosité sont les piliers du progrès.',
        'Pouvoir. La solitude et la contemplation sont des voies vers le pouvoir mystique ou magique.',
        'Vivre et laisser vivre. Se mêler des affaires des autres n\'apporte que des problèmes.',
        'Connaissance de soi. Si vous vous connaissez, il n\'y a plus rien à savoir.',
      ],
      bonds: [
        'Rien n\'est plus important que les autres membres de mon ermitage, de mon ordre ou de mon association.',
        'Je me suis reclus pour me cacher de ceux qui pourraient encore être en train de me chasser. Un jour je devrais les affronter.',
        'Je suis toujours en quête de l\'illumination. Je la poursuivais dans mon isolement, et elle m\'échappe encore.',
        'Je me suis reclus parce que j\'aimais quelqu\'un que je ne pouvais pas avoir.',
        'Si ma découverte sort à la lumière, elle pourrait détruire le monde.',
        'Mon isolement m\'a donné une grande perspective sur un grand mal et je suis le seul à pouvoir le détruire.',
      ],
      flaws: [
        'Maintenant que je suis revenu à la civilisation, j\'apprécie un peu trop ses plaisirs.',
        'Je nourris de sombres pensées sanguinaires que mon isolement et la méditation n\'ont pas réussi à étouffer.',
        'Je suis dogmatique dans mes pensées et ma philosophie.',
        'Je laisse mon besoin de gagner les discussions éclipser l\'amitié et l\'harmonie.',
        'Je suis prêt à prendre trop de risques pour découvrir un peu de connaissances perdues.',
        'J\'aime garder des secrets et je ne les partage avec personne.',
      ],
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
    featureName: 'Apanage de la noblesse',
    featureDescription: 'Votre statut ouvre les portes de la noblesse. On vous traite en égal.',
    suggestions: {
      personality: [
        'Ma flatterie éloquente fait sentir à toute personne à qui je parle qu\'elle est la plus merveilleuse et la plus importante au monde.',
        'Les gens ordinaires m\'aiment pour ma gentillesse et ma générosité.',
        'Nul ne peut douter en regardant mon allure royale que je suis un cran au-dessus des masses de bouseux.',
        'Je prends grand soin de toujours m\'habiller de mon mieux et de suivre les dernières tendances.',
        'Je n\'aime pas me salir les mains, et je ne veux pas finir dans des logements inappropriés.',
        'Malgré ma noble naissance, je ne me place pas au-dessus des autres. Nous avons tous le même sang.',
        'Mon soutien, une fois perdu, est perdu à jamais.',
        'Si vous me blessez, je vais vous écraser, souiller votre nom et ruiner vos champs.',
      ],
      ideals: [
        'Respect. Le respect m\'est dû de par ma position, mais toutes les personnes, quelle que soit leur position, méritent d\'être traitées avec dignité.',
        'Responsabilité. Il est de mon devoir de respecter l\'autorité de ceux qui sont au-dessus de moi, tout comme ceux qui sont en-dessous doivent me respecter.',
        'Indépendance. Je dois prouver que je peux me débrouiller sans le cocon de ma famille.',
        'Pouvoir. Si je peux obtenir plus de pouvoir, on ne me dira plus ce qu\'il faut faire.',
        'Famille. Le sang est plus épais que l\'eau.',
        'Obligation de noble. Il est de mon devoir de protéger et de soigner les gens au-dessous moi.',
      ],
      bonds: [
        'Je ferais face à n\'importe quel défi pour gagner l\'approbation de ma famille.',
        'L\'alliance de ma maison avec une autre famille noble doit être maintenue à tout prix.',
        'Rien n\'est plus important que les autres membres de ma famille.',
        'Je suis amoureux de l\'héritière d\'une famille que ma propre famille méprise.',
        'Ma loyauté envers mon souverain est inébranlable.',
        'Les gens ordinaires doivent me voir comme un héros du peuple.',
      ],
      flaws: [
        'Je crois secrètement que tout le monde est au-dessous de moi.',
        'Je cache un secret vraiment scandaleux qui pourrait ruiner la réputation de ma famille pour toujours.',
        'J\'entends trop souvent des insultes et des menaces à peine voilées quand on s\'adresse à moi, et je suis prompt à la colère.',
        'J\'ai un désir insatiable de plaisirs charnels.',
        'En fait, le monde tourne autour de moi.',
        'Par mes paroles et mes actions, je fais honte à ma famille.',
      ],
    },
  },
  {
    id: 'outlander',
    dbName: 'Sauvageon',
    name: 'Sauvageon',
    description: 'Grandi dans les terres reculées, loin de la civilisation.',
    skillProficiencies: ['athletics', 'survival'],
    toolProficiencies: ['Instrument de musique au choix'],
    languages: 1,
    equipment: ['Bâton', 'Piège de chasse', 'Trophée animal', 'Vêtements de voyage', '10 po'],
    featureName: 'Éternel vagabond',
    featureDescription: 'Mémoire infaillible des cartes ; trouvez nourriture et eau douce pour 6 personnes en terrain sauvage.',
    suggestions: {
      personality: [
        'J\'éprouve le besoin de voir le monde, c\'est ce qui m\'a fait quitter mon foyer.',
        'Je garde un œil sur mes amis, comme s\'ils étaient les langes d\'un nouveau-né.',
        'J\'ai couru une fois sur 40 kilomètres sans m\'arrêter pour prévenir mon clan de l\'approche d\'une horde d\'orcs. Je le referai s\'il le faut.',
        'J\'ai une leçon pour chaque situation, leçon que j\'ai découverte en observant la nature.',
        'Je n\'accorde pas d\'importance aux riches ou aux gens bien-élevés. L\'argent ou les bonnes manières ne sauveront personne face à un ours-hibou affamé.',
        'Je ramasse toujours ce qui traîne, jouant distraitement avec, et parfois les cassant accidentellement.',
        'Je me sens bien plus dans mon élément entouré d\'animaux que de personnes.',
        'J\'ai, en fait, été élevé par des loups.',
      ],
      ideals: [
        'Changement. La vie est comme les saisons, en changement constant, et nous devons changer avec elle.',
        'Le plus grand bien. Il est de la responsabilité de chacun de faire ce qu\'il y a de mieux pour l\'ensemble de la tribu.',
        'Honneur. Si je me déshonore, je déshonore l\'ensemble de ma tribu.',
        'Puissance. Les plus forts sont destinés à gouverner.',
        'Nature. Le monde naturel est bien plus important que toutes les constructions des peuples civilisés.',
        'Gloire. Je dois gagner la gloire lors de batailles, pour moi même et pour mon clan.',
      ],
      bonds: [
        'Ma famille, mon clan ou ma tribu sont les choses les plus importantes dans ma vie, même lorsqu\'ils sont loin de moi.',
        'Insulter la nature indomptée de mes terres c\'est m\'insulter.',
        'Ma terrible colère s\'abattra sur les malfrats qui ont saccagé ma terre.',
        'Je suis le dernier des membres de ma tribu, et il me revient de faire entrer leur nom dans la légende.',
        'J\'ai eu d\'horribles visions d\'un grand désastre imminent et vais tout faire pour l\'empêcher.',
        'Il est de mon devoir de faire des enfants pour le salut de ma tribu.',
      ],
      flaws: [
        'Je ne suis pas du tout résistant à la bière, au vin et autres boissons alcoolisées.',
        'Il n\'y a pas de place pour la prudence dans une vie pleinement vécue.',
        'Je me rappelle de toutes les injures que j\'ai reçues, et nourris une haine silencieuse envers tous ceux qui m\'ont fait du tort.',
        'Je mets du temps à faire confiance aux membres d\'autres races, tribus ou sociétés.',
        'La violence est ma réponse à presque tous les défis.',
        'N\'espérez pas que je sauve ceux qui ne peuvent pas se sauver eux-même. C\'est la loi de la nature, les forts survivent et les faibles périssent.',
      ],
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
      personality: [
        'J\'utilise de grands mots qui donnent l\'impression d\'une grande érudition.',
        'J\'ai lu tous les livres des plus grandes bibliothèques du monde, ou du moins je me vante de l\'avoir fait.',
        'Je suis habitué à aider ceux qui ne sont pas aussi intelligents que moi, et j\'explique patiemment tout et n\'importe quoi aux autres.',
        'Il n\'y a rien que j\'aime plus au monde qu\'un bon mystère.',
        'Je suis disposé à écouter tous les arguments avant de me faire mon propre jugement.',
        'Je... parle... lentement... quand je parle... à des idiots... soit... presque... à tout le monde... si je... compare... avec moi.',
        'Je suis horriblement et terriblement maladroit dans les situations sociales.',
        'Je suis convaincu que les gens sont toujours en train d\'essayer de me voler mes secrets.',
      ],
      ideals: [
        'Connaissances. Le chemin vers le pouvoir et le progrès personnel passe par la connaissance.',
        'Beauté. Ce qui est beau nous montre au-delà de cela ce qui est vrai.',
        'Logique. Les émotions ne doivent pas obscurcir notre pensée logique.',
        'Sans limites. Rien ne doit entraver les infinies possibilités inhérentes à toute existence.',
        'Pouvoir. La connaissance est la voie vers le pouvoir et la domination.',
        'Progrès personnel. Le but d\'une vie d\'étude est l\'amélioration de soi-même.',
      ],
      bonds: [
        'Il est de mon devoir de protéger mes élèves.',
        'Je possède un texte ancien qui renferme de terribles secrets qui ne doivent pas tomber entre de mauvaises mains.',
        'Je travaille à préserver une bibliothèque, une université, un scriptorium ou un monastère.',
        'Le travail de ma vie est une série de livres sur un domaine spécifique de connaissance.',
        'J\'ai cherché toute ma vie la réponse à une question.',
        'J\'ai vendu mon âme pour de la connaissance. J\'espère faire de grandes choses et la récupérer en retour.',
      ],
      flaws: [
        'Je suis facilement distrait par la promesse d\'information.',
        'La plupart des gens crient et courent quand ils voient un démon. Moi je m\'arrête et je prends des notes sur son anatomie.',
        'Décrypter un mystère ancien vaut le prix d\'une civilisation.',
        'Je privilégie les solutions compliquées aux dépens des solutions faciles.',
        'Je parle sans vraiment penser mes mots, insultant invariablement les autres.',
        'Je ne peux pas garder un secret pour sauver ma vie, ou n\'importe qui d\'autre.',
      ],
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
    featureName: 'Place à bord',
    featureDescription: 'Obtenez un passage gratuit pour vous et vos compagnons sur n\'importe quel navire.',
    suggestions: {
      personality: [
        'Mes amis savent qu\'ils peuvent compter sur moi, quoi qu\'il arrive.',
        'Je travaille dur donc je peux me lâcher totalement lorsque le travail est terminé.',
        'J\'aime naviguer vers de nouveaux ports et me faire de nouveaux amis autour d\'une chope de bière.',
        'J\'altère un peu les faits pour créer une bonne histoire.',
        'Pour moi, une taverne bruyante est le meilleur moyen d\'apprendre à connaître une ville.',
        'Je ne laisse jamais passer un pari amical.',
        'Mon langage est aussi pourri qu\'un nid d\'otyugh.',
        'J\'aime le travail bien fait, en particulier si je peux convaincre quelqu\'un d\'autre de le faire à ma place.',
      ],
      ideals: [
        'Respect. Ce qui maintient l\'unité sur un navire est le respect mutuel qu\'il y a entre le capitaine et son équipage.',
        'Justice. Nous faisons tous notre travail, nous avons donc tous notre part de récompense.',
        'Liberté. La mer c\'est la liberté, la liberté d\'aller partout et de faire ce que l\'on veut.',
        'Domination. Je suis un prédateur, et les autres bateaux sur la mer sont mes proies.',
        'Peuple. Je m\'engage pour mes coéquipiers, pas pour des idéaux.',
        'Aspiration. Un jour j\'aurai mon propre navire et suivrai ma propre destiné.',
      ],
      bonds: [
        'Je reste loyal envers mon premier capitaine, tout passe après lui.',
        'Le navire est le plus important, les équipages et les capitaines vont et viennent.',
        'Je me rappellerai toujours de mon premier navire.',
        'Dans une ville portuaire, j\'ai une maîtresse dont les yeux ont failli m\'arracher à la mer.',
        'J\'ai été trompé sur la part de profits qui me revient de droit, et je vais récupérer mon dû.',
        'Des pirates sans pitié ont tué mon capitaine et les autres membres d\'équipage, ont pillé notre navire et m\'ont laissé pour mort. La vengeance sera mienne.',
      ],
      flaws: [
        'Je suis les ordres, même si je pense qu\'ils sont mauvais.',
        'Je dirais n\'importe quoi pour éviter d\'avoir du travail supplémentaire.',
        'Lorsque quelqu\'un met en doute mon courage, je ne recule devant rien pour le faire changer d\'avis, même si les situations sont extrêmement périlleuses.',
        'Lorsque je commence à boire, il est difficile de me faire arrêter.',
        'Je n\'y peux rien mais les poches des autres perdent leurs pièces et leurs babioles lorsque je passe dans le coin.',
        'Mon orgueil me mènera probablement à ma perte.',
      ],
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
    featureName: 'Grade militaire',
    featureDescription: 'Les soldats et mercenaires reconnaissent votre rang et peuvent vous obéir.',
    suggestions: {
      personality: [
        'Je suis toujours poli et respectueux.',
        'Je suis hanté par les souvenirs de la guerre. Je ne peux pas sortir les images de violence de ma tête.',
        'J\'ai perdu beaucoup d\'amis, et je suis lent à m\'en faire de nouveaux.',
        'Je connais plein d\'histoires inspirantes et effrayantes de mon expérience militaire qui se révèlent pertinentes dans de nombreuses situations de combat.',
        'Je peux faire baisser le regard d\'un chien des enfers sans broncher.',
        'J\'aime être fort et casser des choses.',
        'J\'ai un sens de l\'humour brut.',
        'J\'affronte les problèmes de front. Une solution simple et directe est le meilleur chemin vers le succès.',
      ],
      ideals: [
        'Bonté. Notre sort est de donner notre vie pour la défense des autres.',
        'Responsabilité. Je fais ce que je dois faire et j\'obéis aux autorités quand elles sont justes.',
        'Indépendance. Quand les gens suivent les ordres aveuglément, ils embrassent une sorte de tyrannie.',
        'Puissance. Dans la vie comme à la guerre, le plus fort gagne.',
        'Vivre et laisser vivre. Les idéaux ne méritent pas qu\'on tue ou qu\'on fasse la guerre pour eux.',
        'Nation. Ma ville, mon pays ou les miens sont tout ce qui importe.',
      ],
      bonds: [
        'Je voudrais pouvoir encore donner ma vie pour les gens avec qui j\'ai servi.',
        'Quelqu\'un m\'a sauvé la vie sur le champ de bataille. À ce jour, je ne pourrais jamais laisser un ami derrière.',
        'Mon honneur est ma vie.',
        'Je n\'oublierai jamais la défaite écrasante que ma compagnie a subie ni les ennemis qui nous l\'ont infligée.',
        'Ceux qui se battent à mes côtés sont ceux pour qui cela vaut la peine de mourir.',
        'Je me bats pour ceux qui ne peuvent pas se battre pour eux-mêmes.',
      ],
      flaws: [
        'L\'ennemi monstrueux que nous avons affronté dans la bataille me fait encore frémir de peur.',
        'J\'ai peu de respect pour celui qui n\'est pas un réel guerrier.',
        'J\'ai commis une terrible erreur durant une bataille qui a coûté la vie à de nombreuses personnes et je ferais n\'importe quoi pour garder cette erreur secrète.',
        'Ma haine pour mes ennemis est aveugle et irraisonnée.',
        'J\'obéis à la loi, même si elle provoque la misère.',
        'Je préfère manger mon armure plutôt qu\'admettre que je me suis trompé.',
      ],
    },
  },
  {
    id: 'urchin',
    dbName: 'Enfant des rues',
    name: 'Enfant des rues',
    description: 'Survivant des rues formé à la débrouillardise depuis l\'enfance.',
    skillProficiencies: ['sleight_of_hand', 'stealth'],
    toolProficiencies: ['Kit de déguisement', 'Outils de voleur'],
    languages: 0,
    equipment: ['Petit couteau', 'Carte de la ville', 'Jeton de bonne chance', 'Vêtements communs', '10 po'],
    featureName: 'Secrets de la ville',
    featureDescription: 'Déplacez-vous deux fois plus vite entre deux points d\'une ville grâce aux passages dérobés.',
    suggestions: {
      personality: [
        'Je cache des restes de nourriture et des babioles dans mes poches.',
        'Je pose beaucoup de questions.',
        'J\'aime me glisser dans des espaces étroits, là où personne ne peut m\'atteindre.',
        'Je dors le dos contre un mur ou un arbre, avec tout ce que je possède empaqueté entre mes bras.',
        'Je mange comme un cochon et j\'ai de mauvaises manières.',
        'Je pense que tous ceux qui sont gentils avec moi ont en réalité une mauvaise intention.',
        'Je n\'aime pas me laver.',
        'Je dis crûment ce que les autres insinuent ou cachent.',
      ],
      ideals: [
        'Respect. Tout le monde, pauvre ou riche, mérite d\'être respecté.',
        'Communauté. Nous devons prendre soin les uns des autres, parce que personne d\'autre ne le fera.',
        'Changement. Les faibles doivent s\'élever, et les élites et les puissants doivent être mis à terre. Le changement est dans la nature des choses.',
        'Châtiment. Les riches ont besoin qu\'on leur montre que la vie et la mort ne font pas de différence avec ceux qui vivent dans le caniveau.',
        'Peuple. J\'aide ceux qui m\'aident, c\'est ce qui nous permet de rester en vie.',
        'Aspiration. Je vais leur montrer que je mérite une vie meilleure.',
      ],
      bonds: [
        'Ma ville, ou ma cité, est ma maison, et je me battrai pour la défendre.',
        'Je finance un orphelinat pour éviter que d\'autres subissent la même chose que moi.',
        'Je dois ma survie à un autre enfant des rues qui m\'a appris à vivre sans abris.',
        'J\'ai une dette que je ne pourrai jamais rembourser envers la personne qui m\'a prise en pitié.',
        'J\'ai échappé à mon sort en volant une personne très importante, et je suis recherché pour cela.',
        'Personne d\'autre ne peut endurer les épreuves que j\'ai surmontées.',
      ],
      flaws: [
        'Si je suis en infériorité numérique, je fuis le combat.',
        'L\'or me paraît être une énorme quantité d\'argent, et je ferai n\'importe quoi pour en obtenir toujours plus.',
        'Je ne ferai jamais pleinement confiance à quelqu\'un d\'autre qu\'à moi-même.',
        'Je préfère tuer quelqu\'un dans son sommeil plutôt que de combattre à la loyale.',
        'Ce n\'est pas du vol si j\'en ai plus besoin que quelqu\'un d\'autre.',
        'Les gens qui ne peuvent pas prendre soin d\'eux-même n\'ont que ce qu\'ils méritent.',
      ],
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

// Emplacements de sorts : SOURCE UNIQUE dans shared/rules/spellSlots.ts (dédup point 6c). Ré-exports
// sous les noms historiques pour ne pas toucher les importateurs (useCharacterBuilder, useLevelUp,
// LevelUpStepSpells).
export {
  slotsForLevel as spellSlotsAtLevel,
  maxSpellLevelForLevel as maxSpellLevelAtLevel,
} from '~~/shared/rules/spellSlots'

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

// Helpers de calcul purs : SOURCE UNIQUE dans shared/rules/math.ts (dédup point 6c-3). Ré-exports
// sous les noms historiques pour ne pas toucher les importateurs.
export {
  profBonusAtLevel,
  abilityMod,
  formatMod,
  hpAtLevel,
} from '~~/shared/rules/math'
